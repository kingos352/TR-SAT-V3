# TR-SAT Mission Control V3: Demo Video Script

**Target Length:** 3–5 minutes.
**Tone:** Professional, Academic, Technical.

---

### [0:00 - 0:30] Introduction & Architecture
*(Screen: Application booting via TR-SAT-Start.bat, UI loading to main console)*
**Narrator:** "Welcome to TR-SAT Mission Control V3, a local-first orbital intelligence platform designed for satellite propagation and situational awareness. This system is entirely decoupled, running a Python FastAPI backend with a React and CesiumJS frontend, utilizing local SQLite for catalog persistence."

### [0:30 - 1:00] Data Sources & Active Object Selection
*(Screen: Left Dock -> Catalog Panel. Clicking 'Sync Catalog', searching for ISS, setting it as Active Object)*
**Narrator:** "We pull public TLE and GP data from CelesTrak and Space-Track into a local database. Here, we sync the catalog, search for the International Space Station, and set it as our active target. Instantly, the 3D Cesium visualization snaps to the target's position."

### [1:00 - 1:45] Cesium Visualization & Live Tracking
*(Screen: Telemetry Panel -> Clicking 'Update Orbit', then 'Start Tracking')*
**Narrator:** "Once active, we update the state and visualize the orbital trajectory. We can engage Live Tracking mode. Note that this is a TLE/GP-based SGP4 propagation, not direct spacecraft telemetry. The backend's SGP4 physics engine streams state estimates over WebSocket at 5 Hz, updating the console in real-time."

### [1:45 - 2:30] Mission Replay & Ground Station Visibility
*(Screen: Opening Mission Replay, generating a 24h ephemeris, scrubbing timeline. Then opening Ground Station Visibility and scanning.)*
**Narrator:** "For historical or predictive analysis, Mission Replay allows interactive timeline scrubbing of pre-calculated ephemeris. Switching to the observer's perspective, the Ground Station Visibility tool calculates relative azimuth, elevation, and range to determine which objects are geometrically visible above the local horizon."

### [2:30 - 3:00] Pass Prediction Sky View
*(Screen: Pass Timeline Panel. Predicting passes for ISS, opening SVG Sky View and Elevation Profile)*
**Narrator:** "Using the Pass Timeline, we can generate highly accurate AOS and LOS windows. The detailed SVG Sky View and Elevation Profile visually map exactly where the target will appear and peak relative to the observer."

### [3:00 - 3:45] Conjunction Screening & Catalog Analytics
*(Screen: Conjunction Panel -> Screen Conjunctions. Then Space Environment Dashboard -> Run Analytics)*
**Narrator:** "The platform also features a Conjunction Screening module. This is geometric miss-distance screening, not collision probability, as public TLEs lack covariance matrices. To understand the broader space environment, the Analytics Dashboard provides instantaneous catalog-wide distributions across orbital regimes."

### [3:45 - 4:15] Research Mode & Export System
*(Screen: Research Mode Panel showing Mean Motion Trend and Illumination State. Export Panel showing CSV and MD downloads)*
**Narrator:** "The Phase 21 Research Mode adds heuristic decay indicators, historical TLE evolution charting, and approximate illumination awareness. Crucially, catalog analytics and reliability indicators are situational-awareness aids, not certified operational SSA products. Finally, all data can be exported entirely client-side, including comprehensive Mission Reports."

### [4:15 - 4:45] AI Assistant & Closing
*(Screen: Opening Assistant Panel, asking a question about SGP4)*
**Narrator:** "To support academic learning, the Mission Knowledge Assistant answers orbital mechanics queries with strict scientific guardrails. TR-SAT Mission Control V3 provides a highly capable, zero-latency desktop environment for orbital mechanics exploration. Thank you."
