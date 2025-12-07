# PulseWatch Authentication & User Isolation Flow

## Overview
PulseWatch uses **Supabase for authentication** and **MongoDB for data storage** with complete user isolation. Each user only sees and manages their own websites.

## Architecture Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React)       │    │   (Go/Fiber)    │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Supabase Auth │◄──►│ • JWT Middleware│◄──►│ • Supabase Auth │
│ • JWT Storage   │    │ • User Filtering│    │ • MongoDB Atlas │
│ • API Calls     │    │ • Protected APIs│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Complete Authentication Flow

### 1. User Registration/Login
```
User → Frontend → Supabase Auth → JWT Token → Frontend Storage
```

**Frontend (AuthContext.jsx):**
```javascript
// User signs up/in
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
})

// Supabase returns JWT token in session
setSession(session)
setUser(session?.user ?? null)
```

**JWT Token Contains:**
```json
{
  "sub": "eacd61d0-ff0f-49bf-8592-043b15601329",  // user_id
  "email": "user@example.com",
  "role": "authenticated",
  "iss": "https://ytlsiogqueksatvfpyoi.supabase.co/auth/v1",
  "exp": 1765137719
}
```

### 2. API Request with Authentication
```
Frontend → JWT Token → Backend → JWT Validation → User ID Extraction
```

**Frontend (App.jsx):**
```javascript
// Get JWT token for API calls
const token = await getToken()
const headers = token ? { Authorization: `Bearer ${token}` } : {}

// Make authenticated API call
const response = await axios.get(`${API_BASE_URL}/api/websites`, { headers })
```

**Backend (middleware/auth.go):**
```go
// Extract JWT from Authorization header
authHeader := c.Get("Authorization")
tokenString := strings.TrimPrefix(authHeader, "Bearer ")

// Validate JWT token with Supabase secret
userID, err := validateSupabaseJWT(tokenString)

// Store user ID in request context
c.Locals("user_id", userID)
```

### 3. User Data Isolation
```
Backend → Extract User ID → Filter Database Queries → Return User-Specific Data
```

**Backend (main.go):**
```go
// Protected endpoint - only returns current user's websites
app.Get("/api/websites", middleware.AuthMiddleware(), func(c *fiber.Ctx) error {
    userID := c.Locals("user_id").(string)                    // Get user ID from JWT
    websites, err := storageService.GetWebsitesByUser(userID) // Filter by user
    return c.JSON(websites)                                   // Return only user's data
})
```

**Database Layer (storage.go):**
```go
// MongoDB query filtered by user_id
func (s *StorageService) GetWebsitesByUser(userID string) ([]models.Website, error) {
    cursor, err := s.websitesColl.Find(ctx, bson.M{"user_id": userID})
    // Only returns websites where user_id matches
}
```

## Data Model

### Website Document (MongoDB)
```json
{
  "_id": "1734567890123",
  "name": "My Website",
  "url": "https://example.com",
  "interval": 60,
  "user_id": "eacd61d0-ff0f-49bf-8592-043b15601329"  // Links to Supabase user
}
```

### User Document (MongoDB)
```json
{
  "_id": "eacd61d0-ff0f-49bf-8592-043b15601329",  // Same as Supabase user ID
  "email": "user@example.com",
  "discord_webhook_url": "https://discord.com/api/webhooks/...",
  "created_at": 1734567890,
  "updated_at": 1734567890
}
```

## Protected Endpoints

All admin endpoints require JWT authentication and filter by user:

| Endpoint | Method | User Filtering |
|----------|--------|----------------|
| `/api/websites` | GET | `GetWebsitesByUser(userID)` |
| `/api/websites/:id` | GET | `GetWebsiteByUser(id, userID)` |
| `/api/websites/:id/ssl` | GET | `GetWebsiteByUser(id, userID)` |
| `/api/ssl/summary` | GET | `GetWebsitesByUser(userID)` |
| `/api/websites/:id/status` | GET | Validates user owns website |
| `/api/websites` | POST | Sets `website.UserID = userID` |
| `/api/websites/:id` | DELETE | `DeleteWebsiteByUser(id, userID)` |
| `/api/user/settings` | GET/PUT | Uses `userID` for user settings |

## Public Endpoints (No Auth Required)

| Endpoint | Purpose | Access |
|----------|---------|--------|
| `/api/public/status` | Status page data | Public (all websites) |
| `/api/public/status/:id` | Website status history | Public |
| `/health` | Health check | Public |

## Security Features

### 1. JWT Validation
- **Secret Key**: `SUPABASE_JWT_SECRET` validates token authenticity
- **Expiration**: Tokens auto-expire (configurable in Supabase)
- **Claims**: Extract `sub` (user_id) from validated token

### 2. User Isolation
- **Database Level**: All queries filtered by `user_id`
- **API Level**: Middleware extracts and validates user identity
- **Frontend Level**: Only user's data returned from API

### 3. Authorization Checks
- **Ownership Validation**: Users can only access their own resources
- **Resource Protection**: 404 returned for unauthorized access attempts
- **Data Separation**: Complete isolation between user accounts

## Environment Variables

### Backend (.env)
```env
SUPABASE_URL=https://ytlsiogqueksatvfpyoi.supabase.co
SUPABASE_JWT_SECRET=W080t9PH1Su4viCkd2VDMU1Z+yS9CwT5Jd6MZSpeYnELn+7tqD4YB6b6YPYgs9bh9JxrUyEKZqkfybri9jfYrg==
MONGO_URI=mongodb+srv://...
MONGO_DB_NAME=pulsewatch_db_prod
```

### Frontend (.env.local)
```env
VITE_SUPABASE_URL=https://ytlsiogqueksatvfpyoi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_BASE_URL=https://pulsewatch-av56.onrender.com
```

## User Journey Example

1. **User A signs up** → Supabase creates user with ID `user-123`
2. **User A logs in** → Gets JWT token containing `"sub": "user-123"`
3. **User A adds website** → Stored with `"user_id": "user-123"`
4. **User A views dashboard** → Only sees websites with `"user_id": "user-123"`
5. **User B signs up** → Gets different ID `user-456`
6. **User B views dashboard** → Only sees websites with `"user_id": "user-456"`
7. **Complete isolation** → Users never see each other's data

## Error Handling

### Authentication Errors
- **401 Unauthorized**: Missing/invalid JWT token
- **403 Forbidden**: Valid token but insufficient permissions
- **404 Not Found**: Resource doesn't exist or user doesn't own it

### Token Refresh
- **Automatic**: Supabase handles token refresh transparently
- **Session Management**: Frontend `onAuthStateChange` updates tokens
- **Graceful Degradation**: Redirect to login on token expiry

This architecture ensures complete user data isolation while maintaining a seamless user experience.