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

## Roadmap & Deferrals
The following modules are intentionally excluded from Phase 1 and will be introduced in subsequent phases:
*   **Phase 2**: SQLite catalog migrations and CelesTrak GP/TLE syncing.
*   **Phase 3**: SGP4 propagation physics and observer relative geometries.
*   **Phase 8**: Authenticated Space-Track API client integration.
*   **Phase 9**: Multi-stage conjunction screening (geometric miss-distance).
*   **Phase 10**: Progressive 20,000+ point catalog visualization.
*   **Phase 11**: Final UI polish & Turkish explanatory documentation.
