package models

import "go.mongodb.org/mongo-driver/bson/primitive" // Import for ObjectID

// Website represents a website we want to monitor
type Website struct {
	ID       string `json:"id" bson:"_id,omitempty"`  // Unique identifier, maps to MongoDB's _id
	Name     string `json:"name" bson:"name"`         // Display name
	URL      string `json:"url" bson:"url"`           // Full URL to check
	Interval int    `json:"interval" bson:"interval"` // Check interval in seconds
}

// WebsiteStatus represents the result of checking a website
type WebsiteStatus struct {
	ID           primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`        // MongoDB generates unique ID for each status entry
	WebsiteID    string             `json:"website_id" bson:"website_id"`             // ID of the website this status belongs to
	IsUp         bool               `json:"is_up" bson:"is_up"`                       // Whether the site is up
	StatusCode   int                `json:"status_code" bson:"status_code"`           // HTTP status code
	ResponseTime int64              `json:"response_time_ms" bson:"response_time_ms"` // Response time in milliseconds
	CheckedAt    int64              `json:"checked_at" bson:"checked_at"`             // Unix timestamp of check
}
