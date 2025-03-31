package services

import (
	"encoding/json"
	"os"
	"sync"

	"monitor/models"
)

// StorageService handles data storage
type StorageService struct {
	websites       []models.Website
	websiteStatuses map[string][]models.WebsiteStatus
	mutex          sync.RWMutex
	websitesFile   string
	statusesFile   string
}

// NewStorageService creates a new storage service
func NewStorageService() *StorageService {
	return &StorageService{
		websites:       []models.Website{},
		websiteStatuses: make(map[string][]models.WebsiteStatus),
		websitesFile:   "websites.json",
		statusesFile:   "statuses.json",
	}
}

// GetWebsites returns all websites
func (s *StorageService) GetWebsites() []models.Website {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	return s.websites
}

// SaveWebsite adds or updates a website
func (s *StorageService) SaveWebsite(website models.Website) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	
	// Check if website already exists
	found := false
	for i, w := range s.websites {
		if w.ID == website.ID {
			s.websites[i] = website
			found = true
			break
		}
	}
	
	// Add if not found
	if !found {
		s.websites = append(s.websites, website)
	}
	
	// Save to file
	return s.saveWebsitesToFile()
}

// GetWebsiteStatuses returns statuses for a website
func (s *StorageService) GetWebsiteStatuses(websiteID string) []models.WebsiteStatus {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	return s.websiteStatuses[websiteID]
}

// SaveStatus saves a website status
func (s *StorageService) SaveStatus(status models.WebsiteStatus) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	
	// Append status to the list for this website
	s.websiteStatuses[status.WebsiteID] = append(s.websiteStatuses[status.WebsiteID], status)
	
	// Keep only the last 100 statuses
	if len(s.websiteStatuses[status.WebsiteID]) > 100 {
		s.websiteStatuses[status.WebsiteID] = s.websiteStatuses[status.WebsiteID][len(s.websiteStatuses[status.WebsiteID])-100:]
	}
	
	// Save to file
	return s.saveStatusesToFile()
}

// LoadFromFiles loads data from files
func (s *StorageService) LoadFromFiles() error {
	// Load websites
	if _, err := os.Stat(s.websitesFile); err == nil {
		data, err := os.ReadFile(s.websitesFile)
		if err != nil {
			return err
		}
		
		if len(data) > 0 {
			if err := json.Unmarshal(data, &s.websites); err != nil {
				return err
			}
		}
	}
	
	// Load statuses
	if _, err := os.Stat(s.statusesFile); err == nil {
		data, err := os.ReadFile(s.statusesFile)
		if err != nil {
			return err
		}
		
		if len(data) > 0 {
			if err := json.Unmarshal(data, &s.websiteStatuses); err != nil {
				return err
			}
		}
	}
	
	return nil
}

// Internal methods for file operations
func (s *StorageService) saveWebsitesToFile() error {
	data, err := json.Marshal(s.websites)
	if err != nil {
		return err
	}
	return os.WriteFile(s.websitesFile, data, 0644)
}

func (s *StorageService) saveStatusesToFile() error {
	data, err := json.Marshal(s.websiteStatuses)
	if err != nil {
		return err
	}
	return os.WriteFile(s.statusesFile, data, 0644)
} 