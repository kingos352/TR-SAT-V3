# TR-SAT Mission Control V3 - Demo Workflow

This document outlines the standard operational workflow for demonstrating TR-SAT Mission Control V3 during technical presentations or reviews.

## Prerequisites
Ensure that the `CESIUM_ION_TOKEN` is configured in your `.env` file for 3D globe visualization. Space-Track credentials (`SPACETRACK_USERNAME` / `SPACETRACK_PASSWORD`) are optional but recommended for authenticated source testing.

## Step-by-Step Demo Script

### 1. Start the Backend
Open a terminal, activate the virtual environment, and launch the FastAPI server:
```bash
cd backend
.\.venv\Scripts\Activate.ps1
py -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Start the Frontend
Open a new terminal and launch the Vite development server:
```bash
cd frontend
npm run dev
```

### 3. Confirm System Health
- Open `http://localhost:5173` in your browser.
- Point to the **Top Status Bar**. It should read **API: ONLINE**. This confirms the frontend is successfully communicating with the local FastAPI backend.

### 4. Catalog Synchronization
- Open the **Left Dock** panel.
- In the **Ingestion** section, select `stations` (or `active`) from the dropdown.
- Click **Sync Group**.
- **Explanation**: "The system is currently fetching predictive General Perturbation (GP/TLE) orbital elements from CelesTrak and persisting them to our local SQLite database. This ensures offline-capable, local-first analysis."

### 5. Search for an Object
- In the **Search** bar, type `ISS`.
- Click the search icon.
- **Explanation**: "The search queries our local resident space object catalog."

### 6. Set Active Object
- From the search results, click the **Target/Crosshair** icon next to `ISS (ZARYA)`.
- **Explanation**: "This promotes the ISS to the active object within the console, locking our telemetry panels to this specific satellite."

### 7. Update State
- On the **Right Dock**, locate the **Telemetry Panel**.
- Click **Update State**.
- **Explanation**: "We are now utilizing the SGP4 analytical propagator to calculate a TLE-derived state estimate (latitude, longitude, altitude) for the current UTC epoch."

### 8. Update Orbit
- In the **Telemetry Panel**, click **Update Orbit**.
- **Explanation**: "This generates a multi-point ephemeris window, projecting the orbit path and ground track on the 3D Cesium globe."

### 9. Start Live Tracking
- On the **Right Dock**, open the **Live Tracking Panel**.
- Click **Start Live Tracking**.
- **Explanation**: "We have now established a WebSocket connection. The backend is running high-frequency in-memory SGP4 physics to stream state updates at 1 Hz. *Note: This is live TLE-based tracking, not direct spacecraft telemetry.*"

### 10. Load Catalog Layer
- On the **Left Dock**, open the **Catalog Layer** section.
- Set the limit to `1000` objects and click **Load Snapshot**.
- **Explanation**: "This triggers an All-Catalog Snapshot. The system is computing the position of 1,000 objects for this exact timestamp. It is highly optimized for situational awareness visualization."

### 11. Run Conjunction Screening
- On the **Right Dock**, open the **Conjunction Screening** panel.
- Choose **Primary vs Filtered Catalog** mode, leave filters on `ALL`, and click **Run Screening**.
- **Explanation**: "The system is performing a geometric close approach screening. It evaluates Euclidean miss-distances between the ISS and thousands of cataloged objects over the next few days. *Note: This does not compute collision probability, as public TLE/GP data lacks covariance matrices.*"

### 12. Export Data
- On the **Right Dock**, scroll down to the **Data Export System** panel.
- Click **Ephemeris (CSV)** and **3D Trajectory (CZML)**.
- **Explanation**: "All exports are processed entirely client-side with zero latency. The data is converted directly from our frontend state into standardized formats."

### 13. Generate Mission Report
- In the **Data Export System**, click **Rapor (Türkçe)**.
- Open the downloaded Markdown file.
- **Explanation**: "This auto-generates a comprehensive mission analysis report, embedding our current propagation states, pass predictions, and conjunction screening results, complete with necessary scientific disclaimers."
