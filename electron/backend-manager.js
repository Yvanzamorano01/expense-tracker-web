const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

class BackendManager {
  constructor(app) {
    this.app = app;
    this.backendProcess = null;
    this.isDev = !app.isPackaged;
    this.port = 5000;
    this.healthCheckUrl = `http://localhost:${this.port}/health`;
    this.maxStartupTime = 30000; // 30 seconds timeout
    this.healthCheckInterval = 500; // Check every 500ms
  }

  /**
   * Get the path to the backend entry point
   */
  getBackendPath() {
    if (this.isDev) {
      // Development: use the source backend with ts-node
      return {
        command: 'node',
        args: [path.join(__dirname, '..', 'backend', 'dist', 'app.js')],
        cwd: path.join(__dirname, '..', 'backend')
      };
    } else {
      // Production: use the bundled backend
      return {
        command: 'node',
        args: [path.join(process.resourcesPath, 'backend', 'dist', 'app.js')],
        cwd: path.join(process.resourcesPath, 'backend')
      };
    }
  }

  /**
   * Get environment variables for the backend
   */
  getBackendEnv() {
    const userDataPath = this.app.getPath('userData');
    const databaseDir = path.join(userDataPath, 'database');

    // Ensure database directory exists
    if (!fs.existsSync(databaseDir)) {
      fs.mkdirSync(databaseDir, { recursive: true });
    }

    return {
      ...process.env,
      NODE_ENV: this.isDev ? 'development' : 'production',
      ELECTRON: '1',
      PORT: String(this.port),
      USER_DATA_PATH: userDataPath,
      DATABASE_PATH: path.join(databaseDir, 'expensetracker.db')
    };
  }

  /**
   * Check if the backend is healthy
   */
  checkHealth() {
    return new Promise((resolve) => {
      const req = http.get(this.healthCheckUrl, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Wait for the backend to become healthy
   */
  async waitForHealthy() {
    const startTime = Date.now();

    while (Date.now() - startTime < this.maxStartupTime) {
      const isHealthy = await this.checkHealth();
      if (isHealthy) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, this.healthCheckInterval));
    }

    return false;
  }

  /**
   * Start the backend server
   */
  async start() {
    // First check if a backend is already running
    const alreadyRunning = await this.checkHealth();
    if (alreadyRunning) {
      console.log('Backend already running on port', this.port);
      return;
    }

    const { command, args, cwd } = this.getBackendPath();
    const env = this.getBackendEnv();

    console.log('Starting backend:', command, args.join(' '));
    console.log('Working directory:', cwd);
    console.log('Database path:', env.DATABASE_PATH);

    // Check if the backend entry point exists
    const entryPoint = args[0];
    if (!fs.existsSync(entryPoint)) {
      throw new Error(`Backend entry point not found: ${entryPoint}\nPlease run 'npm run build:backend' first.`);
    }

    return new Promise((resolve, reject) => {
      this.backendProcess = spawn(command, args, {
        cwd,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
        shell: false
      });

      // Handle stdout
      this.backendProcess.stdout.on('data', (data) => {
        console.log('[Backend]', data.toString().trim());
      });

      // Handle stderr
      this.backendProcess.stderr.on('data', (data) => {
        console.error('[Backend Error]', data.toString().trim());
      });

      // Handle process error
      this.backendProcess.on('error', (error) => {
        console.error('Failed to start backend:', error);
        reject(error);
      });

      // Handle process exit
      this.backendProcess.on('exit', (code, signal) => {
        console.log(`Backend process exited with code ${code}, signal ${signal}`);
        this.backendProcess = null;
      });

      // Wait for the backend to be healthy
      this.waitForHealthy()
        .then((isHealthy) => {
          if (isHealthy) {
            console.log('Backend is healthy and ready');
            resolve();
          } else {
            reject(new Error('Backend failed to start within timeout period'));
          }
        })
        .catch(reject);
    });
  }

  /**
   * Stop the backend server gracefully
   */
  async stop() {
    if (!this.backendProcess) {
      console.log('No backend process to stop');
      return;
    }

    return new Promise((resolve) => {
      const pid = this.backendProcess.pid;
      console.log('Stopping backend process:', pid);

      // Set up a timeout for force kill
      const forceKillTimeout = setTimeout(() => {
        if (this.backendProcess) {
          console.log('Force killing backend process');
          this.backendProcess.kill('SIGKILL');
        }
      }, 5000);

      // Handle process exit
      this.backendProcess.once('exit', () => {
        clearTimeout(forceKillTimeout);
        this.backendProcess = null;
        console.log('Backend process stopped');
        resolve();
      });

      // Send SIGTERM for graceful shutdown
      // On Windows, this will actually kill the process
      if (process.platform === 'win32') {
        this.backendProcess.kill();
      } else {
        this.backendProcess.kill('SIGTERM');
      }
    });
  }

  /**
   * Check if the backend is running
   */
  isRunning() {
    return this.backendProcess !== null && !this.backendProcess.killed;
  }

  /**
   * Get the backend PID
   */
  getPid() {
    return this.backendProcess ? this.backendProcess.pid : null;
  }
}

module.exports = BackendManager;
