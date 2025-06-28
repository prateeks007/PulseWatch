# PulseWatch

PulseWatch is a lightweight yet powerful website uptime and health monitor built with Go. It allows you to monitor multiple websites, run periodic checks, and persist results using MongoDB Atlas. Designed to be simple, extensible, and ready for real-world use.

## 🚀 Features

* ✅ HTTP/HTTPS website uptime checks
* ⏰ Configurable intervals (per-site)
* 📦 MongoDB Atlas integration for scalable storage
* 🔄 Cron-based periodic execution
* 💡 Pluggable storage (easily extend to Redis, SQL, etc.)
* 📈 Real-time console logs
* 🧰 Future-ready for dashboard and alerting integrations

---

## 📦 Requirements

* Go 1.18+
* MongoDB Atlas (Free Tier is fine)
* Node.js (Optional - for front-end if enabled)

---

## 🛠️ Setup & Run

### 1. Clone the Repo

```bash
git clone https://github.com/prateeks007/PulseWatch.git
cd PulseWatch
```

### 2. Setup MongoDB Atlas

* Create a free cluster: [https://cloud.mongodb.com](https://cloud.mongodb.com)

* Add a user & whitelist your IP

* Copy your connection string:

  ```
  mongodb+srv://<user>:<pass>@cluster0.mongodb.net/pulsewatch?retryWrites=true&w=majority
  ```

* Export the connection string:

```bash
export MONGODB_URI="your-connection-uri"
```

### 3. Build the App

```bash
go mod tidy
go build -o pulsewatch main.go cron_monitor.go
```

### 4. Run the App

```bash
./pulsewatch
```

* Default config will be created (Google monitored every 60s).

---

## 🧪 Example CLI Usage *(to be implemented)*

```bash
# Add a new site
./pulsewatch add --name "My Blog" --url "https://example.com" --interval 120

# List all sites
./pulsewatch list

# Remove site by ID
./pulsewatch remove --id <ObjectID>
```

---

## 🧩 Architecture

```
[ CLI / Web UI (optional) ]
        |
[ Core Layer: MonitorService ]
        |
[ StorageService Interface ]
   ├── MongoStorage
   └── (Future) FileStorage, RedisStorage
        |
[ Data: MongoDB Atlas ]
```

* All storage is handled through an interface.
* MongoDB used as primary backend.
* Cron scheduler executes MonitorService checks per interval.

---

## 📈 Future Plans

* Web dashboard with charts
* Alerting: Email, Slack, SMS
* User authentication (multi-tenant)
* Docker + Helm deployment
* Prometheus + Grafana exporter

---

## 🤝 Contributing

Pull requests are welcome. Open issues for bugs or features.

---

## 📜 License

[MIT License](LICENSE)
