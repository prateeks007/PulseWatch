package services

import (
	"context"
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

func NewStorageService() *StorageService {
	_ = godotenv.Load()
	uri := os.Getenv("MONGO_URI")
	dbName := os.Getenv("MONGO_DB_NAME")
	if dbName == "" {
		dbName = "pulsewatch_db"
	}
	if uri == "" {
		log.Fatalf("MONGO_URI not set")
	}
	s := &StorageService{mongoURI: uri, databaseName: dbName}
	if err := s.ConnectMongoDB(uri, dbName); err != nil {
		log.Fatalf("Failed to connect Mongo: %v", err)
	}
	return s
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

func (s *StorageService) GetWebsites() []models.Website {
	var sites []models.Website
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	cursor, err := s.websitesColl.Find(ctx, bson.M{})
	if err != nil {
		return nil
	}
	_ = cursor.All(ctx, &sites)
	return sites
}

func (s *StorageService) SaveWebsite(website models.Website) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := s.websitesColl.UpdateOne(ctx,
		bson.M{"_id": website.ID},
		bson.M{"$set": website},
		options.Update().SetUpsert(true))
	return err
}

func (s *StorageService) SaveStatus(status models.WebsiteStatus) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// also add CheckedAtDate for TTL
	doc := bson.M{
		"website_id":       status.WebsiteID,
		"is_up":            status.IsUp,
		"status_code":      status.StatusCode,
		"response_time_ms": status.ResponseTime,
		"checked_at":       status.CheckedAt,
		"checked_at_date":  time.Unix(status.CheckedAt, 0),
	}
	_, err := s.statusesColl.InsertOne(ctx, doc)
	return err
}

func (s *StorageService) GetWebsiteStatuses(websiteID string) []models.WebsiteStatus {
	var statuses []models.WebsiteStatus
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	cursor, _ := s.statusesColl.Find(ctx,
		bson.M{"website_id": websiteID},
		options.Find().SetSort(bson.D{{Key: "checked_at", Value: -1}}).SetLimit(500),
	)
	_ = cursor.All(ctx, &statuses)
	return statuses
}

// SSL methods (same as before)
func (s *StorageService) SaveSSL(info models.SSLInfo) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := s.sslColl.UpdateOne(ctx,
		bson.M{"website_id": info.WebsiteID},
		bson.M{"$set": info},
		options.Update().SetUpsert(true))
	return err
}

func (s *StorageService) GetSSL(websiteID string) *models.SSLInfo {
	var out models.SSLInfo
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	err := s.sslColl.FindOne(ctx, bson.M{"website_id": websiteID}).Decode(&out)
	if err != nil {
		return nil
	}
	return &out
}

func (s *StorageService) DeleteWebsite(id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, _ = s.websitesColl.DeleteOne(ctx, bson.M{"_id": id})
	_, _ = s.statusesColl.DeleteMany(ctx, bson.M{"website_id": id})
	_, _ = s.sslColl.DeleteOne(ctx, bson.M{"website_id": id})
	return nil
}

// --- The original JSON-specific file methods are now removed ---
// saveWebsitesToFile() and saveStatusesToFile() are no longer part of this StorageService.
