# TR-SAT V3 - Live Demo Workflow

This document outlines the standard 10-step operational workflow for demonstrating the capabilities of the TR-SAT Mission Control V3 system.

## 1. System Initialization & Health Check
Start the backend (FastAPI) and frontend (Vite/React) servers. Verify system nominal status via the StatusBar, ensuring the API is **ONLINE** and the WebSocket connection is primed.

## 2. Catalog Synchronization (CelesTrak / Space-Track)
Open the **Catalog Ingestion** panel. Trigger a synchronization for critical groups (e.g., `active`, `stations`, `starlink`, `debris`). The system will parse and ingest the latest GP/TLE (General Perturbation / Two-Line Element) data into the local SQLite database.

## 3. Object Search and Filtering
Navigate to the **Search** panel. Query the ingested catalog by NORAD ID, Object Name (e.g., `ISS (ZARYA)`), or apply filters based on object type (`PAYLOAD`, `DEBRIS`, etc.) and radar cross-section category.

## 4. Target Selection & Focus
Select a target of interest from the search results to add it to the active tracking list (maximum 20 objects). Click **Focus Target** to center the telemetry panels and predictive analytics around this specific resident space object (RSO).

## 5. Ground Station (Observer) Configuration
Open the **Observer Panel**. Input the geodetic coordinates (Latitude, Longitude, Altitude) of your local ground station or radar facility (e.g., Nevşehir: `38.6244° N, 34.7144° E, 1200m`).

## 6. Live Telemetry Streaming (WebSocket)
Activate the WebSocket telemetry stream. The system will propagate the selected targets using the SGP4 algorithm in-memory and stream geodetic (Lat/Lon/Alt) and ECEF coordinates to the frontend at 1.0 Hz.

## 7. Orbit & Ground Track Visualization
Observe the 3D CesiumJS globe. Engage the **Orbit Path** and **Ground Track** layers for the active satellite. Enable **Camera Lock Follow** to track the satellite's movement in real-time across the Earth's surface.

## 8. Pass Prediction (Visibility Windows)
Utilize the **Pass Predictor** feature. Based on the selected ground station, calculate future visibility windows (AOS to LOS). Review the maximum elevation angles and pass durations to plan optical or RF acquisition.

## 9. Conjunction Screening (Close Approaches)
Initiate a geometric **Conjunction Screening** for the focused satellite against the local catalog. Set a propagation horizon (e.g., 3 days). Review the detected close approaches, categorized by Euclidean distance severity (`CRITICAL`, `CLOSE`, `WATCH`, `INFO`).

## 10. All-Catalog Snapshot Visualization
Disable live tracking and trigger the **All-Catalog Progressive Visualization**. The system will render a static snapshot of up to 5000 cataloged objects simultaneously, color-coded by object classification (Payload, Rocket Body, Debris) to visualize current orbital congestion.
