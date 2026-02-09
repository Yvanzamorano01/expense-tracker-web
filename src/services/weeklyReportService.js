/**
 * Weekly Report Service
 * Generates weekly spending reports and insights
 */

import { loadExpenses, loadCategories } from '../utils/storageHelpers';

/**
 * Get the start and end dates of the current week
 * @returns {Object} { startDate, endDate }
 */
export const getCurrentWeekDates = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate start of week (Monday)
  const startDate = new Date(now);
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days
  startDate.setDate(now.getDate() + diff);
  startDate.setHours(0, 0, 0, 0);

  // Calculate end of week (Sunday)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

/**
 * Get the start and end dates of the previous week
 * @returns {Object} { startDate, endDate }
 */
export const getPreviousWeekDates = () => {
  const currentWeek = getCurrentWeekDates();

  const startDate = new Date(currentWeek.startDate);
  startDate.setDate(startDate.getDate() - 7);

  const endDate = new Date(currentWeek.endDate);
  endDate.setDate(endDate.getDate() - 7);

  return { startDate, endDate };
};

/**
 * Filter expenses by date range
 * @param {Array} expenses - Array of expense objects
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Filtered expenses
 */
export const filterExpensesByDateRange = (expenses, startDate, endDate) => {
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= startDate && expenseDate <= endDate;
  });
};

/**
 * Calculate total spending for expenses
 * @param {Array} expenses - Array of expense objects
 * @returns {number} Total amount spent
 */
export const calculateTotalSpending = (expenses) => {
  return expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
};

/**
 * Group expenses by category and calculate totals
 * @param {Array} expenses - Array of expense objects
 * @param {Array} categories - Array of category objects
 * @returns {Array} Array of { categoryName, amount, percentage }
 */
export const groupExpensesByCategory = (expenses, categories) => {
  const total = calculateTotalSpending(expenses);

  if (total === 0) {
    return [];
  }

  // Create a map of category spending
  const categoryMap = {};

  expenses.forEach(expense => {
    const categoryId = expense.categoryId;
    if (!categoryMap[categoryId]) {
      categoryMap[categoryId] = 0;
    }
    categoryMap[categoryId] += parseFloat(expense.amount || 0);
  });

  // Convert to array with category names
  const categorySpending = Object.entries(categoryMap).map(([categoryId, amount]) => {
    const category = categories.find(cat => cat.id === parseInt(categoryId));
    return {
      categoryId: parseInt(categoryId),
      categoryName: category ? category.name : 'Unknown',
      amount: parseFloat(amount.toFixed(2)),
      percentage: ((amount / total) * 100).toFixed(1)
    };
  });

  // Sort by amount descending
  return categorySpending.sort((a, b) => b.amount - a.amount);
};

/**
 * Generate weekly report
 * @returns {Object|null} Weekly report object or null if no data
 */
export const generateWeeklyReport = async () => {
  try {
    // Load expenses and categories
    const expenses = await loadExpenses();
    const categories = await loadCategories();

    if (!expenses || expenses.length === 0) {
      return null;
    }

    // Get current week and previous week dates
    const currentWeek = getCurrentWeekDates();
    const previousWeek = getPreviousWeekDates();

    // Filter expenses for each week
    const currentWeekExpenses = filterExpensesByDateRange(expenses, currentWeek.startDate, currentWeek.endDate);
    const previousWeekExpenses = filterExpensesByDateRange(expenses, previousWeek.startDate, previousWeek.endDate);

    // Calculate totals
    const currentWeekTotal = calculateTotalSpending(currentWeekExpenses);
    const previousWeekTotal = calculateTotalSpending(previousWeekExpenses);

    // Calculate percentage change
    let percentageChange = 0;
    let changeDirection = 'same';

    if (previousWeekTotal > 0) {
      percentageChange = ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100;
      changeDirection = percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'same';
    } else if (currentWeekTotal > 0) {
      changeDirection = 'up';
      percentageChange = 100;
    }

    // Get top spending categories
    const categoryBreakdown = groupExpensesByCategory(currentWeekExpenses, categories);
    const topCategories = categoryBreakdown.slice(0, 3);

    // Determine budget status
    // For simplicity, we'll check if current week spending is reasonable
    // You can enhance this by checking against weekly budget limits
    const averageWeeklySpending = currentWeekTotal;
    const budgetStatus = currentWeekTotal < 1000 ? 'on-track' : 'over-budget';

    return {
      period: {
        start: currentWeek.startDate.toISOString(),
        end: currentWeek.endDate.toISOString()
      },
      currentWeek: {
        total: parseFloat(currentWeekTotal.toFixed(2)),
        transactionCount: currentWeekExpenses.length,
        topCategories
      },
      previousWeek: {
        total: parseFloat(previousWeekTotal.toFixed(2)),
        transactionCount: previousWeekExpenses.length
      },
      comparison: {
        percentageChange: parseFloat(percentageChange.toFixed(1)),
        direction: changeDirection,
        absoluteChange: parseFloat((currentWeekTotal - previousWeekTotal).toFixed(2))
      },
      budgetStatus,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating weekly report:', error);
    return null;
  }
};

/**
 * Format weekly report as notification message
 * @param {Object} report - Weekly report object
 * @returns {Object} { title, message }
 */
export const formatWeeklyReportNotification = (report) => {
  if (!report) {
    return {
      title: 'Weekly Spending Report',
      message: 'No spending data available for this week.'
    };
  }

  const { currentWeek, previousWeek, comparison, budgetStatus } = report;

  // Format comparison
  let comparisonText = '';
  if (comparison.direction === 'up') {
    comparisonText = `↑ ${Math.abs(comparison.percentageChange)}% vs last week ($${previousWeek.total.toFixed(2)})`;
  } else if (comparison.direction === 'down') {
    comparisonText = `↓ ${Math.abs(comparison.percentageChange)}% vs last week ($${previousWeek.total.toFixed(2)})`;
  } else {
    comparisonText = `Same as last week ($${previousWeek.total.toFixed(2)})`;
  }

  // Format top categories
  let topCategoriesText = '';
  if (currentWeek.topCategories && currentWeek.topCategories.length > 0) {
    topCategoriesText = currentWeek.topCategories
      .map(cat => `${cat.categoryName} ($${cat.amount.toFixed(2)})`)
      .join(', ');
  } else {
    topCategoriesText = 'No expenses recorded';
  }

  // Format budget status
  const statusText = budgetStatus === 'on-track' ? '✓ On track with budget' : '⚠ Over budget';

  const message = `This week: $${currentWeek.total.toFixed(2)}
${comparisonText}
Top: ${topCategoriesText}
Status: ${statusText}`;

  return {
    title: '📊 Weekly Spending Report',
    message
  };
};

/**
 * Check if weekly report was already sent this week
 * @returns {boolean}
 */
export const wasReportSentThisWeek = () => {
  const lastReportDate = localStorage.getItem('lastWeeklyReportDate');
  if (!lastReportDate) {
    return false;
  }

  const lastReport = new Date(lastReportDate);
  const currentWeek = getCurrentWeekDates();

  // Check if last report was sent during current week
  return lastReport >= currentWeek.startDate && lastReport <= currentWeek.endDate;
};

/**
 * Mark weekly report as sent
 */
export const markReportAsSent = () => {
  localStorage.setItem('lastWeeklyReportDate', new Date().toISOString());
};

/**
 * Check if it's Monday (the day to send weekly reports)
 * @returns {boolean}
 */
export const isReportDay = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  return dayOfWeek === 1; // Monday
};
