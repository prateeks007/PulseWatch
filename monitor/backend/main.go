package main

import (
	"fmt"
	"os"
	"time"

	"github.com/prateeks007/PulseWatch/monitor/backend/models"
	"github.com/prateeks007/PulseWatch/monitor/backend/services"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/robfig/cron/v3"
)

func main() {
	// Initialize services
	storageService, err := services.NewStorageService()
	if err != nil {
		fmt.Printf("❌ Failed to initialize storage service: %v\n", err)
		os.Exit(1)
	}
	monitorService := services.NewMonitorService()
	sslService := services.NewSSLService()

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
			} else {
				if err := storageService.SaveStatus(status); err != nil {
					fmt.Printf("  Error saving status: %v\n", err)
				}

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

	// Start the cron scheduler
	c.Start()

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

	// Get all websites
	app.Get("/api/websites", func(c *fiber.Ctx) error {
		websites, err := storageService.GetWebsites()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch websites", "details": err.Error()})
		}
		return c.JSON(websites)
	})

	// Get website by ID
	app.Get("/api/websites/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		websites, err := storageService.GetWebsites()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch websites", "details": err.Error()})
		}

		for _, website := range websites {
			if website.ID == id {
				return c.JSON(website)
			}
		}

		return c.Status(404).JSON(fiber.Map{"error": "Website not found"})
	})

	// Get SSL info for a website (cached; computes on first request)
	app.Get("/api/websites/:id/ssl", func(c *fiber.Ctx) error {
		id := c.Params("id")
		// find website
		websites, err := storageService.GetWebsites()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch websites", "details": err.Error()})
		}
		var site *models.Website
		for _, w := range websites {
			if w.ID == id {
				site = &w
				break
			}
		}
		if site == nil {
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

	// Get SSL summary (earliest expiry)
	app.Get("/api/ssl/summary", func(c *fiber.Ctx) error {
		sites, err := storageService.GetWebsites()
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
			"name":       soonestSite.Name, // ✅ just the string, not the whole struct
			"valid_to":   soonest.ValidTo,
			"days_left":  int(time.Until(time.Unix(soonest.ValidTo, 0)).Hours() / 24),
		})
	})

	// Get status history for a website
	app.Get("/api/websites/:id/status", func(c *fiber.Ctx) error {
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

	// Add a new website
	app.Post("/api/websites", func(c *fiber.Ctx) error {
		var website models.Website
		if err := c.BodyParser(&website); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
		}

		// Generate ID if missing
		if website.ID == "" {
			website.ID = fmt.Sprintf("%d", time.Now().UnixNano())
		}
		if website.Interval == 0 {
			website.Interval = 60
		}

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

	// Delete a website
	app.Delete("/api/websites/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		if err := storageService.DeleteWebsite(id); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to delete website"})
		}
		return c.JSON(fiber.Map{"success": true})
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
