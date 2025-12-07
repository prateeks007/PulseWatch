package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/prateeks007/PulseWatch/monitor/backend/models"
)

type DiscordService struct {
	webhookURL string
	client     *http.Client
}

func NewDiscordService() *DiscordService {
	return &DiscordService{
		webhookURL: os.Getenv("DISCORD_WEBHOOK_URL"),
		client:     &http.Client{Timeout: 10 * time.Second},
	}
}

func (d *DiscordService) SendAlert(website models.Website, isUp bool, responseTime int64) error {
	if d.webhookURL == "" {
		return nil // Skip if no webhook configured
	}
	return d.SendAlertToWebhook(d.webhookURL, website, isUp, responseTime)
}

// SendAlertToWebhook sends alert to a specific webhook URL
func (d *DiscordService) SendAlertToWebhook(webhookURL string, website models.Website, isUp bool, responseTime int64) error {
	if webhookURL == "" {
		return nil // Skip if no webhook configured
	}

	var color int
	var status string
	var emoji string

	if isUp {
		color = 0x00ff00 // Green
		status = "ONLINE"
		emoji = "✅"
	} else {
		color = 0xff0000 // Red
		status = "OFFLINE"
		emoji = "❌"
	}

	payload := map[string]interface{}{
		"embeds": []map[string]interface{}{
			{
				"title":       fmt.Sprintf("%s %s is %s", emoji, website.Name, status),
				"description": fmt.Sprintf("**URL:** %s\n**Response Time:** %dms", website.URL, responseTime),
				"color":       color,
				"timestamp":   time.Now().Format(time.RFC3339),
			},
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal Discord payload: %w", err)
	}

	resp, err := d.client.Post(webhookURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to send Discord webhook: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 204 {
		return fmt.Errorf("Discord webhook returned status %d", resp.StatusCode)
	}

	return nil
}