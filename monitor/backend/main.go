package main

import (
	"fmt"
	"time"

	"github.com/prateeks007/PulseWatch/monitor/backend/models"
	"github.com/prateeks007/PulseWatch/monitor/backend/services"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/robfig/cron/v3"
)

func main() {
	// Initialize services
	storageService := services.NewStorageService()
	monitorService := services.NewMonitorService()

	// Load any existing data
	if err := storageService.LoadFromFiles(); err != nil {
		fmt.Printf("Warning: Could not load existing data: %v\n", err)
	}

	// Create a test website if none exist
	websites := storageService.GetWebsites()
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

	// Function to check all websites
	checkAllWebsites := func() {
		websites := storageService.GetWebsites()
		fmt.Printf("Checking %d websites...\n", len(websites))

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

	// Run an initial check
	checkAllWebsites()

	// Schedule regular checks every minute
	c.AddFunc("@every 1m", checkAllWebsites)

	// Start the cron scheduler
	c.Start()

	// Create a fiber app for the REST API
	app := fiber.New()

	// Add CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE",
	}))

	// Define API routes
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Website Monitor API is running!")
	})

	// Get all websites
	app.Get("/api/websites", func(c *fiber.Ctx) error {
		return c.JSON(storageService.GetWebsites())
	})

	// Get website by ID
	app.Get("/api/websites/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		websites := storageService.GetWebsites()

		for _, website := range websites {
			if website.ID == id {
				return c.JSON(website)
			}
		}

		return c.Status(404).JSON(fiber.Map{"error": "Website not found"})
	})

	// Get status history for a website
	app.Get("/api/websites/:id/status", func(c *fiber.Ctx) error {
		id := c.Params("id")
		statuses := storageService.GetWebsiteStatuses(id)

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

	// Start the API server in a separate goroutine
	go func() {
		fmt.Println("Starting API server on http://localhost:3000")
		if err := app.Listen(":3000"); err != nil {
			fmt.Printf("API server error: %v\n", err)
		}
	}()

	fmt.Println("Website monitoring service started. Press Ctrl+C to exit.")

	// Keep the program running
	select {}
}
