import { Response } from 'express';
import { Budget, Category } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

/**
 * Budget Controller
 * Handles all budget-related operations
 * FR-3.1 to FR-3.3: Budget Management & Alerts
 */

class BudgetController {
  /**
   * Get all budgets for a specific month/year
   * FR-3.1-3.2: View budget status
   * GET /api/budgets
   */
  public getAllBudgets = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;
    const currentDate = new Date();
    const { month, year } = req.query;

    const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();

    const budgets = await Budget.getAllBudgets(targetMonth, targetYear, userId);

    // Get status for each budget
    const budgetsWithStatus = await Promise.all(
      budgets.map(async (budget) => {
        const status = await budget.getStatus();
        return {
          ...budget.toJSON(),
          status,
        };
      })
    );

    res.json({
      success: true,
      data: {
        budgets: budgetsWithStatus,
        month: targetMonth,
        year: targetYear,
      },
    });
  });

  /**
   * Get budget by ID
   * GET /api/budgets/:id
   */
  public getBudgetById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId || 1;

    const budget = await Budget.findOne({
      where: { budgetId: parseInt(id), userId },
      include: [{ model: Category, as: 'category', required: false }],
    });

    if (!budget) {
      throw new AppError('Budget not found', 404);
    }

    const status = await budget.getStatus();

    res.json({
      success: true,
      data: {
        ...budget.toJSON(),
        status,
      },
    });
  });

  /**
   * Create new budget
   * FR-3.1: Set monthly budget
   * FR-3.2: Set category budgets
   * POST /api/budgets
   */
  public createBudget = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;
    const { amount, categoryId, month, year, originalCurrency } = req.body;

    // Verify category exists if provided
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        throw new AppError('Category not found', 404);
      }
    }

    // Check if budget already exists for this category/month/year
    const existing = await Budget.getBudgetByCategory(
      categoryId || null,
      month,
      year,
      userId
    );

    if (existing) {
      throw new AppError(
        `Budget already exists for this ${categoryId ? 'category' : 'month'}. Use PUT to update.`,
        409
      );
    }

    // Create budget
    const budget = await Budget.create({
      amount: parseFloat(amount),
      categoryId: categoryId || null,
      month,
      year,
      userId,
      originalCurrency: originalCurrency || 'USD',
    });

    // Fetch created budget with category
    const createdBudget = await Budget.findByPk(budget.budgetId, {
      include: [{ model: Category, as: 'category', required: false }],
    });

    const status = createdBudget ? await createdBudget.getStatus() : null;

    logger.info('Budget created', {
      budgetId: budget.budgetId,
      amount: budget.amount,
      categoryId: budget.categoryId,
      month: budget.month,
      year: budget.year,
    });

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: {
        ...createdBudget?.toJSON(),
        status,
      },
    });
  });

  /**
   * Update budget
   * PUT /api/budgets/:id
   */
  public updateBudget = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId || 1;
    const updates = req.body;

    const budget = await Budget.findOne({
      where: { budgetId: parseInt(id), userId },
    });

    if (!budget) {
      throw new AppError('Budget not found', 404);
    }

    await budget.update(updates);

    // Fetch updated budget with category
    const updatedBudget = await Budget.findByPk(budget.budgetId, {
      include: [{ model: Category, as: 'category', required: false }],
    });

    const status = updatedBudget ? await updatedBudget.getStatus() : null;

    logger.info('Budget updated', {
      budgetId: budget.budgetId,
      updates,
    });

    res.json({
      success: true,
      message: 'Budget updated successfully',
      data: {
        ...updatedBudget?.toJSON(),
        status,
      },
    });
  });

  /**
   * Delete budget
   * DELETE /api/budgets/:id
   */
  public deleteBudget = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId || 1;

    const budget = await Budget.findOne({
      where: { budgetId: parseInt(id), userId },
    });

    if (!budget) {
      throw new AppError('Budget not found', 404);
    }

    await budget.destroy();

    logger.info('Budget deleted', {
      budgetId: budget.budgetId,
      categoryId: budget.categoryId,
    });

    res.json({
      success: true,
      message: 'Budget deleted successfully',
    });
  });

  /**
   * Get budget status with alerts
   * FR-3.3: Budget alerts (>80% warning, >100% alert)
   * GET /api/budgets/status
   */
  public getBudgetStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;
    const currentDate = new Date();
    const { month, year } = req.query;

    const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();

    const budgets = await Budget.getAllBudgets(targetMonth, targetYear, userId);

    // Get status for each budget
    const budgetsWithStatus = await Promise.all(
      budgets.map(async (budget) => {
        const status = await budget.getStatus();
        return {
          budgetId: budget.budgetId,
          categoryId: budget.categoryId,
          categoryName: budget.category?.name || 'Total Budget',
          color: budget.category?.color,
          amount: budget.amount,
          ...status,
        };
      })
    );

    // Separate by alert level
    const alerts = {
      normal: budgetsWithStatus.filter((b) => b.alertLevel === 'normal'),
      warning: budgetsWithStatus.filter((b) => b.alertLevel === 'warning'),
      exceeded: budgetsWithStatus.filter((b) => b.alertLevel === 'exceeded'),
    };

    res.json({
      success: true,
      data: {
        budgets: budgetsWithStatus,
        alerts,
        summary: {
          total: budgetsWithStatus.length,
          normal: alerts.normal.length,
          warning: alerts.warning.length,
          exceeded: alerts.exceeded.length,
        },
        month: targetMonth,
        year: targetYear,
      },
    });
  });

  /**
   * Get budget alerts only
   * FR-3.3: Budget warning/alert notifications
   * GET /api/budgets/alerts
   */
  public getBudgetAlerts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;
    const currentDate = new Date();
    const { month, year } = req.query;

    const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();

    const budgets = await Budget.getAllBudgets(targetMonth, targetYear, userId);

    // Filter budgets with warnings or alerts
    const alerts = await Promise.all(
      budgets.map(async (budget) => {
        const status = await budget.getStatus();
        if (status.alertLevel !== 'normal') {
          return {
            budgetId: budget.budgetId,
            categoryId: budget.categoryId,
            categoryName: budget.category?.name || 'Total Budget',
            color: budget.category?.color,
            ...status,
            message: status.alertLevel === 'exceeded'
              ? `Budget exceeded! You've spent ${status.percentage.toFixed(1)}% of your budget.`
              : `Budget warning! You've used ${status.percentage.toFixed(1)}% of your budget.`,
          };
        }
        return null;
      })
    );

    const activeAlerts = alerts.filter((alert) => alert !== null);

    res.json({
      success: true,
      data: {
        alerts: activeAlerts,
        count: activeAlerts.length,
        month: targetMonth,
        year: targetYear,
      },
    });
  });

  /**
   * Get current month budget status (convenience endpoint)
   * GET /api/budgets/current
   */
  public getCurrentBudgets = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const budgets = await Budget.getAllBudgets(currentMonth, currentYear, userId);

    const budgetsWithStatus = await Promise.all(
      budgets.map(async (budget) => {
        const status = await budget.getStatus();
        return {
          ...budget.toJSON(),
          status,
        };
      })
    );

    res.json({
      success: true,
      data: {
        budgets: budgetsWithStatus,
        month: currentMonth,
        year: currentYear,
      },
    });
  });
}

export default new BudgetController();
