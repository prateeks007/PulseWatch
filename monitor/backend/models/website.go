package models

// Website represents a website we want to monitor
type Website struct {
    ID       string `json:"id"`       // Unique identifier
    Name     string `json:"name"`     // Display name
    URL      string `json:"url"`      // Full URL to check
    Interval int    `json:"interval"` // Check interval in seconds
}

// WebsiteStatus represents the result of checking a website
type WebsiteStatus struct {
    WebsiteID    string `json:"website_id"`     // ID of the website
    IsUp         bool   `json:"is_up"`          // Whether the site is up
    StatusCode   int    `json:"status_code"`    // HTTP status code
    ResponseTime int64  `json:"response_time_ms"` // Response time in milliseconds
    CheckedAt    int64  `json:"checked_at"`     // Unix timestamp of check
}
