# TR-SAT Mission Control V3

TR-SAT Mission Control V3 is a local-first orbital intelligence platform designed for satellite propagation, resident space object tracking, and situational awareness visualization. 

Powered by TLE/GP-based SGP4 propagation and a CesiumJS 3D mission view, TR-SAT provides a comprehensive desktop console for orbital mechanics analytics without relying on external cloud processing.

## 🚀 Key Features

*   **TLE/GP-Based SGP4 Propagation**: Mathematically propagates satellite positions based on Two-Line Element (TLE) and General Perturbation (GP) sets.
*   **Live TLE-Based Tracking**: Streams high-frequency (up to 5 Hz) orbital updates to the frontend using in-memory SGP4 physics and WebSocket connections.
*   **Conjunction Screening MVP**: Geometric close approach screening between primary targets and catalog objects to detect miss-distances.
*   **All-Catalog Progressive Visualization**: Snapshot visualization capable of rendering thousands of Resident Space Objects (RSOs) simultaneously.
*   **Client-Side Export System**: Zero-latency exports of Ephemeris (CSV), Trajectories (CZML), Ground Tracks (GeoJSON), and Mission Reports.
*   **Local-First Architecture**: Powered by a local SQLite persistence layer for TLE ingestion, ensuring fast, offline-capable analysis.

> [!WARNING]
> **Never commit your `.env` file!** Always use `.env.example` as a template and keep credentials strictly local.

## 🏗️ Architecture & Tech Stack

TR-SAT operates as a decoupled monorepo:
*   **Backend**: Python, FastAPI, Skyfield (SGP4 Astrodynamics), SQLAlchemy, SQLite.
*   **Frontend**: TypeScript, React, Vite, Zustand, CesiumJS.

---

## 📷 Screenshots & Media

*Before publishing, please capture and place the following screenshots in the `docs/assets/screenshots/` directory:*
- [ ] `mission-console.png` - Main console view with active satellite and telemetry panels.
- [ ] `live-tracking.png` - Live WebSocket telemetry tracking in action.
- [ ] `catalog-layer.png` - All-Catalog Snapshot rendering thousands of objects.
- [ ] `conjunction-screening.png` - Geometric miss-distance evaluation results.
- [ ] `export-system.png` - Client-side export panel.

**How to capture clean screenshots:**
1. Run backend and frontend servers.
2. Put your browser in Fullscreen mode (F11).
3. Sync the `stations` group, search for `ISS`, and set it as active.
4. Update the orbit to draw the 3D trajectory.
5. Take `mission-console.png`.
6. Start Live Tracking and take `live-tracking.png`.
7. Load the Catalog Layer (limit 1000) and take `catalog-layer.png`.
8. Run a Conjunction Screening and take `conjunction-screening.png`.
9. Expand the Export System panel and take `export-system.png`.

---

## ⚙️ Quick Start

### 1. Environment Variables
Create a `.env` file in the project root containing:
```env
APP_NAME="TR-SAT Mission Control V3"
APP_ENV=development
DATABASE_URL=sqlite:///./trsat_v3.sqlite
CORS_ORIGINS=http://localhost:5173

# Required for 3D Globe Visualization
CESIUM_ION_TOKEN=
VITE_CESIUM_ION_TOKEN=

# Space-Track (Optional, Authenticated GP/TLE source)
# WARNING: Do not commit the actual .env file with your credentials!
SPACETRACK_USERNAME=
SPACETRACK_PASSWORD=

# Frontend Configuration
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_WS_BASE_URL=ws://127.0.0.1:8000
```

### 2. Backend Setup
```bash
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
py -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend interface will be available at `http://localhost:5173`.

---

## 🎬 Demo Workflow

A typical demonstration workflow follows these steps:
1. Start backend and frontend servers.
2. Confirm API is ONLINE via the top Status Bar.
3. Sync the `stations` catalog group via the Left Dock.
4. Search for `ISS` in the Catalog Search.
5. Set the ISS as the active object.
6. Click **Update State** and **Update Orbit** in the Telemetry Panel.
7. Start **Live Tracking** to observe the TLE-derived state estimate in real-time.
8. Load the **Catalog Layer** snapshot to visualize the surrounding space environment.
9. Run a **Conjunction Screening** to geometrically evaluate miss-distances with nearby objects.
10. Use the **Data Export System** to download the Ephemeris (CSV), Trajectory (CZML), and the Turkish Mission Report.

For detailed steps, refer to `docs/demo-workflow.md`.

---

## 🔬 Scientific Model & Terminology

TR-SAT Mission Control adheres to strict scientific terminology regarding its capabilities.

*   **SGP4 Propagation**: The system uses the SGP4 analytical propagator to compute geocentric position and velocity states at any given UTC epoch based on public TLE/GP data.
*   **Geometric Close Approach Screening**: Conjunction screening is purely a geometric miss-distance evaluation between SGP4 propagated states.

### ⚠️ Limitations
*   **Not Direct Telemetry**: Live tracking is based on the latest available TLE/GP elements and UTC-time SGP4 propagation. It is *not* direct spacecraft telemetry or radar tracking.
*   **Not Collision Probability**: The system does *not* compute probability of collision (Pc). Public TLE/GP data does not include the covariance matrices required for precise collision probability.
*   **Not Certified Ephemeris**: CZML exports and ephemeris outputs are intended for visualization and situational awareness, not as certified operational ephemeris for mission command.

---

## 🗺️ Roadmap
- Future integration of covariance matrices for Pc calculation.
- Dockerization and cloud deployment manifests.
- Support for OPM/OEM ephemeris standard formats.

## 📄 License
To be selected before public release. This project is currently for academic and personal portfolio demonstration.

## 🙏 Acknowledgements
Built utilizing [Skyfield](https://rhodesmill.org/skyfield/) for astrodynamics, [CesiumJS](https://cesium.com/) for 3D rendering, and data from [CelesTrak](https://celestrak.org/) and [Space-Track](https://www.space-track.org/).
