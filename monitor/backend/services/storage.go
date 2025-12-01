package services

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/prateeks007/PulseWatch/monitor/backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

type StorageService struct {
	client       *mongo.Client
	websitesColl *mongo.Collection
	statusesColl *mongo.Collection
	sslColl      *mongo.Collection
	databaseName string
	mongoURI     string
}

func NewStorageService() (*StorageService, error) {
	_ = godotenv.Load()
	uri := os.Getenv("MONGO_URI")
	dbName := os.Getenv("MONGO_DB_NAME")
	if dbName == "" {
		dbName = "pulsewatch_db"
	}
	if uri == "" {
		return nil, fmt.Errorf("MONGO_URI environment variable not set")
	}
	s := &StorageService{mongoURI: uri, databaseName: dbName}
	if err := s.ConnectMongoDB(uri, dbName); err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}
	log.Printf("✅ Storage service initialized successfully")
	return s, nil
}

func (s *StorageService) ConnectMongoDB(uri, dbName string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return err
	}
	if err = client.Ping(ctx, readpref.Primary()); err != nil {
		return err
	}
	s.client = client
	db := client.Database(dbName)
	s.websitesColl = db.Collection("websites")
	s.statusesColl = db.Collection("statuses")
	s.sslColl = db.Collection("ssl")

	log.Println("Connected to Mongo!")
	return nil
}

func (s *StorageService) GetWebsites() ([]models.Website, error) {
	var sites []models.Website
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := s.websitesColl.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to find websites: %w", err)
	}
	defer func() {
		if err := cursor.Close(ctx); err != nil {
			log.Printf("⚠️ Failed to close cursor: %v", err)
		}
	}()

	if err := cursor.All(ctx, &sites); err != nil {
		return nil, fmt.Errorf("failed to decode websites: %w", err)
	}
	return sites, nil
}

func (s *StorageService) SaveWebsite(website models.Website) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := s.websitesColl.UpdateOne(
		ctx,
		bson.M{"_id": website.ID},
		bson.M{"$set": website},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		return fmt.Errorf("failed to save website %s: %w", website.Name, err)
	}
	return nil
}

func (s *StorageService) SaveStatus(status models.WebsiteStatus) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	doc := bson.M{
		"website_id":       status.WebsiteID,
		"is_up":            status.IsUp,
		"status_code":      status.StatusCode,
		"response_time_ms": status.ResponseTime,
		"checked_at":       status.CheckedAt,
		"checked_at_date":  time.Unix(status.CheckedAt, 0),
	}
	_, err := s.statusesColl.InsertOne(ctx, doc)
	if err != nil {
		return fmt.Errorf("failed to save status for website %s: %w", status.WebsiteID, err)
	}
	return nil
}

func (s *StorageService) GetWebsiteStatuses(websiteID string) ([]models.WebsiteStatus, error) {
	var statuses []models.WebsiteStatus
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	cursor, err := s.statusesColl.Find(
		ctx,
		bson.M{"website_id": websiteID},
		options.Find().SetSort(bson.D{{Key: "checked_at", Value: -1}}).SetLimit(500),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to find statuses for website %s: %w", websiteID, err)
	}
	defer func() {
		if err := cursor.Close(ctx); err != nil {
			log.Printf("⚠️ Failed to close cursor: %v", err)
		}
	}()

	if err := cursor.All(ctx, &statuses); err != nil {
		return nil, fmt.Errorf("failed to decode statuses for website %s: %w", websiteID, err)
	}
	return statuses, nil
}

// --- SSL ---

func (s *StorageService) SaveSSL(info models.SSLInfo) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := s.sslColl.UpdateOne(
		ctx,
		bson.M{"website_id": info.WebsiteID},
		bson.M{"$set": info},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		log.Printf("SaveSSL UpdateOne error: %v", err)
	}
	return err
}

func (s *StorageService) GetSSL(websiteID string) *models.SSLInfo {
	var out models.SSLInfo
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := s.sslColl.FindOne(ctx, bson.M{"website_id": websiteID}).Decode(&out)
	if err != nil {
		if err != mongo.ErrNoDocuments {
			log.Printf("GetSSL error: %v", err)
		}
		return nil
	}
	return &out
}

func (s *StorageService) DeleteWebsite(id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if _, err := s.websitesColl.DeleteOne(ctx, bson.M{"_id": id}); err != nil {
		log.Printf("DeleteWebsite websites delete error: %v", err)
	}
	if _, err := s.statusesColl.DeleteMany(ctx, bson.M{"website_id": id}); err != nil {
		log.Printf("DeleteWebsite statuses delete error: %v", err)
	}
	if _, err := s.sslColl.DeleteOne(ctx, bson.M{"website_id": id}); err != nil {
		log.Printf("DeleteWebsite ssl delete error: %v", err)
	}
	return nil
}

// --- The original JSON-specific file methods are now removed ---
// saveWebsitesToFile() and saveStatusesToFile() are no longer part of this StorageService.
