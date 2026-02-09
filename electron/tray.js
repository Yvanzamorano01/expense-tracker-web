const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

class TrayManager {
  constructor(mainWindow, app) {
    this.mainWindow = mainWindow;
    this.app = app;
    this.tray = null;
  }

  /**
   * Get the tray icon path
   */
  getIconPath() {
    const isDev = !this.app.isPackaged;

    if (isDev) {
      return path.join(__dirname, 'resources', 'tray.png');
    }
    return path.join(process.resourcesPath, 'app', 'electron', 'resources', 'tray.png');
  }

  /**
   * Create the system tray
   */
  create() {
    const iconPath = this.getIconPath();

    // Create a native image for the tray
    // If the icon doesn't exist, create a simple colored icon
    let icon;
    try {
      icon = nativeImage.createFromPath(iconPath);
      if (icon.isEmpty()) {
        // Create a simple 16x16 icon as fallback
        icon = this.createFallbackIcon();
      }
    } catch (error) {
      console.warn('Could not load tray icon, using fallback');
      icon = this.createFallbackIcon();
    }

    // Resize icon for tray (16x16 on Windows)
    if (!icon.isEmpty()) {
      icon = icon.resize({ width: 16, height: 16 });
    }

    this.tray = new Tray(icon);
    this.tray.setToolTip('ExpenseTracker Pro');

    // Create context menu
    this.updateContextMenu();

    // Handle tray click - show/focus window
    this.tray.on('click', () => {
      this.showWindow();
    });

    // Handle double-click
    this.tray.on('double-click', () => {
      this.showWindow();
    });
  }

  /**
   * Create a simple fallback icon
   */
  createFallbackIcon() {
    // Create a simple 16x16 green icon as fallback
    const size = 16;
    const canvas = Buffer.alloc(size * size * 4);

    // Fill with a green color (RGBA)
    for (let i = 0; i < size * size; i++) {
      const offset = i * 4;
      canvas[offset] = 34;     // R
      canvas[offset + 1] = 197; // G
      canvas[offset + 2] = 94;  // B
      canvas[offset + 3] = 255; // A
    }

    return nativeImage.createFromBuffer(canvas, {
      width: size,
      height: size
    });
  }

  /**
   * Show and focus the main window
   */
  showWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  /**
   * Update the context menu
   */
  updateContextMenu() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Ouvrir ExpenseTracker Pro',
        click: () => this.showWindow()
      },
      { type: 'separator' },
      {
        label: 'Ajouter une depense',
        click: () => {
          this.showWindow();
          if (this.mainWindow) {
            this.mainWindow.webContents.send('navigate', '/add-edit-expense');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Tableau de bord',
        click: () => {
          this.showWindow();
          if (this.mainWindow) {
            this.mainWindow.webContents.send('navigate', '/dashboard');
          }
        }
      },
      {
        label: 'Depenses',
        click: () => {
          this.showWindow();
          if (this.mainWindow) {
            this.mainWindow.webContents.send('navigate', '/expenses-management');
          }
        }
      },
      {
        label: 'Analytiques',
        click: () => {
          this.showWindow();
          if (this.mainWindow) {
            this.mainWindow.webContents.send('navigate', '/analytics-reports');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quitter',
        click: () => {
          // Set the quitting flag via the main module
          const main = require('./main');
          main.setIsQuitting(true);
          this.app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  /**
   * Update the main window reference
   */
  setMainWindow(window) {
    this.mainWindow = window;
    this.updateContextMenu();
  }

  /**
   * Destroy the tray
   */
  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = TrayManager;
