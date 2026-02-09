import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

interface EnvConfig {
  // Application
  NODE_ENV: string;
  PORT: number;
  APP_NAME: string;

  // Database
  DATABASE_PATH: string;
  DATABASE_BACKUP_PATH: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // Encryption
  ENCRYPTION_ENABLED: boolean;
  ENCRYPTION_KEY: string;

  // Security
  PASSWORD_PROTECTION_ENABLED: boolean;
  MAX_LOGIN_ATTEMPTS: number;
  LOCK_TIME: number;

  // Application Settings
  DEFAULT_CURRENCY: string;
  DEFAULT_THEME: string;
  DEFAULT_DATE_FORMAT: string;

  // Performance
  MAX_RECORDS_PER_PAGE: number;
  CACHE_ENABLED: boolean;
  CACHE_TTL: number;

  // Logging
  LOG_LEVEL: string;
  LOG_FILE: string;

  // Export Paths
  PDF_EXPORT_PATH: string;
  CSV_EXPORT_PATH: string;
}

const env: EnvConfig = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  APP_NAME: process.env.APP_NAME || 'ExpenseTracker Pro',

  // Database
  DATABASE_PATH: process.env.DATABASE_PATH || path.join(__dirname, '../../database/expensetracker.db'),
  DATABASE_BACKUP_PATH: process.env.DATABASE_BACKUP_PATH || path.join(__dirname, '../../backups'),

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Encryption
  ENCRYPTION_ENABLED: process.env.ENCRYPTION_ENABLED === 'true',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',

  // Security
  PASSWORD_PROTECTION_ENABLED: process.env.PASSWORD_PROTECTION_ENABLED === 'true',
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '3', 10),
  LOCK_TIME: parseInt(process.env.LOCK_TIME || '15', 10),

  // Application Settings
  DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY || 'USD',
  DEFAULT_THEME: process.env.DEFAULT_THEME || 'light',
  DEFAULT_DATE_FORMAT: process.env.DEFAULT_DATE_FORMAT || 'MM/DD/YYYY',

  // Performance
  MAX_RECORDS_PER_PAGE: parseInt(process.env.MAX_RECORDS_PER_PAGE || '100', 10),
  CACHE_ENABLED: process.env.CACHE_ENABLED === 'true',
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '300', 10),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || path.join(__dirname, '../../logs/app.log'),

  // Export Paths
  PDF_EXPORT_PATH: process.env.PDF_EXPORT_PATH || path.join(__dirname, '../../exports/pdf'),
  CSV_EXPORT_PATH: process.env.CSV_EXPORT_PATH || path.join(__dirname, '../../exports/csv'),
};

// Validation
if (env.NODE_ENV === 'production') {
  if (env.JWT_SECRET === 'default-secret-change-in-production') {
    console.warn('WARNING: Using default JWT secret in production!');
  }
  if (env.ENCRYPTION_ENABLED && !env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY must be set when ENCRYPTION_ENABLED is true');
  }
}

export default env;
