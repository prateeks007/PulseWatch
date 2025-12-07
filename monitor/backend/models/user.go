package models

// User represents user settings and preferences
type User struct {
	ID                string `json:"id" bson:"_id,omitempty"`                          // Supabase user ID
	Email             string `json:"email" bson:"email"`                               // User email from Supabase
	DiscordWebhookURL string `json:"discord_webhook_url" bson:"discord_webhook_url"`   // User's Discord webhook URL
	CreatedAt         int64  `json:"created_at" bson:"created_at"`                     // Unix timestamp
	UpdatedAt         int64  `json:"updated_at" bson:"updated_at"`                     // Unix timestamp
}