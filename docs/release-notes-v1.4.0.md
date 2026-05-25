# Release Notes - v1.4.0 (TR-SAT Mission Control V3 Final Release)

**Release Date:** May 2026

TR-SAT Mission Control V3 has reached its final release architecture. This major update transforms the platform into a comprehensive, local-first orbital intelligence suite powered by in-memory SGP4 physics, a decoupled React/FastAPI architecture, and CesiumJS 3D rendering.

## 🚀 Key Features
- **Local-First TLE/GP Catalog:** SQLite persistence for ultra-fast, offline-capable analysis.
- **SGP4 Propagation & Live Tracking:** 5Hz WebSocket streaming of TLE-derived state estimates.
- **Mission Replay Timeline:** Interactive scrubbing of precomputed SGP4 ephemeris.
- **Advanced Pass Prediction:** Detailed AOS/LOS timelines featuring SVG Sky View and Elevation Profile charts.
- **Conjunction Screening:** Geometric close-approach miss-distance evaluation against the active catalog.
- **Ground Station Visibility:** Real-time geometric horizon scanning for local observers.
- **Space Environment Dashboard:** Analytical catalog breakdown by orbital regime (LEO/MEO/GEO), source, and object type.
- **Advanced Research & SSA Suite:** Heuristic orbital decay indicators, historical TLE evolution tracking, and approximate illumination awareness.
- **Mission Knowledge Assistant:** Integrated AI agent for orbital mechanics education.
- **Client-Side Export:** Zero-latency generation of Ephemeris (CSV), Trajectories (CZML), and Mission Reports.

## 🛠️ Installation & One-Click Launch (Windows)
We have completely streamlined the setup process for Windows users.
1. Run `TR-SAT-Build.bat` to automatically configure `.env`, install dependencies, and compile the frontend.
2. Run `TR-SAT-Start.bat` to boot the backend server and launch your browser.

## ⚠️ Scientific Limitations (Please Read)
TR-SAT Mission Control adheres to strict scientific terminology and boundaries:
*   **Not Direct Telemetry:** Tracking is based on TLE/GP-based SGP4 propagation, not direct spacecraft telemetry or radar.
*   **Not Collision Probability:** Conjunction screening is a geometric miss-distance calculation. It does not compute probability of collision (Pc) as public TLEs lack covariance.
*   **Not Operational SSA:** Catalog analytics, regime classifications, and reliability indicators are situational-awareness aids, not certified operational SSA products.

## 🐛 Known Issues
- Very large conjunction screenings (>1000 targets) may cause momentary frontend lag. Adjust the `Max Candidates` setting if needed.
- Browsers with strict hardware acceleration settings disabled may experience lower FPS in the Cesium viewer.

## 🗺️ Future Roadmap (v2.0+)
- Integration of state covariance matrices for true Probability of Collision (Pc) analysis.
- Support for OEM/OPM ephemeris standards.
- Docker containerization for cloud deployment.
