# NIT DEM — AI-Powered Traffic Intelligence & UAV Monitoring Platform

A frontend Smart City Traffic Intelligence Command Center for Kozhikode, Kerala, integrated with a cloud data ingestion pipeline. Built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, and Leaflet.js.

---

## 📡 Data Ingestion Pipeline (GCS Sync)

The project reads actual traffic telemetry and ST-GNN forecasting predictions from Google Cloud Storage (GCS) using the ingestion pipeline script:

```bash
# Pulls source Excel sheets (I1a, I1b, I2, O1) from GCS and parses them into static JSONs
node sync_datasets.cjs
```

* **Data Files Generated in `./public`**:
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

## 🖥️ Detailed Page Walkthroughs

The Command Center is structured into 9 dedicated pages, each performing specific smart-city monitoring operations:

### 1. Operations Dashboard
* **Purpose**: Serves as the high-level operations control panel.
* **Features**:
  * **Dynamic KPIs**: Displays animated counters for active drones, active incidents, and active bottlenecks.
  * **Real-time Charting**: Renders vehicle density, system flow score, and active incident trends.
  * **What-If Simulation Sandbox**: Features interactive slider controls allowing operators to test hypothetical scenarios—such as blocking lanes, increasing traffic intensity, or applying signal timing offsets—to instantly preview forecasted flow scores.
  * **Status Table**: Lists all 9 junctions and their active congestion levels.

### 2. Command Map
* **Purpose**: Provides spatial visibility of Kozhikode's road corridors and UAVs.
* **Features**:
  * **Leaflet Map**: Rendered in dark tactical style, locked to Kozhikode coordinate boundaries (`minZoom: 13`, `maxZoom: 18`) to prevent layout gaps.
  * **Bidirectional Link Polylines**: Renders road segments colored dynamically by real-time congestion status. Hovering reveals detailed link statistics (density, speed, volume, travel time, queue length).
  * **Junction Tooltips**: Interactive circles marking junctions that open detailed telemetry feeds on click.
  * **UAV Tracker**: Displays live drone locations on flight routes.

### 3. AI Analytics
* **Purpose**: Breaks down vehicle classifications and ST-GNN prediction deviations.
* **Features**:
  * **Vehicle Classification**: Displays radial charts grouping traffic volume by vehicle type (two-wheelers, auto-rickshaws, cars, buses/trucks).
  * **Model Evaluation**: Charts historical accuracy comparing actual sensor readings vs. ST-GNN model predictions.
  * **Hourly Distribution**: Shows a bar chart of density distribution across a 24-hour cycle.

### 4. Traffic Forecasting
* **Purpose**: Runs future simulations to predict network bottleneck formations.
* **Features**:
  * **Forecast Sequencer**: Allows users to step through future time buckets.
  * **Mitigation Recommendation Alerts**: Displays active recommendations (e.g. signal cycle timings adjustments) triggered by forecasted critical bottlenecks.

### 5. Incident Center
* **Purpose**: The operations log to track, approve, or resolve road disruptions.
* **Features**:
  * **Incident Logger**: A modal form to input incident details. It utilizes a dropdown to log against standard Affected Link IDs (`L1-L26`) for ML compatibility.
  * **Travel Parameters**: Allows recording of Travel Direction, Lanes Blocked, and Start/End times.
  * **AI Disruption Rankings**: Automatically calculates a disruption index for each incident based on lane blockage and junction density, sorting the feed from most disruptive to least.

### 6. Drone Operations
* **Purpose**: Tracks UAV telemetry and manages flight route missions.
* **Features**:
  * **UAV Status Cards**: Displays battery percentages, speeds, coordinates, and current flight states.
  * **MAVLink Mission Planner**: Lets operators draw custom flight paths by selecting traffic nodes in sequence, validating coordinate connections, and uploading the path to the UAV.

### 7. Historical Intelligence
* **Purpose**: A persistent ledger of generated intelligence tokens.
* **Features**:
  * **Ledger Timeline**: Chronological feed of approved incident tokens (format: `TK-XXXX`) with priority filters.
  * **Detail Popups**: Displays coordinate previews and full incident briefs.

### 8. Drone Live Feeds
* **Purpose**: Displays real-time UAV video surveillance streams.
* **Features**:
  * **Multi-Cam Stream Grid**: Displays video streaming overlays.
  * **Dynamic Snapshots**: Automatically retrieves relevant traffic scene snapshots matching the coordinates of active drones.

### 9. Alert Generator
* **Purpose**: System diagnostics to test the notification toast pipeline.
* **Features**:
  * **Manual Injector**: Allows creating custom warning messages to verify that alert cards and toast notifications trigger correctly.

---

## 📁 Project Structure

```
nitdem/
├── src/
│   ├── components/
│   │   ├── layout/      → Sidebar, Header, IntelPanel (Intelligent Center), ToastStack, MobileDrawer
│   │   ├── map/         → CommandMap (Leaflet), LocationPicker (overlay modal), MiniMapPreview
│   │   └── pages/       → Dashboard, AIAnalytics, TrafficForecasting, IncidentCenter, DroneOperations
│   ├── hooks/           → useAppStore (global state), linkMaps (link ID dictionaries)
│   ├── types/           → TypeScript interfaces
│   ├── App.tsx          → Main routing shell
│   └── main.tsx         → App entry point
├── sync_datasets.cjs    → GCS Data Ingestion & Compile pipeline
├── PROJECT_OVERVIEW.txt  → Detailed system manual and flow diagrams
├── INCIDENT_DATA_FLOW_MANUAL.txt ➔ Incident data flow manual for ML pipeline
└── 24_links_upgrade_instructions.txt → Step-by-step instructions to scale forecasting
```
