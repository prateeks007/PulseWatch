package main

import (
	"fmt"
	"net/http"
	"os"
	"time"
)

// Add this function to your main.go
func startKeepAlive() {
	serviceURL := os.Getenv("RENDER_EXTERNAL_URL")
	if serviceURL == "" {
		serviceURL = "https://pulsewatch-av56.onrender.com" // Your actual URL
	}

	ticker := time.NewTicker(10 * time.Minute)
	go func() {
		for range ticker.C {
			resp, err := http.Get(serviceURL + "/health")
			if err != nil {
				fmt.Printf("Keep-alive ping failed: %v\n", err)
			} else {
				resp.Body.Close()
				fmt.Printf("Keep-alive ping successful at %v\n", time.Now())
			}
		}
	}()
}

// Add health endpoint to your main.go routes
// app.Get("/health", func(c *fiber.Ctx) error {
//     return c.JSON(fiber.Map{"status": "ok", "time": time.Now()})
// })