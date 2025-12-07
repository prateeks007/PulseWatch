# PulseWatch

## 🚀 **Use the hosted version (no setup required):** 
### **[https://pulse-watch.vercel.app](https://pulse-watch.vercel.app)**

**Free uptime & status monitoring. Sign up → Add your first site → Get alerts.**

### How it works:
1. **Sign up** - Create your free account
2. **Add websites** - Monitor your sites and APIs  
3. **Get alerts** - Discord notifications when sites go down

---

**Or self-host using the instructions below.**

---

PulseWatch is a professional-grade website uptime and health monitoring platform built with Go and React. Monitor multiple websites, track performance metrics, and get instant alerts when issues occur. Features a stunning dashboard and public status pages that rival industry leaders like GitHub Status and Vercel Status.

## 🚀 Features

### **Core Monitoring**
* ✅ **HTTP/HTTPS uptime monitoring** - Real-time website health checks
* ⏰ **Configurable intervals** - Custom check frequency per website
* 📊 **Response time tracking** - Monitor performance trends
* 🔒 **SSL certificate monitoring** - Track certificate expiry dates
* 📈 **Uptime statistics** - 24h and 7-day uptime percentages

### **Alerting & Notifications**
* 🚨 **Discord alerts** - Instant notifications when sites go up/down
* 🛡️ **Smart alerting** - Only alerts on status changes (no spam)
* 📱 **Real-time updates** - Live dashboard updates every 10 seconds

### **Dashboard & UI**
* 📁 **Modern React dashboard** - Beautiful, responsive admin interface
* 🌙 **Dark/light themes** - Automatic theme switching with user preference
* 📊 **Interactive charts** - Response time graphs and uptime analytics
* 🔍 **Search & filtering** - Find websites quickly with advanced filters
* 📱 **Mobile responsive** - Works perfectly on all devices

### **Authentication & Security**
* 🔐 **JWT authentication** - Secure user sessions with Supabase
* 👥 **Multi-user support** - Each user sees only their websites
* 🛡️ **Protected admin APIs** - JWT validation on all admin endpoints
* 🌐 **Public status pages** - No authentication required for status viewing
* 🔒 **User data isolation** - Complete separation between user accounts

### **Public Status Pages**
* 🌐 **Professional status pages** - Public-facing status like GitHub/Vercel
* 🎨 **Stunning animations** - 3D effects, gradients, and smooth transitions
* 📊 **Service history** - Click any service to see detailed 24h history
* 🔄 **Auto-refresh** - Real-time updates every 30 seconds
* 🎯 **No authentication required** - Perfect for sharing with customers

### **Architecture & Deployment**
* 📦 **MongoDB Atlas integration** - Scalable cloud database storage
* 🔄 **Cron-based execution** - Reliable background monitoring
* 💡 **Pluggable storage** - Easily extend to other databases
* 🚀 **Production ready** - Deployed on Render with auto-scaling
* 🔧 **Keep-alive system** - Prevents free tier spin-downs

---

## 📦 Requirements

* **Go 1.18+** - Backend API and monitoring service
* **Node.js 16+** - Frontend React application
* **MongoDB Atlas** - Cloud database (Free tier supported)
* **Supabase** - Authentication service (Free tier supported)
* **Discord Webhook** - For notifications (Optional)

---

## 🛠️ Setup & Run

### 1. Clone the Repo

```bash
git clone https://github.com/prateeks007/PulseWatch.git
cd PulseWatch
```

### 2. Setup MongoDB Atlas

* Create a free cluster: [https://cloud.mongodb.com](https://cloud.mongodb.com)
* Add a user and whitelist your IP (or use 0.0.0.0/0 for development)
* Copy your connection string:

```
mongodb+srv://<user>:<pass>@cluster0.mongodb.net/?retryWrites=true&w=majority
```

### 3. Setup Supabase Authentication

* Create a free project: [https://supabase.com](https://supabase.com)
* Go to Settings → API to get your keys
* Copy the Project URL and anon public key

### 4. Environment Configuration

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGO_URI="your-mongodb-connection-string"
MONGO_DB_NAME="pulsewatch_db_local"  # Use different names for local/prod

# Supabase Authentication
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_JWT_SECRET="your-jwt-secret-from-supabase-settings"

# Discord Notifications (Optional)
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/your-webhook-url"
```

Create `monitor/frontend/.env.local` for frontend:

```env
VITE_API_BASE_URL="http://localhost:3000"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```

### 5. Setup and Run the Backend

```bash
# Install Go dependencies
go mod tidy

# Run the backend server
go run ./monitor/backend
```

This starts:
- 🔄 **Cron scheduler** - Monitors websites every minute
- 🌐 **API server** - REST API on `http://localhost:3000`
- 💓 **Keep-alive service** - Prevents deployment spin-downs
- 🔒 **SSL monitoring** - Daily certificate checks

### 6. Setup and Run the Frontend

```bash
# Navigate to frontend directory
cd monitor/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

This opens:
- 📊 **Admin Dashboard** - `http://localhost:5173/dashboard`
- 🌐 **Public Status Page** - `http://localhost:5173/status`

-----

## 🧩 Architecture

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   React Frontend    │    │    Go Backend API    │    │   External Services │
│                     │    │                      │    │                     │
│ • Admin Dashboard   │◄──►│ • Fiber REST API     │◄──►│ • MongoDB Atlas     │
│ • Public Status     │    │ • JWT Validation     │    │ • Supabase Auth     │
│ • Authentication    │    │ • Cron Scheduler     │    │ • Discord Webhooks  │
│ • Real-time Updates │    │ • Monitor Service    │    │ • SSL Certificates  │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
```

### **Multi-User Data Flow**
```
1. User authenticates → Supabase returns JWT token
2. Frontend sends JWT with API requests → Go backend
3. Backend validates JWT → Extracts user_id
4. Database queries filtered by user_id → MongoDB Atlas
5. User sees only their websites and data
```

### **Environment Separation**
```
Local Development:  MongoDB "pulsewatch_db_local"  + Supabase Cloud Auth
Production:         MongoDB "pulsewatch_db_prod"   + Supabase Cloud Auth
                    (Same auth, separate data)
```

-----

## 🎯 **Current Status & Roadmap**

### **✅ Completed Features**
* ~~Web dashboard with charts~~ ✅ **DONE**
* ~~Alerting: Discord~~ ✅ **DONE** 
* ~~SSL certificate monitoring~~ ✅ **DONE**
* ~~Public status pages~~ ✅ **DONE**
* ~~Dark/light themes~~ ✅ **DONE**
* ~~Real-time updates~~ ✅ **DONE**
* ~~Data cleanup and retention~~ ✅ **DONE**
* ~~Production deployment~~ ✅ **DONE**
* ~~User authentication (Supabase integration)~~ ✅ **DONE**
* ~~Multi-tenant architecture~~ ✅ **DONE**

### **🚧 In Progress**
* Custom status page domains

### **📋 Future Plans**
* Email, Slack, SMS alerts
* Incident management system
* API rate limiting
* Docker + Helm deployment
* Prometheus + Grafana exporter
* Mobile app (React Native)
* Advanced analytics & reporting

-----

## 🌐 **Try PulseWatch Now**

* **📊 Start Monitoring**: [https://pulse-watch.vercel.app](https://pulse-watch.vercel.app) - Sign up and add your first website
* **📄 Example Status Page**: [https://pulse-watch.vercel.app/status](https://pulse-watch.vercel.app/status) - See what your customers will see
* **🔗 API Endpoint**: [https://pulsewatch-av56.onrender.com](https://pulsewatch-av56.onrender.com) - Backend service

## 🚀 **Deployment**

### **Frontend (Vercel)**
```bash
# Build and deploy
npm run build
vercel --prod
```

### **Backend (Render)**
```bash
# Auto-deploys from GitHub
# Set environment variables in Render dashboard
```

## 🤝 **Contributing**

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

* Built with [Go](https://golang.org/) and [Fiber](https://gofiber.io/)
* Frontend powered by [React](https://reactjs.org/) and [Tailwind CSS](https://tailwindcss.com/)
* Authentication by [Supabase](https://supabase.com/)
* Database hosted on [MongoDB Atlas](https://www.mongodb.com/atlas)
* Deployed on [Render](https://render.com/) and [Vercel](https://vercel.com/)