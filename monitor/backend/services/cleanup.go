package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type CleanupService struct {
	statusesColl *mongo.Collection
}

func NewCleanupService(statusesColl *mongo.Collection) *CleanupService {
	return &CleanupService{statusesColl: statusesColl}
}

// CleanupOldStatuses removes status records older than specified days
func (c *CleanupService) CleanupOldStatuses(daysToKeep int) error {
	cutoff := time.Now().AddDate(0, 0, -daysToKeep).Unix()
	
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	result, err := c.statusesColl.DeleteMany(ctx, bson.M{
		"checked_at": bson.M{"$lt": cutoff},
	})
	
	if err != nil {
		return fmt.Errorf("failed to cleanup old statuses: %w", err)
	}
	
	log.Printf("🧹 Cleaned up %d old status records (older than %d days)", result.DeletedCount, daysToKeep)
	return nil
}

// CleanupOrphanedStatuses removes statuses for websites that no longer exist
func (c *CleanupService) CleanupOrphanedStatuses(websitesColl *mongo.Collection) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Get all website IDs
	cursor, err := websitesColl.Find(ctx, bson.M{}, nil)
	if err != nil {
		return fmt.Errorf("failed to get websites: %w", err)
	}
	defer cursor.Close(ctx)

	validIDs := make([]string, 0)
	for cursor.Next(ctx) {
		var website struct {
			ID string `bson:"_id"`
		}
		if err := cursor.Decode(&website); err == nil {
			validIDs = append(validIDs, website.ID)
		}
	}

	// Delete statuses not in valid IDs
	result, err := c.statusesColl.DeleteMany(ctx, bson.M{
		"website_id": bson.M{"$nin": validIDs},
	})
	
	if err != nil {
		return fmt.Errorf("failed to cleanup orphaned statuses: %w", err)
	}
	
	log.Printf("🧹 Cleaned up %d orphaned status records", result.DeletedCount)
	return nil
}