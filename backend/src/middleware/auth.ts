import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import env from '../config/env';
import { AppError } from './errorHandler';
import { logAuth } from '../utils/logger';

/**
 * JWT Payload Interface
 */
export interface JWTPayload {
  userId: number;
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * Extended Request Interface with user
 */
export interface AuthRequest extends Request {
  user?: User;
  userId?: number;
}

/**
 * Generate JWT Token
 * @param user - User instance
 * @returns JWT token
 */
export const generateToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.userId,
    username: user.username,
  };

  // @ts-ignore - expiresIn type incompatibility with jsonwebtoken
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Verify JWT Token
 * @param token - JWT token string
 * @returns Decoded payload
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expired', 401);
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401);
    }
    throw error;
  }
};

/**
 * Authentication Middleware
 * NFR-S2: Password protection (optional)
 * Validates JWT token if password protection is enabled
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get default user (id=1)
    const user = await User.findOne({ where: { userId: 1 } });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // If password protection is not enabled, allow access
    if (!user.isPasswordProtected) {
      req.user = user;
      req.userId = user.userId;
      return next();
    }

    // Password protection is enabled, require JWT
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authentication token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyToken(token);

    // Get user from token
    const authenticatedUser = await User.findByPk(payload.userId);

    if (!authenticatedUser) {
      throw new AppError('User not found', 404);
    }

    // Attach user to request
    req.user = authenticatedUser;
    req.userId = authenticatedUser.userId;

    logAuth('Authenticated', {
      userId: authenticatedUser.userId,
      username: authenticatedUser.username,
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Authentication Middleware
 * Allows access without token, but validates if provided
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, use default user
      const user = await User.findOne({ where: { userId: 1 } });
      if (user) {
        req.user = user;
        req.userId = user.userId;
      }
      return next();
    }

    // Token provided, verify it
    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    const user = await User.findByPk(payload.userId);
    if (user) {
      req.user = user;
      req.userId = user.userId;
    }

    next();
  } catch (error) {
    // If token is invalid, continue without user
    next();
  }
};

/**
 * Rate Limiting for Login Attempts
 * NFR-S2: Lock access after 3 failed attempts
 */
interface LoginAttempt {
  count: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

const loginAttempts = new Map<string, LoginAttempt>();

export const checkLoginAttempts = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ip = req.ip || 'unknown';
  const attempt = loginAttempts.get(ip);

  if (attempt && attempt.lockedUntil) {
    const now = new Date();
    if (now < attempt.lockedUntil) {
      const remainingMinutes = Math.ceil(
        (attempt.lockedUntil.getTime() - now.getTime()) / 60000
      );
      throw new AppError(
        `Too many failed login attempts. Try again in ${remainingMinutes} minute(s).`,
        429
      );
    } else {
      // Lock expired, reset attempts
      loginAttempts.delete(ip);
    }
  }

  next();
};

export const recordLoginAttempt = (ip: string, success: boolean) => {
  const attempt = loginAttempts.get(ip) || {
    count: 0,
    lastAttempt: new Date(),
  };

  if (success) {
    // Reset on successful login
    loginAttempts.delete(ip);
    return;
  }

  // Increment failed attempts
  attempt.count++;
  attempt.lastAttempt = new Date();

  if (attempt.count >= env.MAX_LOGIN_ATTEMPTS) {
    // Lock for configured time
    attempt.lockedUntil = new Date(
      Date.now() + env.LOCK_TIME * 60 * 1000
    );
    logAuth('Account Locked', {
      ip,
      attempts: attempt.count,
      lockDuration: `${env.LOCK_TIME} minutes`,
    });
  }

  loginAttempts.set(ip, attempt);
};

export default {
  generateToken,
  verifyToken,
  authenticate,
  optionalAuth,
  checkLoginAttempts,
  recordLoginAttempt,
};
