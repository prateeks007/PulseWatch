package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// SupabaseClaims represents the claims in a Supabase JWT token
type SupabaseClaims struct {
	Sub   string `json:"sub"`   // User ID
	Email string `json:"email"` // User email
	Role  string `json:"role"`  // User role
	jwt.RegisteredClaims
}

// AuthMiddleware validates Supabase JWT tokens
func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get the Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{
				"error": "Missing authorization header",
			})
		}

		// Extract the token from "Bearer <token>"
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return c.Status(401).JSON(fiber.Map{
				"error": "Invalid authorization header format",
			})
		}

		// Validate the JWT token
		userID, err := validateSupabaseJWT(tokenString)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{
				"error": "Invalid token",
				"details": err.Error(),
			})
		}

		// Store user ID in context for use in handlers
		c.Locals("user_id", userID)
		return c.Next()
	}
}

// validateSupabaseJWT validates a Supabase JWT token and returns the user ID
func validateSupabaseJWT(tokenString string) (string, error) {
	// Get the JWT secret from environment
	jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")
	if jwtSecret == "" {
		return "", fmt.Errorf("SUPABASE_JWT_SECRET not configured")
	}

	// Parse the token
	token, err := jwt.ParseWithClaims(tokenString, &SupabaseClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return "", fmt.Errorf("failed to parse token: %v", err)
	}

	// Extract claims
	if claims, ok := token.Claims.(*SupabaseClaims); ok && token.Valid {
		return claims.Sub, nil
	}

	return "", fmt.Errorf("invalid token claims")
}

// Alternative method using manual verification (if the above doesn't work)
func validateSupabaseJWTManual(tokenString string) (string, error) {
	// Split the JWT into parts
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return "", fmt.Errorf("invalid JWT format")
	}

	// Decode the payload (second part)
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("failed to decode payload: %v", err)
	}

	// Parse the payload JSON
	var claims SupabaseClaims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return "", fmt.Errorf("failed to parse claims: %v", err)
	}

	// Get the JWT secret
	jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")
	if jwtSecret == "" {
		return "", fmt.Errorf("SUPABASE_JWT_SECRET not configured")
	}

	// Verify the signature
	expectedSignature := generateHMACSignature(parts[0]+"."+parts[1], jwtSecret)
	actualSignature := parts[2]

	if expectedSignature != actualSignature {
		return "", fmt.Errorf("invalid signature")
	}

	return claims.Sub, nil
}

// generateHMACSignature generates HMAC-SHA256 signature for JWT
func generateHMACSignature(data, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(data))
	return base64.RawURLEncoding.EncodeToString(h.Sum(nil))
}