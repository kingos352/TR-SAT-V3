const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

let mainWindow;
let backendProcess;
let backendPort = 8000;

// PERF: GPU performance switches for better rendering in Electron
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

// Enforce Single Instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(startApp);
}

function killProcessOnPort(port) {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    if (process.platform === 'win32') {
      exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
        if (!stdout) return resolve(true);
        const lines = stdout.split('\n');
        const pidsToKill = new Set();
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
            const pid = parts[4];
            if (pid && pid !== '0') pidsToKill.add(pid);
          }
        });
        
        if (pidsToKill.size === 0) return resolve(true);
        
        const killPromises = Array.from(pidsToKill).map(pid => {
          return new Promise(res => {
            exec(`taskkill /F /PID ${pid}`, () => res());
          });
        });
        
        Promise.all(killPromises).then(() => {
          setTimeout(() => resolve(true), 2000); // Give it a moment to release
        });
      });
    } else {
      resolve(true); // Fallback for non-windows if ever needed
    }
  });
}

async function startApp() {
  // 1. Setup Runtime Data Directory
  const userDataDir = path.join(app.getPath('appData'), 'TR-SAT Mission Control V3');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  // Create minimal .env if it doesn't exist
  const envPath = path.join(userDataDir, '.env');
  if (!fs.existsSync(envPath)) {
    const defaultEnv = `CESIUM_ION_TOKEN=\nSPACETRACK_USERNAME=\nSPACETRACK_PASSWORD=\nAI_PROVIDER=local\n`;
    fs.writeFileSync(envPath, defaultEnv, 'utf8');
  }

  // 2. Kill anything using the port
  await killProcessOnPort(backendPort);

  // 3. Start Backend
  const isPackaged = app.isPackaged;
  const resourcesPath = isPackaged ? process.resourcesPath : __dirname;

  const backendExePath = path.join(resourcesPath, 'backend-exe', 'trsat-backend.exe');
  const frontendDistPath = path.join(resourcesPath, 'frontend-dist');

  if (!fs.existsSync(backendExePath)) {
    dialog.showErrorBox('Missing Backend', 'Could not find trsat-backend.exe. Please ensure the app was packaged correctly.');
    app.quit();
    return;
  }
  
  if (!fs.existsSync(frontendDistPath)) {
    dialog.showErrorBox('Missing Frontend', 'Could not find frontend-dist directory. Please ensure the app was packaged correctly.');
    app.quit();
    return;
  }

  const env = Object.assign({}, process.env, {
    TRSAT_DESKTOP_PORT: backendPort.toString(),
    TRSAT_FRONTEND_DIST_DIR: frontendDistPath,
    TRSAT_DATA_DIR: userDataDir,
    TRSAT_DESKTOP_MODE: '1'
  });

  backendProcess = spawn(backendExePath, [], { env });

  backendProcess.stdout.on('data', (data) => console.log(`Backend: ${data}`));
  backendProcess.stderr.on('data', (data) => console.error(`Backend Error: ${data}`));

  // 4. Wait for Backend Health
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds

  const checkHealth = () => {
    http.get(`http://127.0.0.1:${backendPort}/api/v1/health`, (res) => {
      if (res.statusCode === 200) {
        createWindow();
      } else {
        retryHealthCheck();
      }
    }).on('error', retryHealthCheck);
  };

  const retryHealthCheck = () => {
    attempts++;
    if (attempts >= maxAttempts) {
      dialog.showErrorBox('Backend Timeout', 'The backend failed to start within 30 seconds.');
      app.quit();
    } else {
      setTimeout(checkHealth, 1000);
    }
  };

  checkHealth();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 950,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: '#050814',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'TR-SAT Mission Control V3',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false // PERF: Prevent live tracking from being throttled when window loses focus
    }
  });

  mainWindow.loadURL(`http://127.0.0.1:${backendPort}`);

  // Disable DevTools in production builds
  if (!app.isPackaged) {
    // DevTools available in development only
  } else {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
        event.preventDefault();
      }
    });
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
