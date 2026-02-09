import { Router, Response } from 'express';
import { Expense, Category } from '../models';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, optionalAuth } from '../middleware/auth';
import { Op } from 'sequelize';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import fs from 'fs';
import env from '../config/env';

const router = Router();

/**
 * Report Routes
 * FR-6.1 to FR-6.3: Generate Reports, Export PDF/CSV
 */

// Apply optional auth to all routes
router.use(optionalAuth);

/**
 * @route   POST /api/reports/generate
 * @desc    Generate expense report
 * @access  Private (if password protected)
 */
router.post(
  '/generate',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId || 1;
    const { startDate, endDate, categoryIds } = req.body;

    const where: any = {
      userId,
      date: { [Op.between]: [new Date(startDate), new Date(endDate)] },
    };

    if (categoryIds && categoryIds.length > 0) {
      where.categoryId = { [Op.in]: categoryIds };
    }

    const expenses = await Expense.findAll({
      where,
      include: [{ model: Category, as: 'category' }],
      order: [['date', 'DESC']],
    });

    const totalAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

    // Group by category
    const byCategory: any = {};
    expenses.forEach(expense => {
      const catName = expense.category?.name || 'Uncategorized';
      if (!byCategory[catName]) {
        byCategory[catName] = { total: 0, count: 0, color: expense.category?.color };
      }
      byCategory[catName].total += parseFloat(expense.amount.toString());
      byCategory[catName].count++;
    });

    res.json({
      success: true,
      data: {
        expenses,
        summary: {
          totalAmount,
          totalCount: expenses.length,
          startDate,
          endDate,
          byCategory: Object.entries(byCategory).map(([name, data]: [string, any]) => ({
            category: name,
            ...data,
          })),
        },
      },
    });
  })
);

/**
 * @route   GET /api/reports/export/csv
 * @desc    Export expenses to CSV
 * @access  Private (if password protected)
 */
router.get(
  '/export/csv',
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
      order: [['date', 'DESC']],
    });

    // Ensure export directory exists
    if (!fs.existsSync(env.CSV_EXPORT_PATH)) {
      fs.mkdirSync(env.CSV_EXPORT_PATH, { recursive: true });
    }

    const filename = `expenses-${Date.now()}.csv`;
    const filepath = path.join(env.CSV_EXPORT_PATH, filename);

    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'date', title: 'Date' },
        { id: 'category', title: 'Category' },
        { id: 'description', title: 'Description' },
        { id: 'amount', title: 'Amount' },
        { id: 'paymentMethod', title: 'Payment Method' },
      ],
    });

    const records = expenses.map(expense => ({
      date: expense.date.toISOString().split('T')[0],
      category: expense.category?.name || 'Uncategorized',
      description: expense.description,
      amount: parseFloat(expense.amount.toString()).toFixed(2),
      paymentMethod: expense.paymentMethod,
    }));

    await csvWriter.writeRecords(records);

    res.download(filepath, filename, (err) => {
      if (!err) {
        // Delete file after download
        fs.unlinkSync(filepath);
      }
    });
  })
);

/**
 * @route   GET /api/reports/export/pdf
 * @desc    Export report to PDF (simplified version)
 * @access  Private (if password protected)
 */
router.get(
  '/export/pdf',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // For now, return JSON with note about PDF export
    // Full PDF implementation would require PDFKit setup
    res.json({
      success: true,
      message: 'PDF export feature coming soon. Use CSV export for now.',
      note: 'To implement: Install PDFKit and use it to generate formatted PDF reports',
    });
  })
);

export default router;
