import { Router } from 'express';
import CategoryController from '../controllers/CategoryController';
import { validate, categorySchemas, idSchema } from '../middleware/validator';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * Category Routes
 * All routes use optional authentication (required if password protection is enabled)
 */

// Apply optional auth to all routes
router.use(optionalAuth);

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Private (if password protected)
 */
router.get(
  '/',
  CategoryController.getAllCategories
);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Private (if password protected)
 */
router.get(
  '/:id',
  validate(idSchema, 'params'),
  CategoryController.getCategoryById
);

/**
 * @route   GET /api/categories/:id/total
 * @desc    Get total spent by category
 * @access  Private (if password protected)
 */
router.get(
  '/:id/total',
  validate(idSchema, 'params'),
  CategoryController.getCategoryTotal
);

/**
 * @route   GET /api/categories/:id/stats
 * @desc    Get category statistics
 * @access  Private (if password protected)
 */
router.get(
  '/:id/stats',
  validate(idSchema, 'params'),
  CategoryController.getCategoryStats
);

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private (if password protected)
 */
router.post(
  '/',
  validate(categorySchemas.create),
  CategoryController.createCategory
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private (if password protected)
 */
router.put(
  '/:id',
  validate(idSchema, 'params'),
  validate(categorySchemas.update),
  CategoryController.updateCategory
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category (reassigns expenses to Uncategorized)
 * @access  Private (if password protected)
 */
router.delete(
  '/:id',
  validate(idSchema, 'params'),
  CategoryController.deleteCategory
);

export default router;
