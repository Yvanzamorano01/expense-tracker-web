import { Router, Response } from 'express';
import { Expense, Category, Budget } from '../models';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, optionalAuth } from '../middleware/auth';
import { Op } from 'sequelize';
import sequelize from '../config/database';

const router = Router();

/**
 * Analytics Routes
 * FR-5.1 to FR-5.4: Dashboard, Charts, Analytics
 */

// Apply optional auth to all routes
router.use(optionalAuth);

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard summary
 * @access  Private (if password protected)
 */
router.get(
  '/dashboard',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get current month expenses
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const expenses = await Expense.findAll({
      where: {
        userId,
        date: { [Op.between]: [startDate, endDate] },
      },
      include: [{ model: Category, as: 'category' }],
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

    // Get budgets for current month
    const budgets = await Budget.getAllBudgets(currentMonth, currentYear, userId);
    const budgetsWithStatus = await Promise.all(
      budgets.map(async (b) => await b.getStatus())
    );

    // Recent transactions
    const recentExpenses = await Expense.findAll({
      where: { userId },
      include: [{ model: Category, as: 'category' }],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    // Top categories
    const categoryData: any = {};
    expenses.forEach(expense => {
      const catName = expense.category?.name || 'Uncategorized';
      if (!categoryData[catName]) {
        categoryData[catName] = { name: catName, total: 0, count: 0, color: expense.category?.color };
      }
      categoryData[catName].total += parseFloat(expense.amount.toString());
      categoryData[catName].count++;
    });

    const topCategories = Object.values(categoryData)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        summary: {
          totalExpenses,
          expenseCount: expenses.length,
          budgetStatus: budgetsWithStatus,
          month: currentMonth,
          year: currentYear,
        },
        recentExpenses,
        topCategories,
      },
    });
  })
);

/**
 * @route   GET /api/analytics/pie-chart
 * @desc    Get category distribution for pie chart
 * @access  Private (if password protected)
 */
router.get(
  '/pie-chart',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;
    const { startDate, endDate } = req.query;

    const where: any = { userId };
    if (startDate && endDate) {
      where.date = { [Op.between]: [new Date(startDate as string), new Date(endDate as string)] };
    }

    const expenses = await Expense.findAll({
      where,
      include: [{ model: Category, as: 'category' }],
    });

    const categoryData: any = {};
    expenses.forEach(expense => {
      const catName = expense.category?.name || 'Uncategorized';
      if (!categoryData[catName]) {
        categoryData[catName] = {
          name: catName,
          value: 0,
          color: expense.category?.color || '#6B7280',
        };
      }
      categoryData[catName].value += parseFloat(expense.amount.toString());
    });

    res.json({
      success: true,
      data: Object.values(categoryData),
    });
  })
);

/**
 * @route   GET /api/analytics/bar-chart
 * @desc    Get monthly comparison for bar chart
 * @access  Private (if password protected)
 */
router.get(
  '/bar-chart',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;
    const { months = 12 } = req.query;

    const currentDate = new Date();
    const monthlyData: any[] = [];

    for (let i = parseInt(months as string) - 1; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const expenses = await Expense.findAll({
        where: {
          userId,
          date: { [Op.between]: [startDate, endDate] },
        },
      });

      const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

      monthlyData.push({
        month: targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        value: total,
        count: expenses.length,
      });
    }

    res.json({
      success: true,
      data: monthlyData,
    });
  })
);

/**
 * @route   GET /api/analytics/line-chart
 * @desc    Get trend analysis for line chart
 * @access  Private (if password protected)
 */
router.get(
  '/line-chart',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate as string) : new Date();

    const expenses = await Expense.findAll({
      where: {
        userId,
        date: { [Op.between]: [start, end] },
      },
      order: [['date', 'ASC']],
    });

    // Group by day or week
    const trendData: any = {};
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const key = groupBy === 'week'
        ? `Week ${Math.ceil(date.getDate() / 7)}, ${date.toLocaleDateString('en-US', { month: 'short' })}`
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!trendData[key]) {
        trendData[key] = 0;
      }
      trendData[key] += parseFloat(expense.amount.toString());
    });

    const data = Object.entries(trendData).map(([date, value]) => ({ date, value }));

    res.json({
      success: true,
      data,
    });
  })
);

export default router;
