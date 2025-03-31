package main

import (
	"fmt"

	"monitor/models"
	"monitor/services"

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
		testWebsite := models.Website{
			ID:       "1",
			Name:     "Google",
			URL:      "https://www.google.com",
			Interval: 60, // Check every 60 seconds
		}

		// Save the test website
		if err := storageService.SaveWebsite(testWebsite); err != nil {
			fmt.Printf("Error saving website: %v\n", err)
			return
		}

		fmt.Println("Added website to monitor:", testWebsite.Name)
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

	fmt.Println("Website monitoring service started. Press Ctrl+C to exit.")

	// Keep the program running
	select {}
}
