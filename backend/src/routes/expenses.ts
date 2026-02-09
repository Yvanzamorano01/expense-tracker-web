import { Router } from 'express';
import ExpenseController from '../controllers/ExpenseController';
import { validate, expenseSchemas, idSchema } from '../middleware/validator';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * Expense Routes
 * All routes use optional authentication (required if password protection is enabled)
 */

// Apply optional auth to all routes
router.use(optionalAuth);

/**
 * @route   GET /api/expenses/summary
 * @desc    Get expenses summary grouped by category
 * @access  Private (if password protected)
 */
router.get(
  '/summary',
  validate(expenseSchemas.query, 'query'),
  ExpenseController.getExpensesSummary
);

/**
 * @route   GET /api/expenses/search
 * @desc    Search expenses by keyword
 * @access  Private (if password protected)
 */
router.get(
  '/search',
  validate(expenseSchemas.query, 'query'),
  ExpenseController.searchExpenses
);

/**
 * @route   GET /api/expenses/date-range
 * @desc    Get expenses by date range
 * @access  Private (if password protected)
 */
router.get(
  '/date-range',
  validate(expenseSchemas.query, 'query'),
  ExpenseController.getExpensesByDateRange
);

/**
 * @route   GET /api/expenses
 * @desc    Get all expenses with optional filters
 * @access  Private (if password protected)
 */
router.get(
  '/',
  validate(expenseSchemas.query, 'query'),
  ExpenseController.getAllExpenses
);

/**
 * @route   GET /api/expenses/:id
 * @desc    Get expense by ID
 * @access  Private (if password protected)
 */
router.get(
  '/:id',
  validate(idSchema, 'params'),
  ExpenseController.getExpenseById
);

/**
 * @route   POST /api/expenses
 * @desc    Create new expense
 * @access  Private (if password protected)
 */
router.post(
  '/',
  validate(expenseSchemas.create),
  ExpenseController.createExpense
);

/**
 * @route   PUT /api/expenses/:id
 * @desc    Update expense
 * @access  Private (if password protected)
 */
router.put(
  '/:id',
  validate(idSchema, 'params'),
  validate(expenseSchemas.update),
  ExpenseController.updateExpense
);

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete expense
 * @access  Private (if password protected)
 */
router.delete(
  '/:id',
  validate(idSchema, 'params'),
  ExpenseController.deleteExpense
);

export default router;
