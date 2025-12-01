package utils

import (
	"fmt"
	"net/url"
	"strings"
)

// ValidationError represents a validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidationErrors represents multiple validation errors
type ValidationErrors []ValidationError

func (ve ValidationErrors) Error() string {
	if len(ve) == 0 {
		return ""
	}
	return fmt.Sprintf("validation failed: %s", ve[0].Message)
}

// NormalizeURL normalizes a URL for comparison (removes trailing slash, converts to lowercase)
func NormalizeURL(urlStr string) string {
	parsedURL, err := url.Parse(strings.TrimSpace(urlStr))
	if err != nil {
		return urlStr // Return original if can't parse
	}
	
	// Convert host to lowercase
	parsedURL.Host = strings.ToLower(parsedURL.Host)
	
	// Remove trailing slash from path
	if parsedURL.Path == "/" {
		parsedURL.Path = ""
	}
	
	return parsedURL.String()
}

// ValidateWebsite validates website input data
func ValidateWebsite(name, urlStr string) ValidationErrors {
	var errors ValidationErrors

	// Validate name
	if strings.TrimSpace(name) == "" {
		errors = append(errors, ValidationError{
			Field:   "name",
			Message: "Website name is required",
		})
	} else if len(strings.TrimSpace(name)) > 100 {
		errors = append(errors, ValidationError{
			Field:   "name", 
			Message: "Website name must be less than 100 characters",
		})
	}

	// Validate URL
	if strings.TrimSpace(urlStr) == "" {
		errors = append(errors, ValidationError{
			Field:   "url",
			Message: "Website URL is required",
		})
	} else {
		// Parse URL to check if it's valid
		parsedURL, err := url.Parse(strings.TrimSpace(urlStr))
		if err != nil {
			errors = append(errors, ValidationError{
				Field:   "url",
				Message: "Invalid URL format",
			})
		} else {
			// Check if scheme is http or https
			if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
				errors = append(errors, ValidationError{
					Field:   "url",
					Message: "URL must start with http:// or https://",
				})
			}
			// Check if host exists
			if parsedURL.Host == "" {
				errors = append(errors, ValidationError{
					Field:   "url",
					Message: "URL must include a valid domain",
				})
			}
		}
	}

	return errors
}