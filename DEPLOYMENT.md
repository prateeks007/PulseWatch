# PulseWatch Deployment Guide

## Environment Variables

### Backend (Render)
```
MONGO_URI=mongodb+srv://your-connection-string
MONGO_DB_NAME=pulsewatch_db_prod
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook
PORT=10000
```

### Frontend (Vercel)
```
VITE_API_BASE_URL=https://pulsewatch-av56.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## Deployment Steps

### 1. Backend (Render)
1. Connect GitHub repository
2. Set build command: `go build -o app`
3. Set start command: `./app`
4. Add environment variables above
5. Deploy from `main` branch

### 2. Frontend (Vercel)
1. Connect GitHub repository
2. Set framework preset: `Vite`
3. Set root directory: `monitor/frontend`
4. Add environment variables above
5. Deploy from `main` branch

## Post-Deployment Checklist
- [ ] Backend health check: `https://your-backend.onrender.com/health`
- [ ] Frontend loads: `https://your-frontend.vercel.app`
- [ ] Status page works: `https://your-frontend.vercel.app/status`
- [ ] Authentication works
- [ ] API calls succeed with JWT tokens
- [ ] Discord alerts working (optional)