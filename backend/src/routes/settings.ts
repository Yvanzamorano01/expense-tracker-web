import { Router, Response } from 'express';
import { User } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, optionalAuth } from '../middleware/auth';
import Joi from 'joi';
import { validate } from '../middleware/validator';

const router = Router();

/**
 * Settings Routes
 * Handles user settings and preferences
 */

// Apply optional auth to all routes
router.use(optionalAuth);

// Settings validation schema
const settingsSchema = Joi.object({
  username: Joi.string().min(1).max(50).optional(),
  currency: Joi.string().length(3).optional(),
  theme: Joi.string().valid('light', 'dark', 'auto').optional(),
  dateFormat: Joi.string().optional(),
}).min(1);

/**
 * @route   GET /api/settings
 * @desc    Get user settings
 * @access  Private (if password protected)
 */
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;

    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user.getSettings(),
    });
  })
);

/**
 * @route   PUT /api/settings
 * @desc    Update user settings
 * @access  Private (if password protected)
 */
router.put(
  '/',
  validate(settingsSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;
    const updates = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.updateSettings(updates);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: user.getSettings(),
    });
  })
);

export default router;
