package services

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"                                 // For loading .env files
	"github.com/prateeks007/PulseWatch/monitor/backend/models" // Your models
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

// StorageService handles data storage using MongoDB
type StorageService struct {
	client       *mongo.Client
	websitesColl *mongo.Collection
	statusesColl *mongo.Collection
	databaseName string // Store the database name
	mongoURI     string // Store the URI (for internal reference)
}

// NewStorageService creates a new MongoDB-backed storage service.
// It loads the MongoDB URI from environment variables or a .env file and connects.
func NewStorageService() *StorageService {
	// Load .env file from the project root (PULSEWATCH/)
	err := godotenv.Load() // Loads .env from current working directory or finds it in parent
	if err != nil {
		log.Printf("Warning: No .env file found or error loading .env: %v. Assuming environment variables are set directly.", err)
	}

	uri := os.Getenv("MONGO_URI") // Expecting this from .env or system env
	dbName := os.Getenv("MONGO_DB_NAME")
	if dbName == "" {
		dbName = "pulsewatch_db" // Default database name if not set
	}

	if uri == "" {
		log.Fatalf("Fatal Error: MONGO_URI environment variable is not set. Cannot initialize StorageService. Please create a .env file in the root directory or set the environment variable.")
	}

	s := &StorageService{
		mongoURI:     uri,
		databaseName: dbName,
	}

	if err := s.ConnectMongoDB(uri, dbName); err != nil {
		log.Fatalf("Fatal Error: Failed to connect to MongoDB during StorageService initialization: %v", err)
	}

	return s
}

// ConnectMongoDB establishes a connection to the MongoDB Atlas cluster.
func (s *StorageService) ConnectMongoDB(uri, dbName string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second) // Increased timeout slightly
	defer cancel()

	clientOptions := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return fmt.Errorf("failed to create MongoDB client: %w", err)
	}

	// Ping the primary to ensure connection is established
	if err = client.Ping(ctx, readpref.Primary()); err != nil {
		if dcErr := client.Disconnect(context.Background()); dcErr != nil {
			log.Printf("Error during disconnect after ping failure: %v", dcErr)
		}
		return fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	s.client = client
	s.databaseName = dbName
	s.mongoURI = uri
	s.websitesColl = client.Database(dbName).Collection("websites")
	s.statusesColl = client.Database(dbName).Collection("statuses")

	log.Println("StorageService: Successfully connected to MongoDB Atlas!")
	return nil
}

// CloseMongoDB closes the MongoDB client connection. Call this on application shutdown.
func (s *StorageService) CloseMongoDB() {
	if s.client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := s.client.Disconnect(ctx); err != nil {
			log.Printf("StorageService: Error disconnecting from MongoDB: %v", err)
		} else {
			log.Println("StorageService: Disconnected from MongoDB Atlas.")
		}
	}
}

// GetWebsites returns all websites from MongoDB.
func (s *StorageService) GetWebsites() []models.Website {
	if err := s.client.Ping(context.TODO(), readpref.Primary()); err != nil {
		log.Printf("StorageService: MongoDB connection lost, unable to get websites: %v", err)
		return nil
	}

	var websites []models.Website
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := s.websitesColl.Find(ctx, bson.M{})
	if err != nil {
		log.Printf("StorageService: Error getting websites from MongoDB: %v", err)
		return nil
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &websites); err != nil {
		log.Printf("StorageService: Error decoding websites from MongoDB cursor: %v", err)
		return nil
	}
	return websites
}

// SaveWebsite adds or updates a website in MongoDB.
func (s *StorageService) SaveWebsite(website models.Website) error {
	if err := s.client.Ping(context.TODO(), readpref.Primary()); err != nil {
		return fmt.Errorf("StorageService: MongoDB connection lost, unable to save website: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"_id": website.ID} // Use _id for MongoDB's primary key
	update := bson.M{"$set": website}
	opts := options.Update().SetUpsert(true) // Insert if not found, update if found

	_, err := s.websitesColl.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return fmt.Errorf("StorageService: failed to save/update website in MongoDB: %w", err)
	}
	log.Printf("StorageService: Website '%s' saved/updated.", website.Name)
	return nil
}

// GetWebsiteStatuses returns recent statuses for a given website ID from MongoDB.
// It retrieves up to the last 100 statuses, sorted by CheckedAt descending.
func (s *StorageService) GetWebsiteStatuses(websiteID string) []models.WebsiteStatus {
	if err := s.client.Ping(context.TODO(), readpref.Primary()); err != nil {
		log.Printf("StorageService: MongoDB connection lost, unable to get statuses: %v", err)
		return nil
	}

	var statuses []models.WebsiteStatus
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"website_id": websiteID}
	opts := options.Find().SetSort(bson.D{{Key: "checked_at", Value: -1}}).SetLimit(100) // Sort by timestamp descending, limit to 100

	cursor, err := s.statusesColl.Find(ctx, filter, opts)
	if err != nil {
		log.Printf("StorageService: Error getting statuses for website %s from MongoDB: %v", websiteID, err)
		return nil
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &statuses); err != nil {
		log.Printf("StorageService: Error decoding statuses for website %s from MongoDB cursor: %v", websiteID, err)
		return nil
	}
	return statuses
}

// SaveStatus saves a website status to MongoDB.
func (s *StorageService) SaveStatus(status models.WebsiteStatus) error {
	if err := s.client.Ping(context.TODO(), readpref.Primary()); err != nil {
		return fmt.Errorf("StorageService: MongoDB connection lost, unable to save status: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := s.statusesColl.InsertOne(ctx, status)
	if err != nil {
		return fmt.Errorf("StorageService: failed to save status in MongoDB: %w", err)
	}
	// log.Printf("StorageService: Status saved for website ID: %s", status.WebsiteID) // Can be noisy
	return nil
}

// LoadFromFiles is adapted for MongoDB. It will no longer load from JSON files.
// It will simply log a message, assuming data is now managed in the database.
func (s *StorageService) LoadFromFiles() error {
	log.Println("StorageService: LoadFromFiles called. Using MongoDB; JSON file loading is now deprecated.")
	// You might add logic here in the future to:
	// 1. Check if the database has any initial websites.
	// 2. If not, insert some default websites into the DB.
	return nil
}

// --- The original JSON-specific file methods are now removed ---
// saveWebsitesToFile() and saveStatusesToFile() are no longer part of this StorageService.
