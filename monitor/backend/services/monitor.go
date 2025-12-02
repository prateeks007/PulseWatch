package services

import (
	"fmt"
	"net/http"
	"time"

	"github.com/prateeks007/PulseWatch/monitor/backend/models"
)

// MonitorService checks websites
type MonitorService struct {
	client *http.Client
}

// NewMonitorService creates a new monitor service
func NewMonitorService() *MonitorService {
	return &MonitorService{
		client: &http.Client{
			Timeout: time.Second * 30, // Wait up to 30 seconds
		},
	}
}

// CheckWebsite checks if a website is up
func (s *MonitorService) CheckWebsite(website models.Website) (models.WebsiteStatus, error) {
	// Record when we started
	startTime := time.Now()

	// Create a status object
	status := models.WebsiteStatus{
		WebsiteID: website.ID,
		CheckedAt: time.Now().Unix(),
	}

	// Create request with User-Agent header
	req, err := http.NewRequest("GET", website.URL, nil)
	if err != nil {
		status.IsUp = false
		status.StatusCode = 0
		fmt.Printf("[DEBUG] %s request creation failed: %v\n", website.URL, err)
		return status, err
	}
	req.Header.Set("User-Agent", "PulseWatch-Monitor/1.0")
	
	// Try to access the website
	resp, err := s.client.Do(req)

	// Calculate how long it took
	responseTime := time.Since(startTime).Milliseconds()
	status.ResponseTime = responseTime

	// If there was an error, the site is down
	if err != nil {
		status.IsUp = false
		status.StatusCode = 0
		// 👇 log for debug with detailed error
		fmt.Printf("[DEBUG] %s FAILED, respTime=%dms, error: %v\n", website.URL, responseTime, err)
		return status, err
	}
	defer resp.Body.Close() // Always close the response

	// Record the HTTP status code
	status.StatusCode = resp.StatusCode

	// Site is "up" if status code indicates server is responding
	// 200-399: Normal responses (up)
	// 403: Forbidden but server is up
	// 429: Rate limited but server is up
	status.IsUp = (resp.StatusCode >= 200 && resp.StatusCode < 400) || 
				  resp.StatusCode == 403 || 
				  resp.StatusCode == 429

	if status.IsUp {
		fmt.Printf("[DEBUG] %s UP %dms (Code: %d)\n", website.URL, status.ResponseTime, status.StatusCode)
	} else {
		fmt.Printf("[DEBUG] %s DOWN %dms (Code: %d)\n", website.URL, status.ResponseTime, status.StatusCode)
	}

	return status, nil
}
