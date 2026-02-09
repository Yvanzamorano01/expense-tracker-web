import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

// Configuration
import env from './config/env';
import sequelize, { testConnection } from './config/database';
import { initializeModels, User } from './models';
import { seedDefaultCategories } from './utils/seedDefaultCategories';
import logger from './utils/logger';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import expenseRoutes from './routes/expenses';
import categoryRoutes from './routes/categories';
import budgetRoutes from './routes/budgets';
import authRoutes from './routes/auth';
import analyticsRoutes from './routes/analytics';
import reportRoutes from './routes/reports';
import backupRoutes from './routes/backup';
import settingsRoutes from './routes/settings';

/**
 * Express Application Setup
 * Main entry point for the Expense Tracker Pro Backend API
 */

const app: Application = express();

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Electron, mobile apps, curl)
    if (!origin) return callback(null, true);
    // Allow localhost origins (dev and Electron)
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    // Allow file:// protocol (Electron production)
    if (origin.startsWith('file://')) {
      return callback(null, true);
    }
    // Allow in development
    if (env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: fs.createWriteStream(path.join(__dirname, '../logs/access.log'), { flags: 'a' }),
  }));
}

// Request timing middleware
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 2000) {
      logger.warn(`Slow request: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  next();
});

// ============================================
// API ROUTES
// ============================================

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'ExpenseTracker Pro API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/settings', settingsRoutes);

// API documentation endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'ExpenseTracker Pro API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      expenses: '/api/expenses',
      categories: '/api/categories',
      budgets: '/api/budgets',
      analytics: '/api/analytics',
      reports: '/api/reports',
      backup: '/api/backup',
      settings: '/api/settings',
    },
    documentation: 'See README.md for full API documentation',
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// DATABASE INITIALIZATION
// ============================================

/**
 * Initialize database and start server
 */
export const initializeApp = async (): Promise<void> => {
  try {
    console.log('🚀 Starting ExpenseTracker Pro Backend...\n');

    // Test database connection
    await testConnection();

    // Initialize models
    await initializeModels(false); // Set to true to force sync (drops tables!)

    // Ensure default user exists
    const userCount = await User.count();
    if (userCount === 0) {
      await User.create({
        username: 'default',
        currency: env.DEFAULT_CURRENCY,
        theme: env.DEFAULT_THEME,
        dateFormat: env.DEFAULT_DATE_FORMAT,
        isPasswordProtected: false,
      });
      console.log('✓ Created default user');
    }

    // Seed default categories
    await seedDefaultCategories();

    // Ensure required directories exist
    const directories = [
      path.dirname(env.DATABASE_PATH),
      env.DATABASE_BACKUP_PATH,
      env.PDF_EXPORT_PATH,
      env.CSV_EXPORT_PATH,
      path.dirname(env.LOG_FILE),
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    console.log('\n✓ Application initialized successfully\n');
  } catch (error) {
    console.error('✗ Failed to initialize application:', error);
    throw error;
  }
};

/**
 * Start Express server
 */
export const startServer = async (): Promise<void> => {
  try {
    await initializeApp();

    app.listen(env.PORT, () => {
      console.log(`┌─────────────────────────────────────────┐`);
      console.log(`│  🎯 ${env.APP_NAME.padEnd(35)} │`);
      console.log(`├─────────────────────────────────────────┤`);
      console.log(`│  Environment: ${env.NODE_ENV.padEnd(26)} │`);
      console.log(`│  Port:        ${env.PORT.toString().padEnd(26)} │`);
      console.log(`│  URL:         ${('http://localhost:' + env.PORT).padEnd(26)} │`);
      console.log(`│  Database:    ${path.basename(env.DATABASE_PATH).padEnd(26)} │`);
      console.log(`└─────────────────────────────────────────┘\n`);

      logger.info('Server started', {
        port: env.PORT,
        environment: env.NODE_ENV,
      });
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;
