const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, nativeImage, shell } = require('electron');
const path = require('path');
const http = require('http');
const { spawn, exec } = require('child_process');
const fs = require('fs');

// Set Windows AppUserModelId for native Action Center notifications & taskbar grouping
const APP_ID = 'com.aetherclick.autoclicker';
app.setAppUserModelId(APP_ID);

// Hardware GPU Acceleration and Fluidity Flags
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-smooth-scrolling');

let mainWindow = null;
let tray = null;
let engineProcess = null;
let isQuitting = false;
let lastClickerRunning = false;
let statusInterval = null;

const BACKEND_PORT = 5678;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

// Enforce single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (!mainWindow.isVisible()) mainWindow.show();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Windows Toast Notification Helper (Action Center Sidebar)
function showWindowsSidebarNotification(title, message) {
  try {
    const iconPath = path.join(__dirname, 'app_icon.ico');
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title || 'AetherClick',
        body: message || '',
        icon: fs.existsSync(iconPath) ? iconPath : undefined,
        silent: false,
        timeoutType: 'default'
      });

      notification.on('click', () => {
        if (mainWindow) {
          mainWindow.show();
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        }
      });

      notification.show();
    }
  } catch (err) {
    console.warn('[Notification Error]', err);
  }
}

// Check if backend HTTP service is healthy
function isBackendAlive(port = BACKEND_PORT) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/status`, { timeout: 800 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Query backend status JSON
function getBackendStatus(port = BACKEND_PORT) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/status`, { timeout: 800 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

// Locate appropriate engine binary / script
function getEngineCommand() {
  if (app.isPackaged) {
    const packagedExe = path.join(process.resourcesPath, 'engine', 'aether-engine.exe');
    const webDir = path.join(process.resourcesPath, 'engine');
    return {
      cmd: packagedExe,
      args: [String(BACKEND_PORT), webDir],
      cwd: webDir
    };
  }

  const devExe = path.join(__dirname, 'dist', 'aether-engine', 'aether-engine.exe');
  if (fs.existsSync(devExe)) {
    return {
      cmd: devExe,
      args: [String(BACKEND_PORT), __dirname],
      cwd: __dirname
    };
  }

  // Fallback to python backend.py
  return {
    cmd: 'python',
    args: ['backend.py', String(BACKEND_PORT), __dirname],
    cwd: __dirname
  };
}

// Launch backend engine process
async function startBackend() {
  const alive = await isBackendAlive();
  if (alive) {
    console.log('[AetherClick] Backend is already running on port', BACKEND_PORT);
    return true;
  }

  const { cmd, args, cwd } = getEngineCommand();
  console.log(`[AetherClick] Starting engine: ${cmd} in ${cwd}`);

  try {
    engineProcess = spawn(cmd, args, {
      cwd,
      windowsHide: true,
      stdio: 'ignore',
      detached: false
    });

    engineProcess.on('error', (err) => {
      console.error('[AetherClick] Failed to spawn engine:', err);
    });
  } catch (err) {
    console.error('[AetherClick] Exception spawning engine:', err);
  }

  const startTime = Date.now();
  while (Date.now() - startTime < 8000) {
    if (await isBackendAlive()) {
      console.log('[AetherClick] Backend engine ready.');
      return true;
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  console.warn('[AetherClick] Engine readiness timed out.');
  return false;
}

// Cleanly stop engine
function stopBackend() {
  if (engineProcess && !engineProcess.killed) {
    try {
      if (process.platform === 'win32' && engineProcess.pid) {
        exec(`taskkill /pid ${engineProcess.pid} /T /F`);
      } else {
        engineProcess.kill('SIGTERM');
      }
    } catch (e) {}
    engineProcess = null;
  }
}

// Create System Tray
function createTray() {
  const iconPath = path.join(__dirname, 'app_icon.ico');
  const trayIcon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : nativeImage.createEmpty();

  tray = new Tray(trayIcon);
  tray.setToolTip('AetherClick — Precision Auto Clicker');

  updateTrayMenu(false);

  // Clicking tray icon restores/shows window
  tray.on('click', () => {
    if (!mainWindow) {
      createWindow();
      return;
    }
    if (mainWindow.isVisible()) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
        mainWindow.focus();
      } else {
        mainWindow.focus();
      }
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function updateTrayMenu(isRunning = false) {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open AetherClick',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    { type: 'separator' },
    {
      label: isRunning ? '⚡ AutoClicker: ACTIVE' : '⏸ AutoClicker: IDLE',
      enabled: false
    },
    {
      label: isRunning ? 'Stop AutoClicker (F6)' : 'Start AutoClicker (F6)',
      click: async () => {
        try {
          const endpoint = isRunning ? '/api/stop' : '/api/start';
          const postData = JSON.stringify({});
          const req = http.request(`http://127.0.0.1:${BACKEND_PORT}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': postData.length }
          });
          req.write(postData);
          req.end();
        } catch (e) {}
      }
    },
    { type: 'separator' },
    {
      label: 'Quit Completely',
      click: () => {
        isQuitting = true;
        if (statusInterval) clearInterval(statusInterval);
        stopBackend();
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 840,
    minWidth: 460,
    minHeight: 680,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    icon: path.join(__dirname, 'app_icon.ico'),
    resizable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  mainWindow.setMenu(null);

  // Open external links (e.g. Facebook, Instagram, docs) in the user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== BACKEND_URL && !url.startsWith(BACKEND_URL)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.loadURL(BACKEND_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // When user clicks close, hide to tray and show sidebar notification!
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();

      showWindowsSidebarNotification(
        'AetherClick — Running in Background',
        'AetherClick is still active in your system tray.\nGlobal hotkeys (F6, F7, F8) remain active.'
      );
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Periodic background poller to keep tray menu and notifications synced
function startStatusPoller() {
  statusInterval = setInterval(async () => {
    const status = await getBackendStatus();
    if (!status) return;

    if (status.running !== lastClickerRunning) {
      lastClickerRunning = status.running;
      updateTrayMenu(status.running);

      if (status.running) {
        showWindowsSidebarNotification(
          'AetherClick — Clicker Started',
          `AutoClicker is active [${status.hotkey || 'F6'}] • Running in background`
        );
      } else {
        showWindowsSidebarNotification(
          'AetherClick — Clicker Paused',
          `AutoClicker paused • Total clicks: ${status.total_clicks || 0}`
        );
      }
    }
  }, 1000);
}

// IPC Window Controls
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-close', () => {
  if (mainWindow) {
    mainWindow.hide();
    showWindowsSidebarNotification(
      'AetherClick — Running in Background',
      'AetherClick is still active in your system tray.\nGlobal hotkeys (F6, F7, F8) remain active.'
    );
  }
});

ipcMain.on('app-quit', () => {
  isQuitting = true;
  if (statusInterval) clearInterval(statusInterval);
  stopBackend();
  app.quit();
});

ipcMain.on('show-notification', (event, { title, message }) => {
  showWindowsSidebarNotification(title, message);
});

ipcMain.on('open-external', (event, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    shell.openExternal(url);
  }
});

ipcMain.handle('window-toggle-maximize', () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  } else {
    mainWindow.maximize();
    return true;
  }
});

ipcMain.handle('window-toggle-pin', () => {
  if (!mainWindow) return false;
  const isPinned = !mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(isPinned);
  return isPinned;
});

ipcMain.handle('window-is-pinned', () => {
  return mainWindow ? mainWindow.isAlwaysOnTop() : false;
});

app.whenReady().then(async () => {
  await startBackend();
  createWindow();
  createTray();
  startStatusPoller();

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  if (statusInterval) clearInterval(statusInterval);
  stopBackend();
});

process.on('exit', () => {
  stopBackend();
});
