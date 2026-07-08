# NIT DEM — AI-Powered Traffic Intelligence & UAV Monitoring Platform

A frontend Smart City Traffic Intelligence Command Center for Kozhikode, Kerala, integrated with a cloud data ingestion pipeline. Built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, and Leaflet.js.

---

## 📊 How the System Works (System Architecture & Data Flow)

The platform runs on a real-time data sync pipeline that pulls telemetry from Google Cloud Storage (GCS) and processes it directly in the React frontend:

1. **Telemetry Ingestion**: The data sync pipeline parses raw telemetry sheets (corridor geometry, flight routes, sensor logs, and ST-GNN predictions) into static JSON structures under the public directory.
2. **Global State Store**: `useAppStore.ts` acts as the central brain. It reads the telemetry array, manages map overlays, tracks active incidents, coordinates drone transits, and handles persistent storage inside the browser's `localStorage` (under the key `nitdem_incidents`).
3. **Map Pin-to-Link Matching**: Dropping coordinates on the tactical Leaflet map triggers an automated matching algorithm. The map coordinates are evaluated against the road geometries inside `linkMaps.ts` to pre-select the nearest affected road link segment ID (`L1` to `L26`). This ensures logged incident vectors correspond directly to graph edges inside downstream cloud-based ML forecasting networks.
4. **Adaptive UI Refreshes**: Closing sidebars, collapsing panels, or switching tabs triggers a dynamic `ResizeObserver` on map containers, executing Leaflet's `invalidateSize()` to redraw tiles and eliminate grey background tiling gaps.

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

## 🖥️ Detailed Screen-by-Screen Walkthrough & Operation Manual

The Command Center is divided into 9 functional screens. Here is how each screen works, what components are rendered, and how you use them:

### 1. Operations Dashboard
* **What it does**: Provides an aggregate overview of the entire city's traffic health, system efficiency, and ongoing alerts.
* **How it works**:
  * **Dynamic KPI Metrics**:
    * **Active Drones**: Shows the number of online UAVs (`status !== 'offline'`).
    * **Active Incidents**: Total number of pending or approved incidents (`status === 'active' || status === 'pending'`).
    * **Active Bottlenecks**: Count of links where the ST-GNN model predicts critical congestion.
  * **What-If Simulation Sandbox**: A playground allowing operators to test mitigation strategies:
    * **Lanes Blocked Slider**: Drag to simulate lane reductions (decreases traffic flow score).
    * **Traffic Intensity Multiplier**: Drag to scale the city's overall traffic volume.
    * **Signal Retiming Offset Slider**: Drag to test adding green phase duration (+seconds) at junctions.
    * **Apply Retiming Toggle**: Toggles signal phase adjustments, instantly recalculating the predicted system-wide flow score.
  * **Corridors Congestion Level Table**: Lists all 9 physical junctions alongside their real-time congestion scores and density metrics.

### 2. Command Map
* **What it does**: Displays Kozhikode's road networks, live traffic feeds, and active drone positions on a Leaflet map.
* **How it works**:
  * **Tactical Dark Map layer**: Map boundaries are strictly constrained around Kozhikode (`minZoom: 13`, `maxZoom: 18`, `maxBounds` locked) to prevent layout tiling glitches.
  * **Congestion Color-Coded Corridors**: Road segments are rendered as polylines. Colors update dynamically based on congestion level: Green (Free-flowing), Yellow (Moderate), Orange (Heavy), and Red (Critical).
  * **Interactive Hover Tooltips**: Hovering over a road polyline opens a tactical overlay box showing bidirectional traffic statistics (speed in km/h, volume in vehicles, estimated travel time in seconds, and queue lengths).
  * **Live UAV Tracker**: Displays live helicopter/plane markers that transition smoothly along flight route coordinates as they simulate node patrols.

### 3. AI Analytics
* **What it does**: Evaluates historical ST-GNN forecasting model accuracy and vehicle distributions.
* **How it works**:
  * **Vehicle Classification**: Processes incoming telemetry to display a radial chart showing the proportion of two-wheelers, auto-rickshaws, cars, and heavy transport vehicles.
  * **Model Validation Trend Chart**: Renders a line graph comparing actual sensor telemetry logs against the ST-GNN model's predictions, allowing operators to verify the model's accuracy.
  * **Hourly Traffic Density Distribution**: A bar chart displaying average network density split by hour.

### 4. Traffic Forecasting (ST-GNN)
* **What it does**: Steps into future time blocks to preview traffic conditions and automatically generate mitigation directives.
* **How it works**:
  * **Time Seeker Controls**: Features a slider allowing operators to view predictions 20 minutes, 40 minutes, or 60 minutes into the future.
  * **Forecast recommendations**: When a future bottleneck is predicted, the system automatically suggests dynamic actions (e.g. "Divert heavy vehicles to East Bypass", "Optimize green phase cycle timings by +15s").

### 5. Incident Center & Disruption Rankings
* **What it does**: The central ledger where operator incidents are logged, validated, and prioritized.
* **How it works**:
  * **Log Incident Modal**: Click the floating orange "+" button to open the logger. Drop a marker pin on the map to pre-fill coordinates, and select the Affected Link ID dropdown (`L1` to `L26`).
  * **Form Parameters**: Fill in type, travel direction (*Towards Bmh, Towards Puthiyara, etc.*), lanes blocked, start/end times, and description.
  * **AI Disruption Rankings List**: Automatically sorts the active incident feed based on a calculated disruption score:
    $$\text{Disruption Index} = (\text{Lanes Blocked} \times 25) + (\text{Junction Density} \times 0.5)$$
    This ensures critical blockages are sorted and highlighted at the top of the feed.

### 6. Drone Operations
* **What it does**: Manages UAV surveillance fleets, monitors telemetry, and plans flight routes.
* **How it works**:
  * **UAV Telemetry Cards**: Displays battery percentages, current patrol speeds, GPS coordinate tracking, and live connection statuses.
  * **MAVLink Mission Planner**: Allows drawing custom flight routes. Operators click junctions on the map in sequence (e.g. *Stadium Junction ➔ Bus Stand Junction*), check the connection lines, and hit "Dispatch" to upload the mission to the drone.

### 7. Historical Intelligence
* **What it does**: Keeps a historical record of all supervisor-approved incident tokens.
* **How it works**:
  * **Ledger Timeline**: Displays all logged tokens (format: `TK-XXXX`) sorted chronologically.
  * **Priority Filters**: Quick filter tabs to view only critical, high, or resolved tokens.

### 8. Drone Live Feeds
* **What it does**: Renders video surveillance streams corresponding to drone coordinate positions.
* **How it works**:
  * **Multi-Cam Stream Grid**: Simulates live aerial cameras checking junctions.
  * **Dynamic Snapshots**: Displays captured traffic camera snapshots matching the active drone's position (e.g. showing a bus stand screenshot when a drone arrives at the Bus Stand Junction).

### 9. Alert Generator
* **What it does**: Diagnostic page used to test the top-right alert toast notification stack.
* **How it works**:
  * **Manual Alert Dispatcher**: Operators select alert types, choose priority levels, type test messages, and trigger notifications to verify that toast cards pop up correctly.
