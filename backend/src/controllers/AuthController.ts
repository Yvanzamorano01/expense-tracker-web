import { Request, Response } from 'express';
import { User } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, generateToken, recordLoginAttempt } from '../middleware/auth';
import { logAuth } from '../utils/logger';

/**
 * Authentication Controller
 * Handles authentication and password protection
 * NFR-S2: Password protection (optional)
 */

class AuthController {
  /**
   * Setup password protection
   * First-time password setup
   * POST /api/auth/setup-password
   */
  public setupPassword = asyncHandler(async (req: Request, res: Response) => {
    const { password } = req.body;

    // Get default user
    const user = await User.findOne({ where: { userId: 1 } });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if password is already set
    if (user.isPasswordProtected) {
      throw new AppError('Password already set. Use change-password endpoint to update.', 400);
    }

    // Set password
    await user.setPassword(password);

    logAuth('Password Set', { userId: user.userId });

    res.json({
      success: true,
      message: 'Password protection enabled successfully',
    });
  });

  /**
   * Login with password
   * POST /api/auth/login
   */
  public login = asyncHandler(async (req: Request, res: Response) => {
    const { password } = req.body;
    const ip = req.ip || 'unknown';

    // Get default user
    const user = await User.findOne({ where: { userId: 1 } });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if password protection is enabled
    if (!user.isPasswordProtected) {
      throw new AppError('Password protection is not enabled', 400);
    }

    // Verify password
    const isValid = await user.authenticate(password);

    if (!isValid) {
      recordLoginAttempt(ip, false);
      logAuth('Login Failed', { userId: user.userId, ip });
      throw new AppError('Invalid password', 401);
    }

    // Successful login
    recordLoginAttempt(ip, true);

    // Generate JWT token
    const token = generateToken(user);

    logAuth('Login Successful', {
      userId: user.userId,
      username: user.username,
      ip,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          userId: user.userId,
          username: user.username,
          currency: user.currency,
          theme: user.theme,
          dateFormat: user.dateFormat,
        },
      },
    });
  });

  /**
   * Change password
   * PUT /api/auth/change-password
   */
  public changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    // Get user from authenticated request
    const user = req.user;

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if password protection is enabled
    if (!user.isPasswordProtected) {
      throw new AppError('Password protection is not enabled', 400);
    }

    // Verify current password
    const isValid = await user.authenticate(currentPassword);

    if (!isValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Set new password
    await user.setPassword(newPassword);

    logAuth('Password Changed', { userId: user.userId });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  });

  /**
   * Verify token
   * GET /api/auth/verify
   */
  public verifyToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user;

    if (!user) {
      throw new AppError('Invalid token', 401);
    }

    res.json({
      success: true,
      data: {
        userId: user.userId,
        username: user.username,
        currency: user.currency,
        theme: user.theme,
        dateFormat: user.dateFormat,
        isPasswordProtected: user.isPasswordProtected,
      },
    });
  });

  /**
   * Disable password protection
   * DELETE /api/auth/password-protection
   */
  public disablePasswordProtection = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { password } = req.body;
    const user = req.user;

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isPasswordProtected) {
      throw new AppError('Password protection is already disabled', 400);
    }

    // Verify password before disabling
    const isValid = await user.authenticate(password);

    if (!isValid) {
      throw new AppError('Invalid password', 401);
    }

    // Disable password protection
    await user.update({
      passwordHash: null,
      isPasswordProtected: false,
    });

    logAuth('Password Protection Disabled', { userId: user.userId });

    res.json({
      success: true,
      message: 'Password protection disabled successfully',
    });
  });

  /**
   * Check auth status
   * GET /api/auth/status
   */
  public getAuthStatus = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findOne({ where: { userId: 1 } });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        isPasswordProtected: user.isPasswordProtected,
        requiresAuthentication: user.isPasswordProtected,
      },
    });
  });
}

export default new AuthController();
