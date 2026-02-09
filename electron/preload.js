const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform information
  platform: process.platform,
  isElectron: true,

  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
  showWindow: () => ipcRenderer.send('show-window'),

  // File dialogs
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),

  // Navigation events from main process
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, route) => callback(route));
  },

  // Remove navigation listener
  removeNavigateListener: () => {
    ipcRenderer.removeAllListeners('navigate');
  },

  // Backend status events
  onBackendStatus: (callback) => {
    ipcRenderer.on('backend-status', (event, status) => callback(status));
  },

  // Remove backend status listener
  removeBackendStatusListener: () => {
    ipcRenderer.removeAllListeners('backend-status');
  }
});

// Log that preload script has loaded
console.log('Electron preload script loaded');
