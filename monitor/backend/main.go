package main

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/prateeks007/PulseWatch/monitor/backend/middleware"
	"github.com/prateeks007/PulseWatch/monitor/backend/models"
	"github.com/prateeks007/PulseWatch/monitor/backend/services"
	"github.com/prateeks007/PulseWatch/monitor/backend/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/robfig/cron/v3"
)

func main() {
	// Load environment variables
	_ = godotenv.Load()
	
	// Initialize services
	storageService, err := services.NewStorageService()
	if err != nil {
		fmt.Printf("❌ Failed to initialize storage service: %v\n", err)
		os.Exit(1)
	}
	monitorService := services.NewMonitorService()
	sslService := services.NewSSLService()
	cleanupService := services.NewCleanupService(storageService.GetStatusesCollection())
	discordService := services.NewDiscordService()

	// Load any existing data
	// if err := storageService.LoadFromFiles(); err != nil {
	// 	fmt.Printf("Warning: Could not load existing data: %v\n", err)
	// }

	// Create a test website if none exist
	websites, err := storageService.GetWebsites()
	if err != nil {
		fmt.Printf("⚠️ Warning: Could not load websites: %v\n", err)
		websites = []models.Website{}
	}
	if len(websites) == 0 {
		testWebsites := []models.Website{
			{
				ID:       "1",
				Name:     "Google",
				URL:      "https://www.google.com",
				Interval: 60, // Check every 60 seconds
			},
			{
				ID:       "2",
				Name:     "GitHub",
				URL:      "https://github.com",
				Interval: 60,
			},
			{
				ID:       "3",
				Name:     "StackOverflow",
				URL:      "https://stackoverflow.com",
				Interval: 60,
			},
		}

		// Save the test websites
		for _, website := range testWebsites {
			if err := storageService.SaveWebsite(website); err != nil {
				fmt.Printf("Error saving website: %v\n", err)
				return
			}
			fmt.Println("Added website to monitor:", website.Name)
		}
	} else {
		fmt.Printf("Loaded %d websites to monitor\n", len(websites))
	}

	// Create a new cron scheduler
	c := cron.New()

	// Track previous statuses to avoid spam
	previousStatuses := make(map[string]bool)

	// Function to check all websites (uptime/latency)
	checkAllWebsites := func() {
		websites, err := storageService.GetWebsites()
		if err != nil {
			fmt.Printf("❌ Error fetching websites: %v\n", err)
			return
		}
		fmt.Printf("🔍 Checking %d websites...\n", len(websites))

		for _, website := range websites {
			fmt.Printf("Checking %s (%s)...\n", website.Name, website.URL)

			status, err := monitorService.CheckWebsite(website)
			if err != nil {
				fmt.Printf("  Error: %v\n", err)
				// Only alert if status changed from up to down
				if prevStatus, exists := previousStatuses[website.ID]; !exists || prevStatus {
					// Get user's Discord webhook and send alert
					if webhookURL, err := storageService.GetUserDiscordWebhook(website.UserID); err == nil && webhookURL != "" {
						discordService.SendAlertToWebhook(webhookURL, website, false, 0)
					}
				}
				previousStatuses[website.ID] = false
			} else {
				if err := storageService.SaveStatus(status); err != nil {
					fmt.Printf("  Error saving status: %v\n", err)
				}

				// Only alert on status changes
				if prevStatus, exists := previousStatuses[website.ID]; exists && prevStatus != status.IsUp {
					// Get user's Discord webhook and send alert
					if webhookURL, err := storageService.GetUserDiscordWebhook(website.UserID); err == nil && webhookURL != "" {
						discordService.SendAlertToWebhook(webhookURL, website, status.IsUp, status.ResponseTime)
					}
				} else if !exists && !status.IsUp {
					// First check and it's down
					if webhookURL, err := storageService.GetUserDiscordWebhook(website.UserID); err == nil && webhookURL != "" {
						discordService.SendAlertToWebhook(webhookURL, website, false, status.ResponseTime)
					}
				}
				previousStatuses[website.ID] = status.IsUp

				fmt.Printf("  Status: %v (Code: %d, Response time: %d ms)\n",
					status.IsUp, status.StatusCode, status.ResponseTime)
			}
		}

		fmt.Println("Next check in 60 seconds...")
	}

	// Run an initial uptime check on start
	checkAllWebsites()

	// Run SSL checks one time at startup
	go func() {
		websites, err := storageService.GetWebsites()
		if err != nil {
			fmt.Printf("⚠️ Failed to get websites for SSL check: %v\n", err)
			return
		}
		for _, w := range websites {
			info, err := sslService.Check(w.URL)
			if err != nil || info == nil {
				continue
			}
			info.WebsiteID = w.ID
			if err := storageService.SaveSSL(*info); err != nil {
				fmt.Printf("⚠️ Failed to save SSL info for %s: %v\n", w.Name, err)
			}
		}
	}()

	// Schedule regular uptime checks every minute
	c.AddFunc("@every 1m", checkAllWebsites)

	// Schedule daily SSL checks (once a day is enough)
	c.AddFunc("@daily", func() {
		websites, err := storageService.GetWebsites()
		if err != nil {
			fmt.Printf("⚠️ Failed to get websites for daily SSL check: %v\n", err)
			return
		}
		for _, w := range websites {
			info, err := sslService.Check(w.URL)
			if err != nil || info == nil {
				continue
			}
			info.WebsiteID = w.ID
			if err := storageService.SaveSSL(*info); err != nil {
				fmt.Printf("⚠️ Failed to save SSL info for %s: %v\n", w.Name, err)
			}
		}
	})

	// Schedule weekly cleanup (keep 30 days of data)
	c.AddFunc("@weekly", func() {
		if err := cleanupService.CleanupOldStatuses(30); err != nil {
			fmt.Printf("⚠️ Failed to cleanup old statuses: %v\n", err)
		}
		if err := cleanupService.CleanupOrphanedStatuses(storageService.GetWebsitesCollection()); err != nil {
			fmt.Printf("⚠️ Failed to cleanup orphaned statuses: %v\n", err)
		}
	})

	// Start the cron scheduler
	c.Start()

	// Start keep-alive service for Render free tier
	go startKeepAlive()

	// Create a fiber app for the REST API
	app := fiber.New()

	// Add CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "*",
	}))

	// Define API routes
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Website Monitor API is running!")
	})

	// Health check endpoint for keep-alive
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"time": time.Now(),
			"uptime": time.Since(time.Now()).String(),
		})
	})

	// Get all websites (protected)
	app.Get("/api/websites", middleware.AuthMiddleware(), func(c *fiber.Ctx) error {
		userID := c.Locals("user_id").(string)
		websites, err := storageService.GetWebsitesByUser(userID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch websites", "details": err.Error()})
		}
		return c.JSON(websites)
	})

	// Get website by ID (protected)
	app.Get("/api/websites/:id", middleware.AuthMiddleware(), func(c *fiber.Ctx) error {
		id := c.Params("id")
		userID := c.Locals("user_id").(string)
		website, err := storageService.GetWebsiteByUser(id, userID)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "Website not found"})
		}
		return c.JSON(website)
	})

	// Get SSL info for a website (protected)
	app.Get("/api/websites/:id/ssl", middleware.AuthMiddleware(), func(c *fiber.Ctx) error {
		id := c.Params("id")
		userID := c.Locals("user_id").(string)
		// find website (user-specific)
		site, err := storageService.GetWebsiteByUser(id, userID)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "Website not found"})
		}

		// Try cached
		if cached := storageService.GetSSL(id); cached != nil {
			return c.JSON(cached)
		}

		// Compute now and store
		info, err := sslService.Check(site.URL)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		info.WebsiteID = id
		_ = storageService.SaveSSL(*info)
		return c.JSON(info)
	})

	// Get SSL summary (protected)
	app.Get("/api/ssl/summary", middleware.AuthMiddleware(), func(c *fiber.Ctx) error {
		userID := c.Locals("user_id").(string)
		sites, err := storageService.GetWebsitesByUser(userID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch websites", "details": err.Error()})
		}
		var soonest *models.SSLInfo
		var soonestSite *models.Website

		for _, site := range sites {
			if ssl := storageService.GetSSL(site.ID); ssl != nil {
				if soonest == nil || ssl.ValidTo < soonest.ValidTo {
					soonest = ssl
					soonestSite = &site
				}
			}
		}

		if soonest == nil || soonestSite == nil {
			return c.JSON(fiber.Map{"message": "No SSL data available"})
		}

		return c.JSON(fiber.Map{
			"website_id": soonestSite.ID,
			"name":       soonestSite.Name,
			"valid_to":   soonest.ValidTo,
			"days_left":  int(time.Until(time.Unix(soonest.ValidTo, 0)).Hours() / 24),
		})
	})

	// Get status history for a website (protected)
	app.Get("/api/websites/:id/status", middleware.AuthMiddleware(), func(c *fiber.Ctx) error {
		id := c.Params("id")
		statuses, err := storageService.GetWebsiteStatuses(id)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch status history", "details": err.Error()})
		}

		// Convert timestamps to readable format
		type StatusWithTime struct {
			models.WebsiteStatus
			CheckedAtFormatted string `json:"checked_at_formatted"`
		}

		formattedStatuses := make([]StatusWithTime, len(statuses))
		for i, status := range statuses {
			formattedStatuses[i] = StatusWithTime{
				WebsiteStatus:      status,
				CheckedAtFormatted: time.Unix(status.CheckedAt, 0).Format(time.RFC1123),
			}
		}

		return c.JSON(formattedStatuses)
	})

	// Add a new website (protected)
	app.Post("/api/websites", middleware.AuthMiddleware(), func(c *fiber.Ctx) error {
		userID := c.Locals("user_id").(string)
		
		// Check website limit (30 websites per user)
		existingWebsites, err := storageService.GetWebsitesByUser(userID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to check existing websites"})
		}
		if len(existingWebsites) >= 30 {
			return c.Status(400).JSON(fiber.Map{
				"error": "Website limit reached",
				"message": "Free accounts are limited to 30 websites. Please upgrade for more.",
			})
		}
		
		var website models.Website
		if err := c.BodyParser(&website); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": "Invalid request body",
				"details": err.Error(),
			})
		}

		// Validate input data
		if validationErrors := utils.ValidateWebsite(website.Name, website.URL); len(validationErrors) > 0 {
			return c.Status(400).JSON(fiber.Map{
				"error": "Validation failed",
				"validation_errors": validationErrors,
			})
		}

		// Check for duplicate URL (using normalized URLs)
		allWebsites, err := storageService.GetWebsites()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to check existing websites"})
		}
		normalizedNewURL := utils.NormalizeURL(website.URL)
		for _, existing := range allWebsites {
			normalizedExistingURL := utils.NormalizeURL(existing.URL)
			if normalizedExistingURL == normalizedNewURL {
				return c.Status(400).JSON(fiber.Map{
					"error": "Validation failed",
					"validation_errors": []utils.ValidationError{{
						Field:   "url",
						Message: fmt.Sprintf("A website with this URL already exists: %s", existing.Name),
					}},
				})
			}
		}

		// Generate ID if missing
		if website.ID == "" {
			website.ID = fmt.Sprintf("%d", time.Now().UnixNano())
		}
		// Enforce minimum interval (60 seconds)
		if website.Interval == 0 || website.Interval < 60 {
			website.Interval = 60
		}
		
		// Set user ID
		website.UserID = userID

		if err := storageService.SaveWebsite(website); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to save website"})
		}

		// Kick an immediate SSL check (non-blocking) and upsert result
		go func(w models.Website) {
			if info, err := sslService.Check(w.URL); err == nil && info != nil {
				info.WebsiteID = w.ID
				_ = storageService.SaveSSL(*info)
			}
		}(website)

		return c.Status(201).JSON(website)
	})

	// Delete a website (protected)
	app.Delete("/api/websites/:id", middleware.AuthMiddleware(), func(c *fiber.Ctx) error {
		id := c.Params("id")
		userID := c.Locals("user_id").(string)
		if err := storageService.DeleteWebsiteByUser(id, userID); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to delete website"})
		}
		return c.JSON(fiber.Map{"success": true})
	})

	// === USER SETTINGS ENDPOINTS ===
	// These endpoints manage user-specific settings like Discord webhooks

	// Get user settings (protected)
	app.Get("/api/user/settings", middleware.AuthMiddleware(), func(c *fiber.Ctx) error {
		userID := c.Locals("user_id").(string)
		user, err := storageService.GetUser(userID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch user settings"})
		}
		if user == nil {
			// Return default settings if user not found
			return c.JSON(fiber.Map{
				"discord_webhook_url": "",
				"message": "To enable Discord alerts, add your webhook URL below",
			})
		}
		return c.JSON(fiber.Map{
			"discord_webhook_url": user.DiscordWebhookURL,
			"message": func() string {
				if user.DiscordWebhookURL == "" {
					return "To enable Discord alerts, add your webhook URL below"
				}
				return "Discord alerts are enabled"
			}(),
		})
	})

	// Update user settings (protected)
	app.Put("/api/user/settings", middleware.AuthMiddleware(), func(c *fiber.Ctx) error {
		userID := c.Locals("user_id").(string)
		
		var requestBody struct {
			DiscordWebhookURL string `json:"discord_webhook_url"`
		}
		
		if err := c.BodyParser(&requestBody); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
		}
		
		// Get existing user or create new one
		user, err := storageService.GetUser(userID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch user"})
		}
		
		if user == nil {
			// Create new user
			user = &models.User{
				ID: userID,
			}
		}
		
		user.DiscordWebhookURL = requestBody.DiscordWebhookURL
		
		if err := storageService.SaveUser(*user); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to save user settings"})
		}
		
		return c.JSON(fiber.Map{
			"success": true,
			"message": "Settings updated successfully",
		})
	})

	// === PUBLIC STATUS PAGE ENDPOINTS ===
	// These endpoints are public (no auth required) for status pages

	// Get public status overview
	app.Get("/api/public/status", func(c *fiber.Ctx) error {
		websites, err := storageService.GetWebsites()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch websites"})
		}

		type PublicWebsiteStatus struct {
			ID           string  `json:"id"`
			Name         string  `json:"name"`
			URL          string  `json:"url"`
			IsUp         *bool   `json:"is_up"`
			ResponseTime *int64  `json:"response_time_ms"`
			LastChecked  *int64  `json:"last_checked"`
			Uptime24h    float64 `json:"uptime_24h"`
			Uptime7d     float64 `json:"uptime_7d"`
		}

		var publicStatuses []PublicWebsiteStatus
		allUp := true

		for _, website := range websites {
			// Get latest status
			statuses, err := storageService.GetWebsiteStatuses(website.ID)
			if err != nil || len(statuses) == 0 {
				publicStatuses = append(publicStatuses, PublicWebsiteStatus{
					ID:   website.ID,
					Name: website.Name,
					URL:  website.URL,
				})
				allUp = false
				continue
			}

			latest := statuses[0]
			if !latest.IsUp {
				allUp = false
			}

			// Calculate uptime percentages
			uptime24h := calculateUptimePercentage(statuses, 24*60) // 24 hours in minutes
			uptime7d := calculateUptimePercentage(statuses, 7*24*60) // 7 days in minutes

			publicStatuses = append(publicStatuses, PublicWebsiteStatus{
				ID:           website.ID,
				Name:         website.Name,
				URL:          website.URL,
				IsUp:         &latest.IsUp,
				ResponseTime: &latest.ResponseTime,
				LastChecked:  &latest.CheckedAt,
				Uptime24h:    uptime24h,
				Uptime7d:     uptime7d,
			})
		}

		return c.JSON(fiber.Map{
			"overall_status": map[string]interface{}{
				"all_up":     allUp,
				"status":     func() string { if allUp { return "operational" } else { return "degraded" } }(),
				"updated_at": time.Now().Unix(),
			},
			"services": publicStatuses,
		})
	})

	// Get public status for a specific website
	app.Get("/api/public/status/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		statuses, err := storageService.GetWebsiteStatuses(id)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch status history"})
		}

		// Return last 48 hours of data for public view
		limit := 48 * 60 // 48 hours worth of minute-by-minute data
		if len(statuses) > limit {
			statuses = statuses[:limit]
		}

		return c.JSON(statuses)
	})

	// Start the API server in a separate goroutine
	go func() {
		port := os.Getenv("PORT")
		if port == "" {
			port = "3000" // fallback for local dev
		}
		addr := "0.0.0.0:" + port

		fmt.Printf("Starting API server on http://%s\n", addr)
		if err := app.Listen(addr); err != nil {
			fmt.Printf("API server error: %v\n", err)
		}
	}()

	fmt.Println("Website monitoring service started. Press Ctrl+C to exit.")

	// Keep the program running
	select {}
}

// Keep-alive function to prevent Render free tier spin-down
func startKeepAlive() {
	serviceURL := os.Getenv("RENDER_EXTERNAL_URL")
	if serviceURL == "" {
		serviceURL = "https://pulsewatch-av56.onrender.com" // Replace with your actual URL
	}

	ticker := time.NewTicker(10 * time.Minute)
	go func() {
		for range ticker.C {
			resp, err := http.Get(serviceURL + "/health")
			if err != nil {
				fmt.Printf("⚠️ Keep-alive ping failed: %v\n", err)
			} else {
				resp.Body.Close()
				fmt.Printf("💓 Keep-alive ping successful at %v\n", time.Now())
			}
		}
	}()
}

// Helper function to calculate uptime percentage
func calculateUptimePercentage(statuses []models.WebsiteStatus, minutes int) float64 {
	if len(statuses) == 0 {
		return 0.0
	}

	cutoffTime := time.Now().Add(-time.Duration(minutes) * time.Minute).Unix()
	upCount := 0
	totalCount := 0

	for _, status := range statuses {
		if status.CheckedAt >= cutoffTime {
			totalCount++
			if status.IsUp {
				upCount++
			}
		}
	}

	if totalCount == 0 {
		return 0.0
	}

	return (float64(upCount) / float64(totalCount)) * 100.0
}
