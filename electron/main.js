const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const url = require('url');
const BackendManager = require('./backend-manager');
const TrayManager = require('./tray');

// Keep global references to prevent garbage collection
let mainWindow = null;
let backendManager = null;
let trayManager = null;
let isQuitting = false;

// Check if running in development mode
const isDev = !app.isPackaged;

// Get the correct path for resources
const getResourcePath = (relativePath) => {
  if (isDev) {
    return path.join(__dirname, '..', relativePath);
  }
  return path.join(process.resourcesPath, relativePath);
};

// Create the main application window
const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'ExpenseTracker Pro',
    // icon: path.join(__dirname, 'resources', 'icon.ico'),  // Add 256x256 icon later
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    },
    show: false, // Don't show until ready
    backgroundColor: '#ffffff'
  });

  // Create application menu
  createAppMenu();

  // Handle window ready to show
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window close - minimize to tray instead of quitting
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
    return true;
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Load the app
  if (isDev) {
    // Development: load from Vite dev server
    await mainWindow.loadURL('http://localhost:4028');
  } else {
    // Production: load from built files
    await mainWindow.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
  }
};

// Create the application menu
const createAppMenu = () => {
  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Nouvelle Depense',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate', '/add-edit-expense');
              mainWindow.show();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exporter les donnees',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate', '/settings-preferences');
              mainWindow.show();
            }
          }
        },
        {
          label: 'Importer les donnees',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate', '/settings-preferences');
              mainWindow.show();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edition',
      submenu: [
        { label: 'Annuler', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Retablir', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Couper', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copier', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Coller', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Tout selectionner', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { label: 'Recharger', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Forcer le rechargement', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Zoom avant', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom arriere', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Taille reelle', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Plein ecran', accelerator: 'F11', role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Outils de developpement',
          accelerator: 'CmdOrCtrl+Shift+I',
          role: 'toggleDevTools'
        }
      ]
    },
    {
      label: 'Navigation',
      submenu: [
        {
          label: 'Tableau de bord',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate', '/dashboard');
              mainWindow.show();
            }
          }
        },
        {
          label: 'Depenses',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate', '/expenses-management');
              mainWindow.show();
            }
          }
        },
        {
          label: 'Categories',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate', '/categories-management');
              mainWindow.show();
            }
          }
        },
        {
          label: 'Budgets',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate', '/budget-management');
              mainWindow.show();
            }
          }
        },
        {
          label: 'Analytiques',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate', '/analytics-reports');
              mainWindow.show();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Parametres',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate', '/settings-preferences');
              mainWindow.show();
            }
          }
        }
      ]
    },
    {
      label: 'Fenetre',
      submenu: [
        { label: 'Minimiser', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        {
          label: 'Minimiser dans la barre systeme',
          click: () => {
            if (mainWindow) {
              mainWindow.hide();
            }
          }
        },
        { type: 'separator' },
        { label: 'Fermer', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'A propos de ExpenseTracker Pro',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'A propos',
              message: 'ExpenseTracker Pro',
              detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nNode: ${process.versions.node}\nChrome: ${process.versions.chrome}`
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/your-repo/expensetracker-pro');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// Initialize the application
const initializeApp = async () => {
  try {
    // Start the backend server
    backendManager = new BackendManager(app);

    console.log('Starting backend server...');
    await backendManager.start();
    console.log('Backend server started successfully');

    // Create the main window
    await createWindow();

    // Initialize system tray
    trayManager = new TrayManager(mainWindow, app);
    trayManager.create();

  } catch (error) {
    console.error('Failed to initialize application:', error);
    dialog.showErrorBox(
      'Erreur de demarrage',
      `Impossible de demarrer l'application:\n${error.message}`
    );
    app.quit();
  }
};

// App ready event
app.whenReady().then(initializeApp);

// Handle all windows closed
app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until explicitly quit
  if (process.platform !== 'darwin') {
    isQuitting = true;
    app.quit();
  }
});

// Handle app activation (macOS dock click)
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

// Handle before quit - cleanup
app.on('before-quit', async () => {
  isQuitting = true;

  // Stop the backend server
  if (backendManager) {
    console.log('Stopping backend server...');
    await backendManager.stop();
    console.log('Backend server stopped');
  }

  // Destroy tray
  if (trayManager) {
    trayManager.destroy();
  }
});

// IPC Handlers

// Window controls
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('minimize-to-tray', () => {
  if (mainWindow) mainWindow.hide();
});

// Dialog handlers
ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// App info
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Get user data path
ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

// Show main window
ipcMain.on('show-window', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// Export functions for tray module
module.exports = {
  getMainWindow: () => mainWindow,
  setIsQuitting: (value) => { isQuitting = value; }
};
