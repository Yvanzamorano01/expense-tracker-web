# Electron Resources - Icons

This directory contains icons for the Electron application.

## Required Icons

### Windows (icon.ico)
- Copy `favicon.ico` from the project root to this directory and rename it to `icon.ico`
- Or create a new icon with multiple sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256

### System Tray (tray.png)
- Create a 16x16 or 24x24 PNG icon for the system tray
- Should be simple and recognizable at small sizes

### macOS (icon.icns) - Optional
- Required only for macOS builds
- Use `iconutil` or online converters to create from PNG

### Linux (icons folder) - Optional
- Required only for Linux builds
- Create folder with PNG icons: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512

## Quick Setup

Run this command to copy the favicon as icon.ico:
```bash
copy favicon.ico electron\resources\icon.ico
```

For the tray icon, you can use any 16x16 PNG image.
