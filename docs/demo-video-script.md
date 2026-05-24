# TR-SAT Mission Control V3 - Demo Video Script

**Target Length:** 2-4 minutes
**Target Audience:** Academic Jury, GitHub Portfolio Viewers, Technical Recruiters
**Tone:** Professional, scientifically accurate, confident

---

### 1. Opening [0:00 - 0:20]
*(Screen: Show the TR-SAT Mission Control main UI with the globe loaded)*
**Voiceover:** "Welcome to the TR-SAT Mission Control V3 demonstration. This is a local-first orbital intelligence platform designed for resident space object tracking and situational awareness."

### 2. Architecture & Data Sources [0:20 - 0:45]
*(Screen: Pan over the UI, highlight the left dock 'Data Sources' panel)*
**Voiceover:** "The architecture is built on a decoupled FastAPI Python backend and a React/CesiumJS frontend. Because this is a local-first system, it ingests predictive orbital elements directly from public sources like CelesTrak and an optional authenticated Space-Track integration into a local SQLite database. This ensures high-performance, offline-capable analysis."

### 3. ISS Selection and Propagation [0:45 - 1:15]
*(Screen: Search for 'ISS', click the crosshair icon to set active. Click 'Update State' and 'Update Orbit' in the telemetry panel)*
**Voiceover:** "Let's search for the International Space Station. By setting it as our active target, we can trigger the SGP4 analytical propagator. The backend calculates a TLE-derived state estimate for the current UTC epoch and projects the 3D orbit trajectory and ground track onto the Cesium globe."

### 4. Live TLE-Based Tracking [1:15 - 1:45]
*(Screen: Click 'Start Live Tracking', zoom in slightly to watch the marker update over time)*
**Voiceover:** "We can now initiate a WebSocket connection for high-frequency updates. The system runs in-memory SGP4 physics to stream state updates at 1 Hz. *It is important to note: This is TLE/GP-based SGP4 propagation, not direct spacecraft telemetry.* We are mathematically estimating its position in real-time."

### 5. All-Catalog Snapshot Layer [1:45 - 2:20]
*(Screen: Open 'Catalog Layer' panel, set limit to 2000, click 'Load Snapshot')*
**Voiceover:** "For broader situational awareness, TR-SAT features an All-Catalog Progressive Visualization layer. With a single click, we can render a snapshot of thousands of objects simultaneously around the globe. *Catalog visualization is snapshot-based, not high-rate all-object live tracking.*"

### 6. Conjunction Screening [2:20 - 3:00]
*(Screen: Open Conjunction panel, run a screening between ISS and ALL, wait for the table to populate, click on a 'WATCH' or 'INFO' result)*
**Voiceover:** "Next is our Conjunction Screening MVP. This module evaluates the Euclidean distance vectors between the ISS and thousands of cataloged objects over the coming days to detect close approaches. *To be scientifically precise: Conjunction Screening is geometric miss-distance screening, not collision probability.* It does not compute Pc because public TLE data lacks covariance matrices."

### 7. Export System [3:00 - 3:30]
*(Screen: Open Export panel, click CSV Ephemeris, CZML Trajectory, and Mission Report)*
**Voiceover:** "Finally, our client-side Export System allows zero-latency downloads of our analysis. We can instantly export CSV Ephemeris, 3D CZML trajectories, and comprehensive Markdown Mission Reports directly from the frontend state."

### 8. Closing [3:30 - 3:45]
*(Screen: Zoom out to show the full Earth with the catalog snapshot, show the GitHub repo link text on screen)*
**Voiceover:** "TR-SAT Mission Control V3 provides a powerful, scientifically-bounded foundation for orbital mechanics visualization. Thank you for watching. The source code and documentation are available on GitHub."
