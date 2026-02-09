import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { validate, authSchemas } from '../middleware/validator';
import { authenticate, checkLoginAttempts } from '../middleware/auth';

const router = Router();

/**
 * Authentication Routes
 * Handles password protection and JWT authentication
 */

/**
 * @route   GET /api/auth/status
 * @desc    Check if password protection is enabled
 * @access  Public
 */
router.get('/status', AuthController.getAuthStatus);

/**
 * @route   POST /api/auth/setup-password
 * @desc    Setup password protection (first time)
 * @access  Public (only works if not already set)
 */
router.post(
  '/setup-password',
  validate(authSchemas.setupPassword),
  AuthController.setupPassword
);

/**
 * @route   POST /api/auth/login
 * @desc    Login with password
 * @access  Public
 */
router.post(
  '/login',
  checkLoginAttempts,
  validate(authSchemas.login),
  AuthController.login
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token
 * @access  Private
 */
router.get(
  '/verify',
  authenticate,
  AuthController.verifyToken
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  validate(authSchemas.changePassword),
  AuthController.changePassword
);

/**
 * @route   DELETE /api/auth/password-protection
 * @desc    Disable password protection
 * @access  Private
 */
router.delete(
  '/password-protection',
  authenticate,
  validate(authSchemas.login),
  AuthController.disablePasswordProtection
);

export default router;
