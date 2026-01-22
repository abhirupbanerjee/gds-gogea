# GoG – Government of Grenada Digital Services Portal

A containerized application for managing digital government services using:

- **Frontend**: React
- **Backend**: FastAPI
- **CMS**: Headless Drupal
- **Storage**: MinIO (S3-compatible)
- **Search**: Elasticsearch
- **Database**: PostgreSQL + pgAdmin
- **Orchestration**: Docker Compose

---

## 🔧 Prerequisites

Ensure the following tools are installed before setup:

- [Git](https://git-scm.com/downloads)
- [Docker](https://www.docker.com/get-started)

---

## 🚀 Installation Steps

### 1. Clone the Repository
Replace this with your custom git repository once setup

```bash
git clone https://github.com/DbGit39441/GoG.git
cd GoG
```

### 2. Start Docker Engine

- **Windows/macOS**: Launch Docker Desktop
- **DC - Linux**:
  ```bash
  sudo systemctl start docker
  ```

### 3. Build and Run All Services

```bash
docker compose up --build -d
```

This will:
- Pull necessary base images
- Build application containers
- Start all services in **detached mode**

---


## 🌐 Access the Application

Once running locally:

| Service           | Local URL               | Public URL                      | Notes                     |
|------------------|--------------------------|---------------------------------|---------------------------|
| Frontend (React) | http://localhost:8081   | http://gea.gov.gd                | Main portal UI            |
| Backend (API)    | http://localhost:8000   | http://gea.gov.gd:8000           | FastAPI core APIs         |
| CMS (Drupal)     | http://localhost:8001   | http://gea.gov.gd:8001           | Headless Drupal instance  |
| MinIO            | http://localhost:9090   | http://gea.gov.gd:9090           | S3-compatible storage UI  |
| Elasticsearch    | http://localhost:9200   | http://gea.gov.gd:9200           | Search API (dev use only) |
| pgAdmin          | http://localhost:5050   | http://gea.gov.gd:5050           | Admin UI for PostgreSQL   |
| Login Service    | http://localhost:8002   | http://gea.gov.gd:8002           | Auth interface (if active)|

## 🛑 Stop and Remove Containers

```bash
docker compose down
```

This stops and removes all containers but retains volumes and data.

---

## 📥 Data Ingestion

You can upload and manage content via:
- The Drupal CMS (`/cms`)
- File uploader via MinIO (`/minio`)
- API calls to backend endpoints (`/api`)
- Direct form submission through the frontend (`/`)

Refer to each service’s documentation or OpenAPI docs (if included) for more integration options.

---

## 🌍 Deployment Notes

To deploy this in a production environment:
- Use Nginx as a reverse proxy to expose services securely
- Use the provided setup scripts:
  - `infra/setup-nginx-ip-only.sh` → Access via public IP (no SSL)
  - `infra/setup-nginx-ssl-gea.sh` → Use after DNS + HTTPS is configured

For help setting this up, refer to the deployment section or contact the DevOps lead.

---

## 📂 Project Structure Overview

```bash
GoG/
├── backend/            # FastAPI backend
├── drupal-docker/      # Drupal CMS + supporting files
├── frontend/           # React application
├── minio-data/         # MinIO object storage
├── postgres/           # PostgreSQL + init
├── Dockerfile          # Base Dockerfile
├── docker-compose.yml  # Main Docker orchestration
├── db.sql              # Optional DB seed
├── requirements.txt    # Python dependencies
├── uploader.py         # Uploader script (if used)
├── servers.json        # Server config
└── README.md           # This file
```

---

## 🧾 License

Internal project – private use only.
