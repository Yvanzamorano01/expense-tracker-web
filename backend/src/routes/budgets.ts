import { Router } from 'express';
import BudgetController from '../controllers/BudgetController';
import { validate, budgetSchemas, idSchema } from '../middleware/validator';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * Budget Routes
 * All routes use optional authentication (required if password protection is enabled)
 */

// Apply optional auth to all routes
router.use(optionalAuth);

/**
 * @route   GET /api/budgets/current
 * @desc    Get current month budgets
 * @access  Private (if password protected)
 */
router.get(
  '/current',
  BudgetController.getCurrentBudgets
);

/**
 * @route   GET /api/budgets/status
 * @desc    Get budget status with alert levels
 * @access  Private (if password protected)
 */
router.get(
  '/status',
  validate(budgetSchemas.query, 'query'),
  BudgetController.getBudgetStatus
);

/**
 * @route   GET /api/budgets/alerts
 * @desc    Get active budget alerts (>80%)
 * @access  Private (if password protected)
 */
router.get(
  '/alerts',
  validate(budgetSchemas.query, 'query'),
  BudgetController.getBudgetAlerts
);

/**
 * @route   GET /api/budgets
 * @desc    Get all budgets for specified month/year
 * @access  Private (if password protected)
 */
router.get(
  '/',
  validate(budgetSchemas.query, 'query'),
  BudgetController.getAllBudgets
);

/**
 * @route   GET /api/budgets/:id
 * @desc    Get budget by ID
 * @access  Private (if password protected)
 */
router.get(
  '/:id',
  validate(idSchema, 'params'),
  BudgetController.getBudgetById
);

/**
 * @route   POST /api/budgets
 * @desc    Create new budget
 * @access  Private (if password protected)
 */
router.post(
  '/',
  validate(budgetSchemas.create),
  BudgetController.createBudget
);

/**
 * @route   PUT /api/budgets/:id
 * @desc    Update budget
 * @access  Private (if password protected)
 */
router.put(
  '/:id',
  validate(idSchema, 'params'),
  validate(budgetSchemas.update),
  BudgetController.updateBudget
);

/**
 * @route   DELETE /api/budgets/:id
 * @desc    Delete budget
 * @access  Private (if password protected)
 */
router.delete(
  '/:id',
  validate(idSchema, 'params'),
  BudgetController.deleteBudget
);

export default router;
