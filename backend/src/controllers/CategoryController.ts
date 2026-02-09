import { Response } from 'express';
import { Category, Expense } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { getUncategorizedCategoryId } from '../utils/seedDefaultCategories';
import logger from '../utils/logger';

/**
 * Category Controller
 * Handles all category-related operations
 * FR-2.1 to FR-2.4: Category Management
 */

class CategoryController {
  /**
   * Get all categories
   * FR-2.1: Default categories should be available
   * GET /api/categories
   */
  public getAllCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
    const categories = await Category.findAll({
      order: [['isDefault', 'DESC'], ['name', 'ASC']],
    });

    res.json({
      success: true,
      data: {
        categories,
        total: categories.length,
      },
    });
  });

  /**
   * Get category by ID
   * GET /api/categories/:id
   */
  public getCategoryById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const category = await Category.findByPk(parseInt(id));

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    res.json({
      success: true,
      data: category,
    });
  });

  /**
   * Create new category
   * FR-2.2: Add custom category
   * POST /api/categories
   */
  public createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, color, icon } = req.body;

    // Check if category with same name exists
    const existing = await Category.findOne({ where: { name } });
    if (existing) {
      throw new AppError('Category with this name already exists', 409);
    }

    const category = await Category.create({
      name,
      color,
      icon,
      isDefault: false,
    });

    logger.info('Category created', {
      categoryId: category.categoryId,
      name: category.name,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  });

  /**
   * Update category
   * FR-2.3: Edit category
   * PUT /api/categories/:id
   */
  public updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const category = await Category.findByPk(parseInt(id));

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Prevent updating default categories' isDefault status
    if (category.isDefault && updates.hasOwnProperty('isDefault')) {
      delete updates.isDefault;
    }

    // Check name uniqueness if name is being updated
    if (updates.name && updates.name !== category.name) {
      const existing = await Category.findOne({ where: { name: updates.name } });
      if (existing) {
        throw new AppError('Category with this name already exists', 409);
      }
    }

    await category.update(updates);

    logger.info('Category updated', {
      categoryId: category.categoryId,
      updates,
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  });

  /**
   * Delete category
   * FR-2.4: Delete category (reassign expenses to Uncategorized)
   * DELETE /api/categories/:id
   */
  public deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const category = await Category.findByPk(parseInt(id));

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Prevent deleting default Uncategorized category
    if (category.name === 'Uncategorized') {
      throw new AppError('Cannot delete Uncategorized category', 400);
    }

    // Get Uncategorized category ID
    const uncategorizedId = await getUncategorizedCategoryId();

    if (!uncategorizedId) {
      throw new AppError('Uncategorized category not found', 500);
    }

    // Reassign all expenses to Uncategorized
    await Expense.update(
      { categoryId: uncategorizedId },
      { where: { categoryId: category.categoryId } }
    );

    // Delete category
    await category.destroy();

    logger.info('Category deleted', {
      categoryId: category.categoryId,
      name: category.name,
      reassignedToId: uncategorizedId,
    });

    res.json({
      success: true,
      message: 'Category deleted successfully. Expenses reassigned to Uncategorized.',
    });
  });

  /**
   * Get total spent by category
   * GET /api/categories/:id/total
   */
  public getCategoryTotal = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    // const userId = req.userId || 1; // Reserved for future use
    const { month, year } = req.query;

    const category = await Category.findByPk(parseInt(id));

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Default to current month/year if not provided
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();

    const total = await category.getTotalSpentByCategory(targetMonth, targetYear);

    res.json({
      success: true,
      data: {
        categoryId: category.categoryId,
        categoryName: category.name,
        month: targetMonth,
        year: targetYear,
        totalSpent: total,
      },
    });
  });

  /**
   * Get category statistics
   * GET /api/categories/:id/stats
   */
  public getCategoryStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId || 1;

    const category = await Category.findByPk(parseInt(id));

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Get total expenses count
    const expenseCount = await Expense.count({
      where: { categoryId: category.categoryId, userId },
    });

    // Get total amount
    const expenses = await Expense.findAll({
      where: { categoryId: category.categoryId, userId },
    });

    const totalAmount = expenses.reduce(
      (sum, expense) => sum + parseFloat(expense.amount.toString()),
      0
    );

    // Get current month total
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const currentMonthTotal = await category.getTotalSpentByCategory(currentMonth, currentYear);

    res.json({
      success: true,
      data: {
        category: {
          id: category.categoryId,
          name: category.name,
          color: category.color,
          icon: category.icon,
        },
        stats: {
          totalExpenses: expenseCount,
          totalAmount,
          currentMonthAmount: currentMonthTotal,
          currentMonth,
          currentYear,
        },
      },
    });
  });
}

export default new CategoryController();
