import { Response } from 'express';
import { Expense, Category } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import logger from '../utils/logger';

/**
 * Expense Controller
 * Handles all expense-related operations
 * FR-1.1 to FR-1.4: Add, Edit, Delete, View Expense
 */

class ExpenseController {
  /**
   * Get all expenses
   * FR-1.4: View expense list
   * GET /api/expenses
   */
  public getAllExpenses = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;
    const { limit, offset, categoryId, startDate, endDate } = req.query;

    const where: any = { userId };

    // Filter by category if provided
    if (categoryId) {
      where.categoryId = parseInt(categoryId as string);
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date[Op.gte] = new Date(startDate as string);
      }
      if (endDate) {
        where.date[Op.lte] = new Date(endDate as string);
      }
    }

    const expenses = await Expense.findAll({
      where,
      include: [{ model: Category, as: 'category' }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    const total = await Expense.count({ where });

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          total,
          limit: limit ? parseInt(limit as string) : total,
          offset: offset ? parseInt(offset as string) : 0,
        },
      },
    });
  });

  /**
   * Get expense by ID
   * FR-1.4: View expense details
   * GET /api/expenses/:id
   */
  public getExpenseById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId || 1;

    const expense = await Expense.findOne({
      where: { expenseId: parseInt(id), userId },
      include: [{ model: Category, as: 'category' }],
    });

    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    res.json({
      success: true,
      data: expense,
    });
  });

  /**
   * Create new expense
   * FR-1.1: Add expense
   * POST /api/expenses
   */
  public createExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;

    console.log('🔍 DEBUG ExpenseController.createExpense - req.body:', JSON.stringify(req.body, null, 2));

    const { amount, date, categoryId, description, paymentMethod, originalCurrency, location, isRecurring, recurringFrequency } = req.body;

    console.log('🔍 DEBUG ExpenseController.createExpense - Extracted location:', location);
    console.log('🔍 DEBUG ExpenseController.createExpense - originalCurrency:', originalCurrency);

    // Verify category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Create expense (amount is stored in original currency, not converted to USD)
    const expense = await Expense.create({
      amount: parseFloat(amount),
      date: new Date(date),
      categoryId: parseInt(categoryId),
      description: description || '',
      location: location || '',
      paymentMethod,
      originalCurrency: originalCurrency || 'USD',  // Store original currency
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || 'monthly',
      userId,
    });

    // Fetch created expense with category
    const createdExpense = await Expense.findByPk(expense.expenseId, {
      include: [{ model: Category, as: 'category' }],
    });

    logger.info('Expense created', {
      expenseId: expense.expenseId,
      amount: expense.amount,
      categoryId: expense.categoryId,
    });

    // Check budget status (will be done via budget controller/service)
    // This is where FR-3.3 budget alerts would be triggered

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: createdExpense,
    });
  });

  /**
   * Update expense
   * FR-1.2: Edit expense
   * PUT /api/expenses/:id
   */
  public updateExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId || 1;
    const updates = req.body;

    // Find expense
    const expense = await Expense.findOne({
      where: { expenseId: parseInt(id), userId },
    });

    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    // Verify category if being updated
    if (updates.categoryId) {
      const category = await Category.findByPk(updates.categoryId);
      if (!category) {
        throw new AppError('Category not found', 404);
      }
    }

    // Update expense
    await expense.update(updates);

    // Fetch updated expense with category
    const updatedExpense = await Expense.findByPk(expense.expenseId, {
      include: [{ model: Category, as: 'category' }],
    });

    logger.info('Expense updated', {
      expenseId: expense.expenseId,
      updates,
    });

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense,
    });
  });

  /**
   * Delete expense
   * FR-1.3: Delete expense
   * DELETE /api/expenses/:id
   */
  public deleteExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId || 1;

    const expense = await Expense.findOne({
      where: { expenseId: parseInt(id), userId },
    });

    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    await expense.destroy();

    logger.info('Expense deleted', {
      expenseId: expense.expenseId,
      amount: expense.amount,
    });

    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  });

  /**
   * Search expenses
   * FR-4.1: Search expenses by keyword
   * GET /api/expenses/search
   */
  public searchExpenses = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;
    const { searchTerm, limit, offset } = req.query;

    if (!searchTerm) {
      throw new AppError('Search term is required', 400);
    }

    const where: any = {
      userId,
      [Op.or]: [
        { description: { [Op.like]: `%${searchTerm}%` } },
        { paymentMethod: { [Op.like]: `%${searchTerm}%` } },
      ],
    };

    const expenses = await Expense.findAll({
      where,
      include: [{ model: Category, as: 'category' }],
      order: [['date', 'DESC']],
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    const total = await Expense.count({ where });

    res.json({
      success: true,
      data: {
        expenses,
        searchTerm,
        pagination: {
          total,
          limit: limit ? parseInt(limit as string) : total,
          offset: offset ? parseInt(offset as string) : 0,
        },
      },
    });
  });

  /**
   * Get expenses by date range
   * FR-4.2: Filter by date range
   * GET /api/expenses/date-range
   */
  public getExpensesByDateRange = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new AppError('Start date and end date are required', 400);
    }

    const expenses = await Expense.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
        },
      },
      include: [{ model: Category, as: 'category' }],
      order: [['date', 'DESC']],
    });

    const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);

    res.json({
      success: true,
      data: {
        expenses,
        summary: {
          count: expenses.length,
          totalAmount,
          startDate,
          endDate,
        },
      },
    });
  });

  /**
   * Get expenses summary (grouped by category)
   * Used for analytics
   * GET /api/expenses/summary
   */
  public getExpensesSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;
    const { startDate, endDate, categoryId } = req.query;

    const where: any = { userId };

    if (startDate && endDate) {
      where.date = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
      };
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId as string);
    }

    const expenses = await Expense.findAll({
      where,
      include: [{ model: Category, as: 'category' }],
    });

    // Group by category
    const summary: Record<string, any> = {};

    expenses.forEach(expense => {
      const categoryName = expense.category?.name || 'Uncategorized';
      if (!summary[categoryName]) {
        summary[categoryName] = {
          categoryId: expense.categoryId,
          categoryName,
          color: expense.category?.color,
          count: 0,
          total: 0,
        };
      }
      summary[categoryName].count++;
      summary[categoryName].total += parseFloat(expense.amount.toString());
    });

    const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);

    res.json({
      success: true,
      data: {
        summary: Object.values(summary),
        totalAmount,
        totalCount: expenses.length,
      },
    });
  });
}

export default new ExpenseController();
