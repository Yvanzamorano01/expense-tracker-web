import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subWeeks, subQuarters, subYears, differenceInDays } from 'date-fns';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format currency based on user preferences
 */
const formatCurrency = (amount) => {
  const currency = localStorage.getItem('selectedCurrency') || 'USD';
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$'
  };

  const symbol = symbols[currency] || '$';
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format date based on user preferences
 */
const formatDate = (dateString) => {
  const dateFormat = localStorage.getItem('dateFormat') || 'MM/dd/yyyy';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, dateFormat);
  } catch (error) {
    return dateString;
  }
};

/**
 * Check if an expense matches a category
 * Handles both ID and name matching for consistency
 * @param {Object} expense - Expense object with categoryId or category name
 * @param {Object} category - Category object with id and name
 * @returns {boolean} - True if expense belongs to category
 */
const matchesCategory = (expense, category) => {
  // Match by ID (preferred, more reliable)
  if (expense.categoryId && category.id) {
    return parseInt(expense.categoryId) === parseInt(category.id);
  }
  // Fallback to name matching (case-insensitive)
  if (expense.category && category.name) {
    return expense.category.toLowerCase() === category.name.toLowerCase();
  }
  return false;
};

/**
 * Get date range based on predefined period
 */
const getDateRangeForPeriod = (period) => {
  const now = new Date();

  switch (period) {
    case 'week':
      return {
        startDate: startOfWeek(now, { weekStartsOn: 1 }), // Monday
        endDate: endOfWeek(now, { weekStartsOn: 1 })      // Sunday
      };
    case 'month':
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now)
      };
    case 'quarter':
      return {
        startDate: startOfQuarter(now),
        endDate: endOfQuarter(now)
      };
    case 'year':
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now)
      };
    default:
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now)
      };
  }
};

/**
 * Filter expenses by date range
 */
const filterExpensesByDateRange = (expenses, startDate, endDate) => {
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= startDate && expenseDate <= endDate;
  });
};

/**
 * Calculate report statistics
 */
const calculateReportStatistics = (expenses, categories) => {
  const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const count = expenses.length;
  const average = count > 0 ? total / count : 0;

  const amounts = expenses.map(exp => parseFloat(exp.amount || 0));
  const largest = amounts.length > 0 ? Math.max(...amounts) : 0;
  const smallest = amounts.length > 0 ? Math.min(...amounts) : 0;

  // Days in range calculation
  const dates = expenses.map(exp => new Date(exp.date));
  const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
  const maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();
  const daysInRange = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
  const averageDaily = daysInRange > 0 ? total / daysInRange : 0;

  return {
    totalExpenses: total,
    transactionCount: count,
    averageTransaction: average,
    averageDaily,
    largestExpense: largest,
    smallestExpense: smallest,
    daysInRange
  };
};

/**
 * Calculate category breakdown
 */
const calculateCategoryBreakdown = (expenses, categories, selectedCategories) => {
  const breakdown = [];

  categories.forEach(category => {
    // Skip if not selected
    if (selectedCategories.length > 0 && !selectedCategories.includes(category.id)) {
      return;
    }

    const categoryExpenses = expenses.filter(exp => matchesCategory(exp, category));
    const spent = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const budget = category.budget || 0;
    const variance = spent - budget;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;

    if (spent > 0 || budget > 0) {
      breakdown.push({
        category: category.name,
        budget,
        spent,
        variance,
        percentage,
        transactionCount: categoryExpenses.length,
        color: category.color
      });
    }
  });

  // Sort by spent amount (descending)
  breakdown.sort((a, b) => b.spent - a.spent);

  return breakdown;
};

/**
 * Get previous period date range based on current period
 */
const getPreviousPeriodRange = (period, currentStartDate, currentEndDate) => {
  switch (period) {
    case 'week':
      return {
        startDate: subWeeks(currentStartDate, 1),
        endDate: subWeeks(currentEndDate, 1)
      };
    case 'month':
      return {
        startDate: subMonths(currentStartDate, 1),
        endDate: subMonths(currentEndDate, 1)
      };
    case 'quarter':
      return {
        startDate: subQuarters(currentStartDate, 1),
        endDate: subQuarters(currentEndDate, 1)
      };
    case 'year':
      return {
        startDate: subYears(currentStartDate, 1),
        endDate: subYears(currentEndDate, 1)
      };
    default:
      return {
        startDate: subMonths(currentStartDate, 1),
        endDate: subMonths(currentEndDate, 1)
      };
  }
};

/**
 * Calculate top N largest expenses
 */
const calculateTopExpenses = (expenses, n = 5) => {
  return [...expenses]
    .sort((a, b) => parseFloat(b.amount || 0) - parseFloat(a.amount || 0))
    .slice(0, n)
    .map(exp => ({
      date: exp.date,
      description: exp.description || 'No description',
      category: exp.category,
      amount: parseFloat(exp.amount || 0)
    }));
};

/**
 * Calculate budget summary across all categories
 */
const calculateBudgetSummary = (categoryBreakdown) => {
  const totalBudget = categoryBreakdown.reduce((sum, cat) => sum + (cat.budget || 0), 0);
  const totalSpent = categoryBreakdown.reduce((sum, cat) => sum + cat.spent, 0);
  const remaining = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return {
    totalBudget,
    totalSpent,
    remaining,
    percentUsed,
    status: percentUsed > 100 ? 'over' : percentUsed > 80 ? 'warning' : 'good'
  };
};

/**
 * Calculate spending projection for the period
 */
const calculateProjection = (total, startDate, endDate) => {
  const now = new Date();
  const periodStart = new Date(startDate);
  const periodEnd = new Date(endDate);

  // Days elapsed since period start (at least 1)
  const daysElapsed = Math.max(1, differenceInDays(now, periodStart) + 1);

  // Total days in period
  const totalDays = differenceInDays(periodEnd, periodStart) + 1;

  // Days remaining
  const daysRemaining = Math.max(0, differenceInDays(periodEnd, now));

  // Daily average based on current spending
  const dailyAverage = total / daysElapsed;

  // Projected total at end of period
  const estimatedTotal = dailyAverage * totalDays;

  return {
    estimatedTotal,
    daysElapsed,
    daysRemaining,
    totalDays,
    dailyAverage,
    percentComplete: Math.round((daysElapsed / totalDays) * 100)
  };
};

/**
 * Get period label for display
 */
const getPeriodLabel = (period) => {
  const labels = {
    week: 'This Week',
    month: 'This Month',
    quarter: 'This Quarter',
    year: 'This Year',
    custom: 'Custom Period'
  };
  return labels[period] || 'Selected Period';
};

// ============================================================================
// REPORT DATA GENERATION
// ============================================================================

/**
 * Generate report data based on configuration
 */
export const generateReportData = (reportConfig, allExpenses, categories) => {
  // Determine date range
  let startDate, endDate;

  if (reportConfig.dateRange === 'custom' && reportConfig.startDate && reportConfig.endDate) {
    startDate = new Date(reportConfig.startDate);
    startDate.setHours(0, 0, 0, 0); // Start of day

    endDate = new Date(reportConfig.endDate);
    endDate.setHours(23, 59, 59, 999); // End of day - CRITICAL FIX
  } else {
    const range = getDateRangeForPeriod(reportConfig.dateRange);
    startDate = range.startDate;
    endDate = range.endDate;
  }

  // Filter expenses by date range
  let filteredExpenses = filterExpensesByDateRange(allExpenses, startDate, endDate);

  // Note: All categories are always included - no category filtering

  // Calculate statistics
  const summary = calculateReportStatistics(filteredExpenses, categories);
  summary.dateRange = {
    start: startDate,
    end: endDate
  };

  // Calculate category breakdown
  const categoryBreakdown = calculateCategoryBreakdown(
    filteredExpenses,
    categories,
    reportConfig.categories || []
  );

  // Sort transactions by date (newest first)
  const transactions = [...filteredExpenses].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  // ===== NEW DATA: Top 5 Expenses =====
  const topExpenses = calculateTopExpenses(filteredExpenses, 5);

  // ===== NEW DATA: Previous Period Comparison =====
  const previousPeriodRange = getPreviousPeriodRange(reportConfig.dateRange, startDate, endDate);
  const previousPeriodExpenses = filterExpensesByDateRange(
    allExpenses,
    previousPeriodRange.startDate,
    previousPeriodRange.endDate
  );
  const previousTotal = previousPeriodExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const changeAmount = summary.totalExpenses - previousTotal;
  const changePercent = previousTotal > 0 ? ((changeAmount / previousTotal) * 100) : 0;

  const previousPeriod = {
    total: previousTotal,
    transactionCount: previousPeriodExpenses.length,
    changeAmount,
    changePercent,
    trend: changeAmount > 0 ? 'up' : changeAmount < 0 ? 'down' : 'stable'
  };

  // ===== NEW DATA: Budget Summary =====
  const budgetSummary = calculateBudgetSummary(categoryBreakdown);

  // ===== NEW DATA: Spending Projection =====
  const projection = calculateProjection(summary.totalExpenses, startDate, endDate);

  // Generate metadata
  const metadata = {
    reportType: reportConfig.type,
    reportTypeName: getReportTypeName(reportConfig.type),
    dateRange: reportConfig.dateRange,
    periodLabel: getPeriodLabel(reportConfig.dateRange),
    customDateRange: reportConfig.customDateRange,
    selectedCategories: reportConfig.categories || [],
    generatedAt: new Date().toISOString(),
    generatedBy: 'ExpenseTracker Pro',
    includeCharts: reportConfig.includeCharts,
    includeTransactions: reportConfig.includeTransactions
  };

  return {
    metadata,
    summary,
    categoryBreakdown,
    transactions,
    // New data
    topExpenses,
    previousPeriod,
    budgetSummary,
    projection
  };
};

/**
 * Get human-readable report type name
 */
const getReportTypeName = (type) => {
  const types = {
    summary: 'Summary Report',
    detailed: 'Detailed Analysis',
    category: 'Category Breakdown',
    trend: 'Trend Analysis',
    budget: 'Budget vs Actual Report'
  };
  return types[type] || 'Expense Report';
};

// ============================================================================
// CSV EXPORT
// ============================================================================

/**
 * Export report to CSV format - Enhanced
 */
export const exportToCSV = (reportData, reportConfig) => {
  const { metadata, summary, categoryBreakdown, transactions, topExpenses, previousPeriod, budgetSummary, projection } = reportData;

  let csvContent = '';

  // Header section
  csvContent += `ExpenseTracker Pro - ${metadata.reportTypeName}\n`;
  csvContent += `Generated: ${formatDate(metadata.generatedAt)}\n`;
  csvContent += `Period: ${formatDate(summary.dateRange.start)} to ${formatDate(summary.dateRange.end)}\n`;
  csvContent += `\n`;

  // Executive Summary section
  csvContent += `EXECUTIVE SUMMARY\n`;
  csvContent += `Total Expenses,${formatCurrency(summary.totalExpenses)}\n`;
  csvContent += `Transaction Count,${summary.transactionCount}\n`;
  csvContent += `Average Transaction,${formatCurrency(summary.averageTransaction)}\n`;
  csvContent += `Average Daily,${formatCurrency(summary.averageDaily)}\n`;
  csvContent += `Largest Expense,${formatCurrency(summary.largestExpense)}\n`;
  csvContent += `\n`;

  // Previous Period Comparison
  csvContent += `COMPARISON VS PREVIOUS PERIOD\n`;
  csvContent += `Previous Period Total,${formatCurrency(previousPeriod.total)}\n`;
  csvContent += `Change Amount,${previousPeriod.changeAmount >= 0 ? '+' : ''}${formatCurrency(previousPeriod.changeAmount)}\n`;
  csvContent += `Change Percent,${previousPeriod.changePercent >= 0 ? '+' : ''}${previousPeriod.changePercent.toFixed(1)}%\n`;
  csvContent += `Trend,${previousPeriod.trend}\n`;
  csvContent += `\n`;

  // Budget Summary
  if (budgetSummary.totalBudget > 0) {
    csvContent += `BUDGET SUMMARY\n`;
    csvContent += `Total Budget,${formatCurrency(budgetSummary.totalBudget)}\n`;
    csvContent += `Total Spent,${formatCurrency(budgetSummary.totalSpent)}\n`;
    csvContent += `Remaining,${formatCurrency(budgetSummary.remaining)}\n`;
    csvContent += `Percent Used,${budgetSummary.percentUsed.toFixed(1)}%\n`;
    csvContent += `Status,${budgetSummary.status}\n`;
    csvContent += `\n`;
  }

  // Projection
  if (projection.daysRemaining > 0) {
    csvContent += `SPENDING PROJECTION\n`;
    csvContent += `Days Elapsed,${projection.daysElapsed}\n`;
    csvContent += `Days Remaining,${projection.daysRemaining}\n`;
    csvContent += `Daily Average,${formatCurrency(projection.dailyAverage)}\n`;
    csvContent += `Estimated Total,${formatCurrency(projection.estimatedTotal)}\n`;
    csvContent += `\n`;
  }

  // Top 5 Expenses
  if (topExpenses && topExpenses.length > 0) {
    csvContent += `TOP 5 LARGEST EXPENSES\n`;
    csvContent += `Rank,Date,Description,Category,Amount\n`;
    topExpenses.forEach((exp, index) => {
      const description = (exp.description || '').replace(/,/g, ';');
      csvContent += `${index + 1},${formatDate(exp.date)},${description},${exp.category},${formatCurrency(exp.amount)}\n`;
    });
    csvContent += `\n`;
  }

  // Category breakdown section
  csvContent += `CATEGORY BREAKDOWN\n`;
  csvContent += `Category,Budget,Spent,Variance,Percentage,Transactions\n`;
  categoryBreakdown.forEach(cat => {
    csvContent += `${cat.category},${formatCurrency(cat.budget)},${formatCurrency(cat.spent)},${cat.variance >= 0 ? '+' : ''}${formatCurrency(cat.variance)},${cat.percentage.toFixed(1)}%,${cat.transactionCount}\n`;
  });
  csvContent += `\n`;

  // Transactions section (if enabled)
  if (reportConfig.includeTransactions && transactions.length > 0) {
    csvContent += `ALL TRANSACTIONS (${transactions.length})\n`;
    csvContent += `Date,Category,Amount,Description,Payment Method\n`;
    transactions.forEach(exp => {
      const description = (exp.description || '').replace(/,/g, ';');
      const paymentMethod = exp.paymentMethod || 'N/A';
      csvContent += `${formatDate(exp.date)},${exp.category},${formatCurrency(parseFloat(exp.amount))},${description},${paymentMethod}\n`;
    });
  }

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `expense-report-${reportConfig.type}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ============================================================================
// JSON EXPORT
// ============================================================================

/**
 * Export report to JSON format - Enhanced with new data structures
 */
export const exportToJSON = (reportData, reportConfig) => {
  const { metadata, summary, categoryBreakdown, transactions, topExpenses, previousPeriod, budgetSummary, projection } = reportData;

  const exportData = {
    // Export metadata
    exportInfo: {
      exportedAt: new Date().toISOString(),
      format: 'JSON',
      version: '2.0',
      generator: 'ExpenseTracker Pro'
    },

    // Report metadata
    metadata,

    // Executive summary
    summary: {
      ...summary,
      formattedTotal: formatCurrency(summary.totalExpenses),
      formattedAverage: formatCurrency(summary.averageTransaction),
      formattedDaily: formatCurrency(summary.averageDaily),
      dateRangeFormatted: {
        start: formatDate(summary.dateRange.start),
        end: formatDate(summary.dateRange.end)
      }
    },

    // Comparison with previous period
    previousPeriod: {
      ...previousPeriod,
      formattedTotal: formatCurrency(previousPeriod.total),
      formattedChangeAmount: formatCurrency(Math.abs(previousPeriod.changeAmount)),
      changeDirection: previousPeriod.changeAmount >= 0 ? 'increase' : 'decrease'
    },

    // Budget overview
    budgetSummary: {
      ...budgetSummary,
      formattedTotalBudget: formatCurrency(budgetSummary.totalBudget),
      formattedTotalSpent: formatCurrency(budgetSummary.totalSpent),
      formattedRemaining: formatCurrency(budgetSummary.remaining)
    },

    // Spending projection
    projection: {
      ...projection,
      formattedEstimatedTotal: formatCurrency(projection.estimatedTotal),
      formattedDailyAverage: formatCurrency(projection.dailyAverage)
    },

    // Top expenses
    topExpenses: topExpenses.map(exp => ({
      ...exp,
      formattedAmount: formatCurrency(exp.amount),
      formattedDate: formatDate(exp.date)
    })),

    // Category breakdown with formatting
    categoryBreakdown: categoryBreakdown.map(cat => ({
      ...cat,
      formattedBudget: formatCurrency(cat.budget),
      formattedSpent: formatCurrency(cat.spent),
      formattedVariance: (cat.variance >= 0 ? '+' : '') + formatCurrency(cat.variance),
      overBudget: cat.variance > 0,
      underBudget: cat.variance < 0
    })),

    // All transactions (if enabled)
    transactions: reportConfig.includeTransactions ? transactions.map(exp => ({
      ...exp,
      formattedAmount: formatCurrency(parseFloat(exp.amount)),
      formattedDate: formatDate(exp.date)
    })) : [],
    transactionsIncluded: reportConfig.includeTransactions,
    transactionCount: transactions.length
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `expense-report-${reportConfig.type}-${format(new Date(), 'yyyy-MM-dd')}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ============================================================================
// PDF EXPORT
// ============================================================================

/**
 * Export report to PDF format - Enhanced Design
 */
export const exportToPDF = async (reportData, reportConfig, chartImages = []) => {
  const { metadata, summary, categoryBreakdown, transactions, topExpenses, previousPeriod, budgetSummary, projection } = reportData;

  // Create new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 0;

  // Color palette
  const colors = {
    primary: [37, 99, 235],      // Blue
    success: [34, 197, 94],      // Green
    warning: [245, 158, 11],     // Amber
    danger: [239, 68, 68],       // Red
    gray: [107, 114, 128],       // Gray
    lightGray: [243, 244, 246],  // Light gray
    white: [255, 255, 255]
  };

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace) => {
    if (yPosition + requiredSpace > pageHeight - 25) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Helper to draw a metric box
  const drawMetricBox = (x, y, width, height, label, value, subtext = '', color = colors.primary) => {
    // Box background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, width, height, 3, 3, 'F');

    // Left color bar
    doc.setFillColor(...color);
    doc.rect(x, y, 3, height, 'F');

    // Label
    doc.setFontSize(8);
    doc.setTextColor(...colors.gray);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + 8, y + 10);

    // Value
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + 8, y + 22);

    // Subtext
    if (subtext) {
      doc.setFontSize(7);
      doc.setTextColor(...colors.gray);
      doc.setFont('helvetica', 'normal');
      doc.text(subtext, x + 8, y + 30);
    }
  };

  // ===== STYLED HEADER =====
  // Blue banner
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Title
  doc.setTextColor(...colors.white);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ExpenseTracker Pro', 14, 18);

  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${metadata.reportTypeName} - ${metadata.periodLabel || 'Report'}`, 14, 30);

  // Date on right
  doc.setFontSize(9);
  doc.text(`Generated: ${formatDate(metadata.generatedAt)}`, pageWidth - 14, 30, { align: 'right' });

  yPosition = 50;

  // ===== PERIOD INFO BAR =====
  doc.setFillColor(...colors.lightGray);
  doc.rect(14, yPosition, pageWidth - 28, 12, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${formatDate(summary.dateRange.start)} to ${formatDate(summary.dateRange.end)}`, 18, yPosition + 8);

  yPosition += 20;

  // ===== EXECUTIVE SUMMARY - 4 METRIC BOXES =====
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Executive Summary', 14, yPosition);
  yPosition += 8;

  const boxWidth = (pageWidth - 42) / 4;
  const boxHeight = 35;

  // Box 1: Total Expenses
  drawMetricBox(14, yPosition, boxWidth, boxHeight, 'Total Expenses', formatCurrency(summary.totalExpenses), `${summary.transactionCount} transactions`, colors.primary);

  // Box 2: Daily Average
  drawMetricBox(14 + boxWidth + 4, yPosition, boxWidth, boxHeight, 'Daily Average', formatCurrency(summary.averageDaily), `${summary.daysInRange} days`, colors.success);

  // Box 3: Budget Status
  const budgetColor = budgetSummary.status === 'over' ? colors.danger : budgetSummary.status === 'warning' ? colors.warning : colors.success;
  drawMetricBox(14 + (boxWidth + 4) * 2, yPosition, boxWidth, boxHeight, 'Budget Used', `${budgetSummary.percentUsed.toFixed(0)}%`, budgetSummary.status === 'over' ? 'Over budget!' : 'On track', budgetColor);

  // Box 4: vs Previous Period
  const trendColor = previousPeriod.trend === 'up' ? colors.danger : previousPeriod.trend === 'down' ? colors.success : colors.gray;
  const trendSymbol = previousPeriod.trend === 'up' ? '+' : previousPeriod.trend === 'down' ? '' : '';
  drawMetricBox(14 + (boxWidth + 4) * 3, yPosition, boxWidth, boxHeight, 'vs Previous', `${trendSymbol}${previousPeriod.changePercent.toFixed(1)}%`, formatCurrency(Math.abs(previousPeriod.changeAmount)), trendColor);

  yPosition += boxHeight + 15;

  // ===== PROJECTION SECTION =====
  if (projection.daysRemaining > 0) {
    checkNewPage(25);
    doc.setFillColor(254, 243, 199); // Light amber background
    doc.roundedRect(14, yPosition, pageWidth - 28, 20, 2, 2, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.warning);
    doc.text('PROJECTION', 18, yPosition + 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`At current pace, estimated total by end of period: ${formatCurrency(projection.estimatedTotal)} (${projection.daysRemaining} days remaining)`, 18, yPosition + 15);

    yPosition += 28;
  }

  // ===== BUDGET SUMMARY BAR =====
  if (budgetSummary.totalBudget > 0) {
    checkNewPage(30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Budget Overview', 14, yPosition);
    yPosition += 6;

    // Progress bar background
    const barWidth = pageWidth - 28;
    const barHeight = 8;
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(14, yPosition, barWidth, barHeight, 2, 2, 'F');

    // Progress bar fill
    const fillPercent = Math.min(budgetSummary.percentUsed, 100) / 100;
    const fillColor = budgetSummary.status === 'over' ? colors.danger : budgetSummary.status === 'warning' ? colors.warning : colors.success;
    doc.setFillColor(...fillColor);
    doc.roundedRect(14, yPosition, barWidth * fillPercent, barHeight, 2, 2, 'F');

    yPosition += 12;

    // Budget text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.gray);
    doc.text(`Budget: ${formatCurrency(budgetSummary.totalBudget)}  |  Spent: ${formatCurrency(budgetSummary.totalSpent)}  |  Remaining: ${formatCurrency(budgetSummary.remaining)}`, 14, yPosition);

    yPosition += 12;
  }

  // ===== TOP 5 EXPENSES =====
  if (topExpenses && topExpenses.length > 0) {
    checkNewPage(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Top 5 Largest Expenses', 14, yPosition);
    yPosition += 6;

    const topExpensesData = topExpenses.map((exp, index) => [
      `${index + 1}`,
      formatDate(exp.date),
      exp.description.substring(0, 30),
      exp.category,
      formatCurrency(exp.amount)
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Date', 'Description', 'Category', 'Amount']],
      body: topExpensesData,
      theme: 'plain',
      headStyles: { fillColor: colors.lightGray, textColor: [0, 0, 0], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 55 },
        3: { cellWidth: 35 },
        4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 12;
  }

  // ===== CATEGORY BREAKDOWN WITH COLORS =====
  if (categoryBreakdown.length > 0) {
    checkNewPage(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Category Breakdown', 14, yPosition);
    yPosition += 6;

    const categoryData = categoryBreakdown.map(cat => [
      cat.category,
      formatCurrency(cat.budget),
      formatCurrency(cat.spent),
      (cat.variance >= 0 ? '+' : '') + formatCurrency(cat.variance),
      `${cat.percentage.toFixed(0)}%`,
      cat.transactionCount.toString()
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Category', 'Budget', 'Spent', 'Variance', '%', 'Count']],
      body: categoryData,
      theme: 'grid',
      headStyles: { fillColor: colors.primary, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25, halign: 'right' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 15, halign: 'center' }
      },
      // Color rows based on variance
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const variance = categoryBreakdown[data.row.index]?.variance || 0;
          if (variance > 0) {
            data.cell.styles.textColor = colors.danger;
          } else if (variance < 0) {
            data.cell.styles.textColor = colors.success;
          }
        }
      },
      willDrawCell: (data) => {
        if (data.section === 'body') {
          const variance = categoryBreakdown[data.row.index]?.variance || 0;
          if (variance > 0) {
            doc.setFillColor(254, 242, 242); // Light red
          } else if (variance < 0) {
            doc.setFillColor(240, 253, 244); // Light green
          } else {
            doc.setFillColor(255, 255, 255);
          }
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 12;
  }

  // ===== CHARTS & VISUALIZATIONS =====
  if (reportConfig.includeCharts && chartImages && chartImages.length > 0) {
    checkNewPage(50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Visual Analytics', 14, yPosition);
    yPosition += 10;

    for (const chartImage of chartImages) {
      try {
        const maxWidth = pageWidth - 28;
        const maxHeight = 90;

        checkNewPage(maxHeight + 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(chartImage.title || `${chartImage.type} Chart`, 14, yPosition);
        yPosition += 6;

        doc.addImage(chartImage.dataUrl, 'PNG', 14, yPosition, maxWidth, maxHeight, undefined, 'FAST');
        yPosition += maxHeight + 12;
      } catch (error) {
        console.error(`Error inserting ${chartImage.type} chart:`, error);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(`[Chart unavailable: ${chartImage.title}]`, 14, yPosition);
        yPosition += 10;
      }
    }
  }

  // ===== TRANSACTIONS =====
  if (reportConfig.includeTransactions && transactions.length > 0) {
    checkNewPage(50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`All Transactions (${transactions.length})`, 14, yPosition);
    yPosition += 6;

    const transactionData = transactions.map(exp => [
      formatDate(exp.date),
      exp.category,
      formatCurrency(parseFloat(exp.amount)),
      (exp.description || 'N/A').substring(0, 45)
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Category', 'Amount', 'Description']],
      body: transactionData,
      theme: 'striped',
      headStyles: { fillColor: colors.primary, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 32 },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 72 }
      }
    });
  }

  // ===== ENHANCED FOOTER ON ALL PAGES =====
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(...colors.lightGray);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);

    // Footer text
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.gray);
    doc.text('Generated by ExpenseTracker Pro', 14, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }

  // Save PDF
  doc.save(`expense-report-${reportConfig.type}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
