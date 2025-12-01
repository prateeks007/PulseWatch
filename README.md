# PulseWatch

PulseWatch is a lightweight yet powerful website uptime and health monitor built with Go. It allows you to monitor multiple websites, run periodic checks, and persist results using MongoDB Atlas. Designed to be simple, extensible, and ready for real-world use.

## 🚀 Features

* ✅ HTTP/HTTPS website uptime checks
* ⏰ Configurable intervals (per-site)
* 📦 MongoDB Atlas integration for scalable storage
* 🔄 Cron-based periodic execution
* 💡 Pluggable storage (easily extend to Redis, SQL, etc.)
* 📈 Real-time console logs
* 🚨 **Discord alerts** - Get notified when sites go up/down
* 🔒 **SSL certificate monitoring** - Track certificate expiry dates
* 📁 **Modern React dashboard** - Beautiful real-time UI with dark/light themes
* 📊 **Charts & analytics** - Response time graphs and uptime statistics
* 🛡️ **Smart alerting** - Only alerts on status changes (no spam)

---

## 📦 Requirements

* Go 1.18+
* MongoDB Atlas (Free Tier is fine)
* Node.js (for the frontend)

---

## 🛠️ Setup & Run

### 1. Clone the Repo

```bash
git clone [https://github.com/prateeks007/PulseWatch.git](https://github.com/prateeks007/PulseWatch.git)
cd PulseWatch
````

### 2\. Setup MongoDB Atlas

  * Create a free cluster: [https://cloud.mongodb.com](https://cloud.mongodb.com)

  * Add a user and whitelist your IP.

  * Copy your connection string. It should look something like this:

  `  mongodb+srv://<user>:<pass>@cluster0.mongodb.net/pulsewatch?retryWrites=true&w=majority  `

  * Create a `.env` file in the root of the project to store your connection details:

  ` env   MONGO_URI="your-connection-uri"   MONGO_DB_NAME="pulsewatch_db"    `

  * **Note:** The `pulsewatch_db` database and its collections will be automatically created on the first run.
  * **Discord Alerts (Optional):** Create a Discord webhook in your server settings to receive notifications when websites go up/down.

### 3\. Setup and Run the Backend

The backend is located in the `monitor/backend` directory, but the main entry point is at the project root.

  * Download the Go dependencies from the project root:
      ` bash   go mod tidy    `

  * Build the backend executable from the project root:
      ` bash   go build -o pulsewatch-api ./monitor/backend    `

  * Run the backend server from the project root:
      ` bash   ./pulsewatch-api    `

  * This will start the cron scheduler and the API server on `http://localhost:3000`.

### 4\. Setup and Run the Frontend

  * Navigate to the frontend directory:
      ` bash   cd monitor/frontend    `

  * Install the Node.js dependencies:
      ` bash   npm install    `

  * Run the frontend development server:
      ` bash   npm run dev    `

  * This will open your web browser to the frontend dashboard, which will communicate with your backend API.

-----

## 🧩 Architecture

```
[ Frontend (Web UI) ] ----API Calls----> [ Go Backend (Fiber API) ]
                               |
                              [ MonitorService ]
                               |
                              [ StorageService ]
                               |
                           [ Data: MongoDB Atlas ]
```

  * All storage is handled through an interface.
  * MongoDB is used as the primary backend for data persistence.
  * A cron scheduler runs periodic checks via the `MonitorService`.

-----

## 📈 Future Plans

  * ~~Web dashboard with charts~~ ✅ **DONE**
  * ~~Alerting: Discord~~ ✅ **DONE** 
  * Email, Slack, SMS alerts
  * User authentication (multi-tenant)
  * Data cleanup and retention policies
  * Docker + Helm deployment
  * Prometheus + Grafana exporter

-----

## 🤝 Contributing

Pull requests are welcome. Open issues for bugs or features.

-----

## 📜 License

[MIT License](https://www.google.com/search?q=LICENSE)

```