# One-Click Launch Guide

TR-SAT Mission Control V3 has been packaged to run as a single integrated application using local FastAPI static serving.

## Scripts Overview

### Unified Interactive Launcher
**`TR-SAT.bat`**
The easiest way to operate TR-SAT is via the new unified interactive menu. Running this file will open a command-line interface allowing you to choose between building or starting the Web App and Desktop Executable.

### Quick Shortcuts
The following `.bat` files are available in the root directory for quick access (they simply call their corresponding PowerShell scripts located in `scripts/windows/`):

#### 1. `TR-SAT-Build.bat`
Run this script once after cloning the repository, or after pulling any updates from GitHub. 
It performs the following automatically:
- Checks for Node.js (`npm`) and Python.
- Creates `.env` from `.env.example` if it doesn't exist.
- Creates a Python virtual environment (`backend/.venv`).
- Installs all backend and frontend dependencies.
- Runs backend tests to verify integrity.
- Builds the React frontend into static files (`frontend/dist`).

#### 2. `TR-SAT-Start.bat`
Run this script to launch the application.
It performs the following automatically:
- Starts the FastAPI backend server on `127.0.0.1:8000`.
- Serves the built frontend directly from the backend.
- Opens your default web browser to the application URL.

#### 3. `TR-SAT-App.bat`
Run this script for a Desktop-like App Window Mode.
- It uses Microsoft Edge or Chrome in `--app` mode to open the frontend without address bars or browser tabs.
- It is not a full native Electron/Tauri package; it preserves the local-first FastAPI + React architecture but gives a desktop feel.
- If the backend is already running (e.g. you previously used `TR-SAT-Start.bat`), it will detect it and instantly open the app window.

## Desktop-like App Window Mode
This new mode provides an immersive, standalone window experience while keeping the codebase lightweight. Normal browser mode still works concurrently or independently.

## Local Production Mode vs Manual Development Mode

**Local Production Mode (One-Click):**
- URL: `http://127.0.0.1:8000`
- The backend serves API routes at `/api/v1` and the React frontend at `/`.
- No Vite dev server is required.

**Manual Development Mode:**
- Backend URL: `http://127.0.0.1:8000` (started manually via Uvicorn).
- Frontend URL: `http://localhost:5173` (started manually via `npm run dev`).
- Hot-reloading is enabled for both.

## Requirements
- **OS**: Windows 10/11
- **Python**: Python 3.12 is highly recommended (the launcher looks for `py -3.12` before falling back to default `py`).
- **Node.js**: Node.js LTS and `npm` must be installed.
- **Cesium Ion Token**: Optional but recommended (Add to `.env`).
- **Space-Track Credentials**: Optional for authenticated GP sources (Add to `.env`).

## Troubleshooting

- **`Port 8000 is already in use`**: The launcher detected another application (or an old instance of TR-SAT) using port 8000. Close the other process and try again.
- **`npm not found`**: You need to install Node.js. Ensure `npm` is added to your Windows PATH.
- **`py not found`**: The Python Launcher for Windows is missing. Ensure you check "Install Python Launcher" when installing Python.
- **`Frontend build not found!`**: You tried running `TR-SAT-Start.bat` without building first. The start script will attempt to call the build script automatically, but if it fails, run `TR-SAT-Build.bat` manually and check for specific errors.
- **`WebSocket Connection Error`**: Ensure your browser isn't blocking local WebSockets or that you didn't manually close the terminal window running the backend.
