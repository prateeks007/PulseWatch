package services

import (
	"net/http"
	"time"
	
	"monitor/models"
)

// MonitorService checks websites
type MonitorService struct {
	client *http.Client
}

// NewMonitorService creates a new monitor service
func NewMonitorService() *MonitorService {
	return &MonitorService{
		client: &http.Client{
			Timeout: time.Second * 10, // Wait up to 10 seconds
		},
	}
}

// CheckWebsite checks if a website is up
func (s *MonitorService) CheckWebsite(website models.Website) (models.WebsiteStatus, error) {
	// Record when we started
	startTime := time.Now()
	
	// Try to access the website
	resp, err := s.client.Get(website.URL)
	
	// Calculate how long it took
	responseTime := time.Since(startTime).Milliseconds()
	
	// Create a status object
	status := models.WebsiteStatus{
		WebsiteID:    website.ID,
		CheckedAt:    time.Now().Unix(),
		ResponseTime: responseTime,
	}
	
	// If there was an error, the site is down
	if err != nil {
		status.IsUp = false
		return status, err
	}
	defer resp.Body.Close() // Always close the response
	
	// Record the HTTP status code
	status.StatusCode = resp.StatusCode
	
	// Site is "up" if status code is 200-399
	status.IsUp = resp.StatusCode >= 200 && resp.StatusCode < 400
	
	return status, nil
}
