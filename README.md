# TR-SAT Mission Control V3

TR-SAT Mission Control V3 is a local-first orbital intelligence and mission analysis console designed for satellite propagation, pass prediction, and resident space object tracking.

## Architecture Summary
The system is built as a decoupled monorepo containing:
*   **Backend (Python + FastAPI)**: Exposes REST APIs, handles SGP4 dynamic orbit calculations, and queries the local SQLite database for cached catalog records.
*   **Frontend (React + TypeScript + Vite)**: Renders a modern aerospace-grade control panel centered around a 3D CesiumJS globe visualizer.

## Phase 1 Scope
Phase 1 establishes the baseline monorepo configuration, environment settings, backend API routing, frontend styling framework, and an empty interactive CesiumJS globe container with a missing-token fallback.

## Setup Instructions

### Environment Variables
Create a `.env` file in the project root containing:
```env
APP_NAME="TR-SAT Mission Control V3"
APP_ENV=development
DATABASE_URL=sqlite:///./trsat_v3.sqlite
CORS_ORIGINS=http://localhost:5173
CESIUM_ION_TOKEN=
SPACETRACK_USERNAME=
SPACETRACK_PASSWORD=
VITE_API_BASE_URL=http://localhost:8000
VITE_CESIUM_ION_TOKEN=
```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```powershell
   py -3.12 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
3. Upgrade pip and install dependencies:
   ```powershell
   py -m pip install --upgrade pip
   py -m pip install -r requirements.txt
   ```
4. Run tests to verify the setup:
   ```powershell
   py -m pytest -q
   ```
5. Launch the backend development server:
   ```powershell
   py -m uvicorn app.main:app --reload
   ```

The backend API will be available at `http://localhost:8000`. The health check is available at `http://localhost:8000/api/v1/health`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```

The frontend interface will be available at `http://localhost:5173`.

---

## Phase 2: Catalog Ingestion & Local Persistence
Phase 2 establishes the database schemas, TLE parsing utilities, classification modules, and CelesTrak syncing operations.

### Local SQLite Persistence
*   **`rso_catalog`**: Stores primary resident space object metadata (Name, NORAD ID, classification type, category, COSPAR ID).
*   **`tle_records`**: Stores historical and active TLE tracks (Line 1/2, inclination, eccentricity, mean motion, epoch, and drag terms). Indexed on `(norad_id, epoch)` to avoid duplications.

### API Endpoints
*   `POST /api/v1/catalog/sync`: Synchronizes public CelesTrak TLE groups (e.g. `active`, `stations`, `starlink`, `debris`) into local database.
    *   *Body example*: `{"group": "stations"}`
*   `GET /api/v1/catalog/groups`: List of supported sync groups.
*   `GET /api/v1/catalog/search?q={query}`: Searches local database by NORAD ID or name. Filterable by `group`, `object_type`, and `category`.
*   `GET /api/v1/catalog/{norad_id}`: Retrieves details for a specific catalog object with its latest TLE record.

*Notice: Public catalog synchronization downloads calculated GP/TLE orbital elements. This represents predictive numerical ephemerides and should not be treated as direct operational spacecraft command telemetry.*

---

## Phase 3: Physics Engine & SGP4 Propagation Layer
Phase 3 implements the mathematical foundation for orbital state propagation and ground-based observer calculations.

### Propagation Algorithms
*   **SGP4 Propagation**: Utilizes the analytical SGP4 propagator (via Skyfield) to compute geocentric position and velocity states at any given UTC epoch.
*   **WGS84 Geodetic Subpoint**: Calculates latitude, longitude, and elevation relative to the WGS84 Earth reference ellipsoid.
*   **ECEF Coordinate Approximation**: Converts geodetic positions to Earth-Centered, Earth-Fixed (ECEF) coordinates $(X,Y,Z)$ using a spherical approximation:
    $$r = R_{earth} + \text{altitude}$$
    $$X = r \cos(\phi) \cos(\lambda), \quad Y = r \cos(\phi) \sin(\lambda), \quad Z = r \sin(\phi)$$
    *Notice: This conversion is optimized for 3D globe visualization (Cesium) mapping, not high-precision geodetic analysis.*

### Observer relative geometry (AER)
*   Computes topocentric ground-station relative parameters:
    *   **Azimuth ($Az$)**: Horizontal coordinate angle ($0^\circ$ to $360^\circ$).
    *   **Elevation ($El$)**: Altitude coordinate angle relative to the horizon ($-90^\circ$ to $90^\circ$).
    *   **Range ($R$)**: Directly computed straight-line Euclidean distance in kilometers.

### TLE Reliability Diagnostics
*   Tracks TLE age (in days) relative to the propagation UTC epoch.
*   Categorizes elements based on validity/freshness thresholds:
    *   `FRESH` ($\le 2$ days old)
    *   `AGING` ($> 2$ and $\le 14$ days old)
    *   `STALE` ($> 14$ days old)

---

## Phase 4: FastAPI Physics & Observer Endpoints
Phase 4 exposes the SGP4 astrodynamics propagator and observer geometry through unified REST API endpoints.

### API Endpoints

#### 1. Propagation Services (`/api/v1/propagation`)
*   `POST /state`: Propagates position using raw TLE lines.
    *   *Payload*: `PropagationRequest` (name, line1, line2, timestamp_utc)
*   `POST /ephemeris`: Generates coordinate timeseries using raw TLE lines.
    *   *Payload*: `EphemerisRequest` (name, line1, line2, start_time_utc, end_time_utc, step_seconds)
*   `POST /catalog/state`: Propagates position using database-backed TLE based on `norad_id`.
    *   *Payload*: `CatalogPropagationRequest` (norad_id, timestamp_utc)
*   `POST /catalog/ephemeris`: Generates coordinate timeseries using database-backed TLE based on `norad_id`.
    *   *Payload*: `CatalogEphemerisRequest` (norad_id, start_time_utc, end_time_utc, step_seconds)

#### 2. Observer & Tracking Services (`/api/v1/observer`)
*   `POST /aer`: Computes topocentric ground-station relative AER (Azimuth, Elevation, Range) coordinates using raw TLE.
    *   *Payload*: `ObserverAERRequest` (line1, line2, timestamp_utc, observer_latitude_deg, observer_longitude_deg, observer_elevation_m)
*   `POST /catalog/aer`: Computes observer AER coordinates using database-backed TLE based on `norad_id`.
    *   *Payload*: `CatalogObserverAERRequest` (norad_id, timestamp_utc, observer_latitude_deg, observer_longitude_deg, observer_elevation_m)
*   `POST /passes`: Predicts ground-station visibility pass windows using raw TLE.
    *   *Payload*: `PassPredictionRequest` (line1, line2, observer_latitude_deg, observer_longitude_deg, start_time_utc, end_time_utc, min_elevation_deg)
*   `POST /catalog/passes`: Predicts visibility pass windows using database-backed TLE based on `norad_id`.
    *   *Payload*: `CatalogPassPredictionRequest` (norad_id, observer_latitude_deg, observer_longitude_deg, start_time_utc, end_time_utc, min_elevation_deg)

*Notice: Pass predictions use Skyfield's analytical event finding methods. The elevation threshold (Elevation Mask, default $10^\circ$) filters out low-altitude horizon blockages. Real-time satellite tracking uses mathematical SGP4 propagation from historical elements; it is not a direct downlink connection to the spacecraft.*

---

## Phase 5: Frontend API Integration & Mission Console Panels
Phase 5 connects the React/TypeScript frontend to the FastAPI backend, implementing core control panels and aerospace dark themes.

### Frontend Integration Summary
*   **Fully-Typed API Client (`src/api/client.ts`)**: Integrates endpoints for health checking (`getHealth`), catalog group syncing (`syncCatalogGroup`), RSO search (`searchCatalog`), propagation state calculation (`getCatalogState`), observer AER retrieval (`getCatalogAER`), and ground pass predicting (`getCatalogPasses`).
*   **State Management (`src/store/useConsoleStore.ts`)**: Implements Zustand state store keeping track of selected objects (max 20), active target, observer configurations, API statuses, and interactive logs.
*   **Console UI Panels**:
    *   **StatusBar (`src/components/Console/StatusBar.tsx`)**: Displays API connectivity (ONLINE/OFFLINE), dynamic UTC clocks, tracked objects, focused target details, and active ground station.
    *   **SidePanel (`src/components/Console/SidePanel.tsx`)**: Controls CelesTrak catalog synchronization, RSO queries, search result lists, focus/selection options, and real-time event logs. Displays a warning banner if selection sets exceed 20 objects.
    *   **TelemetryPanel (`src/components/Console/TelemetryPanel.tsx`)**: Focuses on active target geodetic latitude/longitude, altitude, ECEF coordinates, and reliability status (Fresh, Aging, Stale) with update triggers.
    *   **ObserverPanel (`src/components/Console/ObserverPanel.tsx`)**: Customizes ground observers (default Nevşehir: `38.6244° N, 34.7144° E, 1200m`) and triggers topocentric AER/Pass prediction computations for the active target.

---

## Roadmap & Deferrals
The following modules are intentionally excluded from Phase 5 and will be introduced in subsequent phases:
*   **Phase 6**: Cesium satellite and orbit path rendering (empty interactive globe container renders for now).
*   **Phase 7**: WebSocket telemetry streaming.
*   **Phase 8**: Authenticated Space-Track API client integration (credentials are placeholder values only).
*   **Phase 9**: Multi-stage conjunction screening (close approach detection).
*   **Phase 10**: Progressive 20,000+ point catalog visualization.
*   **Phase 11**: Final UI polish & Turkish explanatory documentation.




