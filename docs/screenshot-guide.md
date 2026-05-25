# TR-SAT Mission Control V3: Screenshot Capture Guide

To maintain a professional repository, follow these precise instructions to capture the official screenshots for the `README.md`. **Do not generate fake UI screenshots.**

## Prerequisite Setup
1. Launch TR-SAT V3 (via `TR-SAT-Start.bat`).
2. Press `F11` in your browser to enter Fullscreen mode.
3. Sync the `stations` catalog, search for `ISS (ZARYA)`, and set it as the Active Target.
4. Let the 3D globe render the trajectory.

## Required Screenshots

### 1. `mission-console.png`
*   **Action:** Click `Update State` and `Update Orbit`. Ensure the **Telemetry Panel** is expanded on the right and **Mission Workflow** is visible on the left.
*   **Focus:** Showcase the dense dashboard UI wrapping around the central 3D globe.

### 2. `live-tracking.png`
*   **Action:** Toggle **Start Tracking** in the Live Tracking Panel. Wait for 5-10 Hz telemetry strings to populate the stream.
*   **Focus:** The real-time data stream, highlighting "TLE-derived state estimate".

### 3. `mission-replay.png`
*   **Action:** Open the **Mission Replay** panel. Set window to `24 Hours`, step to `60s`. Click **Generate Ephemeris** and play.
*   **Focus:** The UI scrubber and the replay-specific UI marker on the globe.

### 4. `ground-station-visibility.png`
*   **Action:** Set Observer Location to your local city. Open **Ground Station Visibility**, set `Min Elev: 10°`, and run **Scan Visible Objects**.
*   **Focus:** The list of visible targets showing Range, Azimuth, and Elevation chips.

### 5. `pass-timeline-skyview.png`
*   **Action:** Open **Pass Prediction**. Click **Predict Passes**. 
*   **Focus:** Ensure the SVG Sky View and Elevation Profile charts are clearly visible alongside the pass table.

### 6. `conjunction-screening.png`
*   **Action:** Open **Conjunction Screening**. Select `Primary vs Active Catalog`. Click **Screen Conjunctions**.
*   **Focus:** The results table highlighting miss distances and severity tags (CRITICAL, WATCH, INFO).

### 7. `catalog-layer.png`
*   **Action:** Open **Catalog Layer**. Set limit to 2000. Check "Include Debris". Click **Load Snapshot**.
*   **Focus:** The 3D globe populated with thousands of points, demonstrating rendering performance.

### 8. `space-environment-dashboard.png`
*   **Action:** Open **Space Environment Dashboard**. Click **Run Analytics**.
*   **Focus:** The distribution statistics (LEO/MEO/GEO), payload vs debris ratios, and the professional layout.

### 9. `research-mode.png`
*   **Action:** Open **Research Mode Panel**. Select a target with historical TLE data (e.g. ISS).
*   **Focus:** The Mean Motion Trend SVG chart, Illumination State, and Heuristic Decay Indicators.

### 10. `export-system.png`
*   **Action:** Open the **Export Center**.
*   **Focus:** The options for Ephemeris CSV, Trajectory CZML, and Turkish Mission Report.

### 11. `assistant-panel.png`
*   **Action:** Open the **Mission Knowledge Assistant** and ask: "Explain SGP4 propagation".
*   **Focus:** The chatbot interface and the AI response rendering markdown.

*Save all PNG files directly into the `docs/assets/screenshots/` directory.*
