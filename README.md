# NIT DEM — AI-Powered Traffic Intelligence & UAV Monitoring Platform

A frontend-only Smart City Traffic Intelligence Command Center for Kozhikode, Kerala. Built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, and Leaflet.js.

## Login Credentials

- **Username:** `admin`
- **Password:** `password`

## Run in VS Code

### 1. Prerequisites
Install [Node.js](https://nodejs.org/) (version 18 or higher). Check with:
```bash
node -v
npm -v
```

### 2. Open the project
- Unzip the project folder.
- Open the folder in VS Code (`File → Open Folder...`).

### 3. Install dependencies
Open a terminal in VS Code (`` Ctrl+` ``) and run:
```bash
npm install
```

### 4. Start the development server
```bash
npm run dev
```

This starts Vite's dev server (usually at `http://localhost:5173`). Open that URL in your browser.

### 5. Build for production (optional)
```bash
npm run build
npm run preview
```

## Project Structure

```
nitdem/
├── src/
│   ├── components/
│   │   ├── layout/      → Sidebar, Header, IntelPanel, ToastStack, MobileDrawer
│   │   ├── map/          → CommandMap (Leaflet)
│   │   └── pages/        → Login, Dashboard, AIAnalytics, TrafficForecasting,
│   │                        IncidentCenter, DroneOperations,
│   │                        HistoricalIntelligence, AlertGenerator, Reports
│   ├── data/             → Static traffic node, drone, token, weather data
│   ├── hooks/            → useAppStore — central state (localStorage-backed)
│   ├── types/            → TypeScript interfaces
│   ├── utils/            → Formatting helpers
│   ├── App.tsx           → Main layout shell & routing
│   ├── main.tsx          → Entry point
│   └── index.css         → Tailwind + global styles
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Features

- **Authentication** — glassmorphism login with animated success/failure states.
- **Command Map** — Leaflet dark tactical map centered on Kozhikode with an
  operational monitoring zone polygon, 5 traffic nodes, corridor routes
  colored by congestion, and live drone markers.
- **Dashboard** — animated KPI counters, vehicle flow & traffic score charts,
  node status table.
- **AI Analytics** — vehicle classification, model accuracy radial charts,
  hourly breakdown.
- **Traffic Forecasting** — ST-GNN event simulation with realistic loading
  sequence and AI recommendations.
- **Incident Center** — floating "Log Incident" button, modal form, automatic
  token generation.
- **Drone Operations** — live UAV fleet status with simulated movement between
  nodes every few seconds.
- **Historical Intelligence** — timeline of all tokens with filter and detail
  modal.
- **Alert Generator** — demo page to create any alert type and generate
  tokens (format `TK-XXXX`).
- **Reports** — traffic, incident, drone, and AI prediction summaries with
  export buttons (UI only).
- **Notifications** — top-right toast stack for new tokens/alerts.
- **Persistence** — tokens and incidents are stored in `localStorage`.

## Notes

- All data is simulated/mocked — there is no backend or database.
- Theme toggle switches a `light-mode` class; dark mode is the primary
  designed experience.
- Map tiles load from CartoDB's public dark basemap (requires internet
  connectivity in the browser to display map tiles).
