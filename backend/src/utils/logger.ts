import winston from 'winston';
import path from 'path';
import fs from 'fs';
import env from '../config/env';

// Ensure logs directory exists
const logsDir = path.dirname(env.LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Winston Logger Configuration
 * NFR-R3: Error logging for debugging
 */

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: env.APP_NAME },
  transports: [
    // Write all logs to file
    new winston.transports.File({
      filename: env.LOG_FILE,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write errors to separate file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Console logging in development
if (env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

/**
 * Log HTTP request
 */
export const logRequest = (method: string, url: string, statusCode: number, duration: number) => {
  logger.info('HTTP Request', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
  });
};

/**
 * Log error with context
 */
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

/**
 * Log database operation
 */
export const logDatabase = (operation: string, details?: Record<string, any>) => {
  logger.debug('Database Operation', {
    operation,
    ...details,
  });
};

/**
 * Log authentication event
 */
export const logAuth = (event: string, details?: Record<string, any>) => {
  logger.info('Authentication Event', {
    event,
    ...details,
  });
};

export default logger;
