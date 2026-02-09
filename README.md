# 💰 Expense Tracker Pro - Offline Expense Manager

A robust and modern desktop application for managing your personal finances without relying on an internet connection. Built with the latest web technologies (Electron, React, Node.js), it offers a smooth and secure user experience with a local database.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)

## 🚀 Key Features

- **100% Offline**: Your data remains on your machine (Encrypted SQLite database).
- **Intuitive Dashboard**: Visualize your expenses with interactive charts (Recharts, D3.js).
- **Complete Management**: Easily add, edit, and categorize your expenses.
- **Multi-currency Support**: Designed to handle various currencies, including XAF (CFA).
- **Detailed Reports**: Export your data to PDF or CSV for your accounting.
- **Dark/Light Mode**: Interface adapted to your visual preferences.
- **Performance**: Fast and responsive thanks to Vite and Electron.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Redux Toolkit
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite (with Sequelize ORM)
- **Desktop**: Electron
- **Tools**: ESLint, Prettier, Jest

## 📋 Prerequisites

Before starting, make sure you have installed:

- **Node.js** (version 18 or higher)
- **npm** (version 9 or higher)
- **Git**

## 🔧 Installation Guide

Follow these steps to install and set up the project on your local machine.

### 1. Clone the project

```bash
git clone https://github.com/your-username/expensetracker-pro.git
cd expensetracker-pro
```

### 2. Install dependencies

The project is divided into two parts (root/frontend and backend), you need to install dependencies for both.

**At the project root (Frontend & Electron):**
```bash
npm install
```

**In the backend folder:**
```bash
cd backend
npm install
cd ..
```

### 3. Database Setup

The application uses SQLite. You must initialize the database and run migrations.

```bash
cd backend
npm run migrate
cd ..
```

## 🌱 Seeds & Test Data

The project includes powerful scripts to generate realistic test data, which is ideal for development and demonstration.

### Basic Data (Default Categories)
To insert basic categories and configurations:

```bash
cd backend
npm run seed
cd ..
```

### 📊 Realistic Data Generation (Recommended) ✨

To populate the application with realistic expense data (Cameroon/XAF context) over several months (October, November, December 2025), use the dedicated script at the project root.

**Warning:** This script will delete all existing expenses before generating new ones.

```bash
# At the project root
node generate-all-test-data.js
```

This script will automatically:
1.  🗑️ Delete old expenses.
2.  🍂 Generate expenses for October 2025.
3.  🦃 Generate expenses for November 2025.
4.  🎄 Generate expenses for December 2025 (~120 expenses in total).

You can also run individual scripts if needed:
- `node generate-test-expenses.js` (Generates only for December)

## 🚀 Running the Application

### Development Mode
To launch the application with Hot Reloading for both frontend and backend:

```bash
npm run electron:dev
```
*This command launches the Vite server and the Electron window simultaneously.*

### Production Mode (Build)
To distribute the application (creates an executable), we use `electron-builder`.

```bash
npm run electron:build
```

This will generate the installer files in the `dist-electron` folder:
- **Windows**: An installer (`.exe`) and a portable version.
- **Mac**: A disk image (`.dmg`).
- **Linux**: An AppImage file.

The application is configured to be performant and native on each OS.

## 📂 Project Structure

```
expensetracker-pro/
├── backend/                 # Node.js API & Database
│   ├── src/                 # Backend TypeScript source code
│   ├── database.sqlite      # Database file (generated)
│   └── ...
├── src/                     # Frontend Source Code (React)
│   ├── components/          # Reusable Components
│   ├── pages/               # Application Pages
│   ├── store/               # Redux State Management
│   └── ...
├── electron/                # Electron Main Process
├── generate-*.js            # Data generation scripts
├── package.json             # Global dependencies and scripts
└── README.md                # This file
```

## 📝 Authors

- **Your Name** - *Lead Developer*

---
*Made with ❤️ for better financial management.*
