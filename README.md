# NIT DEM — AI-Powered Traffic Intelligence & UAV Monitoring Platform

A frontend Smart City Traffic Intelligence Command Center for Kozhikode, Kerala, integrated with a cloud data ingestion pipeline. Built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, and Leaflet.js.

---

## 🔐 Login Credentials

* **Username:** `admin`
* **Password:** `password`

---

## 📡 Data Ingestion Pipeline (GCS Sync)

The project reads actual traffic telemetry and ST-GNN forecasting predictions from Google Cloud Storage (GCS) using the ingestion pipeline script:

```bash
# Pulls source Excel sheets (I1a, I1b, I2, O1) from GCS and parses them into static JSONs
node sync_datasets.cjs
```

* **Data Files Generated in `/public`**:
  * `I1a.json` ➔ Corridor coordinate geometries.
  * `I1b.json` ➔ Drone flight routes and coordinates.
  * `I2.json` ➔ Real-time traffic sensor telemetry logs.
  * `O1.json` ➔ ST-GNN AI traffic forecasting predictions.

---

## 🚀 Run & Deploy Instructions

### 1. Prerequisites
Install [Node.js](https://nodejs.org/) (version 18 or higher). Check with:
```bash
node -v
npm -v
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the Local Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build & Deploy to Firebase
```bash
# Compile TypeScript and build production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

---

## 📁 Project Structure

```
nitdem/
├── src/
│   ├── components/
│   │   ├── layout/      → Sidebar, Header, IntelPanel (Intelligent Center), ToastStack, MobileDrawer
│   │   ├── map/         → CommandMap (Leaflet), LocationPicker (overlay modal)
│   │   └── pages/       → Dashboard, AIAnalytics, TrafficForecasting, IncidentCenter, DroneOperations
│   ├── hooks/           → useAppStore (global state & playbacks), linkMaps (link ID dictionaries)
│   ├── types/           → TypeScript interfaces
│   ├── App.tsx          → Main routing shell
│   └── main.tsx         → App entry point
├── sync_datasets.cjs    → GCS Data Ingestion & Compile pipeline
├── PROJECT_OVERVIEW.txt  → Detailed system manual and flow diagrams
└── 24_links_upgrade_instructions.txt → Step-by-step instructions to scale forecasting
```

---

## 🛠️ Key Features

* **Command Map** — Leaflet dark tactical map with bidirectional connection tooltips displaying live traffic speed, density, and queue length.
* **Incident Center & ML Inputs** — Form dropdown to log incidents directly against raw Affected Link IDs (`L1-L26`), matching standards expected by cloud-based ML models.
* **Detailed Incident Logs** — Log incident type, travel directions (*Towards Bmh, Towards Puthiyara, etc.*), lanes blocked, start/end times, and accepting/declining incident tokens.
* **AI Disruption Rankings** — Automatically ranks incidents from most disruptive to least based on lane closures and junction congestion.
* **What-If Simulation Sandbox** — Dynamic sliders allowing operators to block lanes, increase intensity, or apply signal retiming offsets to instantly preview predicted flow outcomes.
* **Drone Surveillance Flight** — Flight paths plotted on Leaflet maps with live stream feeds, battery tracking, and dispatch controls.
* **AI Analytics Page** — Accurate historic deviation charts comparing actual density vs. ST-GNN forecasted trends.
