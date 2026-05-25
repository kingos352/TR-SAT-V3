# Desktop App Packaging Guide

TR-SAT Mission Control V3 can be packaged as a standalone native Windows Desktop application. 
This phase uses an **Electron shell** to provide a seamless native window, combined with a **PyInstaller** packaged FastAPI backend.

## Architecture
- **Shell**: Electron acts as a thin client to start the backend and open a `BrowserWindow` without browser UI elements.
- **Backend**: The FastAPI backend is compiled into a standalone Windows executable (`trsat-backend.exe`) and runs locally within the desktop app on loopback `127.0.0.1`.
- **Frontend**: The React frontend is bundled inside the Electron package and served dynamically by the FastAPI backend to avoid CORS and file protocol issues.

## How to Build the Desktop App
Ensure you have run the normal `TR-SAT-Build.bat` at least once so the virtual environment and node modules exist.

Run the new desktop build script:
```
TR-SAT-Desktop-Build.bat
```

This will:
1. Re-build the frontend.
2. Compile the backend into an executable using PyInstaller.
3. Install Electron dependencies.
4. Package everything into a standalone executable.

Output is located at:
`dist-desktop/TR-SAT-Mission-Control-V3-Portable.exe`

## Runtime Data & Secrets
When running the desktop app, data is isolated from the project repository to ensure safe updates and portability.

- **Storage Location**: `%APPDATA%\TR-SAT Mission Control V3\`
- **Database**: A new SQLite database is automatically created here on first launch.
- **Environment (.env)**: A `.env` template is placed here. You must open `%APPDATA%\TR-SAT Mission Control V3\.env` in a text editor to add your API keys (Cesium, Space-Track, Gemini/OpenRouter). **Do not package real keys into the `.exe`.**

## Troubleshooting
- **Port 8000 in use**: The desktop app prefers port 8000 for Cesium URL restriction compatibility. If another process is using it, an error dialog will appear. You must close the conflicting process and restart the app.
- **Cesium Token Not Working**: Check the `.env` in the `%APPDATA%` folder. Also, ensure your token allows `http://127.0.0.1:8000`.
- **Windows Defender Warning**: Unsigned portable executables may trigger Windows SmartScreen. Click "More info" -> "Run anyway".
- **App Closes Immediately**: Check if the backend executable failed. The console output can be checked by running the EXE from a terminal or checking for missing PyInstaller dependencies.
