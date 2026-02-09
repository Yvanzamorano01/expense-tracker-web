import { formatCurrency, getCurrentCurrency, convertCurrency } from './currencyHelpers';

/**
 * Get expenses for a specific month
 * @param {Array} expenses - All expenses
 * @param {number} monthOffset - Offset from current month (0 = current, -1 = last month)
 * @returns {Array} Expenses for the specified month
 */
export const getExpensesByMonth = (expenses, monthOffset = 0) => {
  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();

  return expenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate.getMonth() === targetMonth && expDate.getFullYear() === targetYear;
  });
};

/**
 * Calculate month-over-month comparison
 * @param {Array} currentMonthExpenses - Current month expenses
 * @param {Array} previousMonthExpenses - Previous month expenses
 * @returns {Object} Comparison data
 */
export const calculateMonthComparison = (currentMonthExpenses, previousMonthExpenses) => {
  const currentTotal = currentMonthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const previousTotal = previousMonthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

  const difference = currentTotal - previousTotal;
  const percentageChange = previousTotal > 0 ? ((difference / previousTotal) * 100) : 0;

  return {
    currentTotal,
    previousTotal,
    difference,
    percentageChange,
    isIncrease: difference > 0,
    isDecrease: difference < 0
  };
};

/**
 * Get top spending categories
 * @param {Array} expenses - Expenses to analyze
 * @param {Array} categories - Available categories with metadata
 * @param {number} limit - Number of top categories to return
 * @returns {Array} Top spending categories
 */
export const getTopSpendingCategories = (expenses, categories, limit = 3) => {
  // Group by category
  const categoryTotals = expenses.reduce((acc, exp) => {
    const category = exp.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += parseFloat(exp.amount || 0);
    return acc;
  }, {});

  // Convert to array and sort
  const sorted = Object.entries(categoryTotals)
    .map(([name, total]) => {
      const categoryInfo = categories.find(cat => cat.name === name) || {};
      const overallTotal = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
      const percentage = overallTotal > 0 ? (total / overallTotal) * 100 : 0;

      return {
        name,
        total,
        percentage,
        color: categoryInfo.color || '#6B7280',
        icon: categoryInfo.icon || 'Circle'
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  return sorted;
};

/**
 * Get budget performance alerts
 * @param {Array} categories - Categories with budget data
 * @param {Array} expenses - Current month expenses
 * @returns {Object} Budget alerts
 */
export const getBudgetAlerts = (categories, expenses) => {
  const alerts = {
    approaching: [], // 80-99%
    exceeded: [],    // >= 100%
    wellUnder: []    // < 50%
  };

  categories.forEach(category => {
    const budget = parseFloat(category.budget || 0);
    if (budget <= 0) return;

    const spent = expenses
      .filter(exp => exp.category === category.name)
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

    const percentage = (spent / budget) * 100;

    const alert = {
      category: category.name,
      budget,
      spent,
      percentage,
      color: category.color,
      icon: category.icon
    };

    if (percentage >= 100) {
      alerts.exceeded.push(alert);
    } else if (percentage >= 80) {
      alerts.approaching.push(alert);
    } else if (percentage < 50) {
      alerts.wellUnder.push(alert);
    }
  });

  return alerts;
};

/**
 * Identify savings opportunities
 * @param {Array} currentMonthExpenses - Current month expenses
 * @param {Array} previousMonthExpenses - Previous month expenses
 * @param {Array} categories - Categories with metadata
 * @returns {Array} Savings opportunities
 */
export const getSavingsOpportunities = (currentMonthExpenses, previousMonthExpenses, categories) => {
  const opportunities = [];

  // Group current and previous expenses by category
  const currentByCategory = currentMonthExpenses.reduce((acc, exp) => {
    const cat = exp.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + parseFloat(exp.amount || 0);
    return acc;
  }, {});

  const previousByCategory = previousMonthExpenses.reduce((acc, exp) => {
    const cat = exp.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + parseFloat(exp.amount || 0);
    return acc;
  }, {});

  // Find categories with significant increase
  Object.keys(currentByCategory).forEach(categoryName => {
    const current = currentByCategory[categoryName];
    const previous = previousByCategory[categoryName] || 0;

    if (previous > 0) {
      const increase = current - previous;
      const percentageIncrease = (increase / previous) * 100;

      if (percentageIncrease > 20 && increase > 10) { // At least 20% increase and $10+
        const categoryInfo = categories.find(cat => cat.name === categoryName) || {};
        opportunities.push({
          category: categoryName,
          currentSpend: current,
          previousSpend: previous,
          increase,
          percentageIncrease,
          color: categoryInfo.color || '#6B7280',
          icon: categoryInfo.icon || 'TrendingUp'
        });
      }
    }
  });

  // Sort by percentage increase
  return opportunities.sort((a, b) => b.percentageIncrease - a.percentageIncrease).slice(0, 3);
};

/**
 * Calculate daily average spending
 * @param {Array} expenses - Expenses to analyze
 * @returns {Object} Daily spending data
 */
export const calculateDailyAverage = (expenses) => {
  if (!expenses || expenses.length === 0) {
    return {
      average: 0,
      total: 0,
      daysWithExpenses: 0
    };
  }

  const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

  // Get unique days with expenses
  const daysSet = new Set();
  expenses.forEach(exp => {
    const date = new Date(exp.date);
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    daysSet.add(dayKey);
  });

  const daysWithExpenses = daysSet.size;
  const average = daysWithExpenses > 0 ? total / daysWithExpenses : 0;

  return {
    average,
    total,
    daysWithExpenses
  };
};

/**
 * Generate smart recommendations based on insights
 * @param {Object} insights - All calculated insights
 * @returns {Array} Recommendations
 */
export const generateSmartRecommendations = (insights) => {
  const recommendations = [];
  const currency = getCurrentCurrency();

  // Recommendation 1: Month-over-month trend
  if (insights.monthComparison) {
    const { percentageChange, isIncrease, difference } = insights.monthComparison;
    if (Math.abs(percentageChange) > 10) {
      const convertedDiff = convertCurrency(Math.abs(difference), 'USD', currency);
      recommendations.push({
        icon: isIncrease ? 'TrendingUp' : 'TrendingDown',
        color: isIncrease ? '#EF4444' : '#10B981',
        text: `You spent ${formatCurrency(convertedDiff, currency)} ${isIncrease ? 'more' : 'less'} than last month (${Math.abs(percentageChange).toFixed(1)}% ${isIncrease ? 'increase' : 'decrease'})`,
        type: isIncrease ? 'warning' : 'success'
      });
    }
  }

  // Recommendation 2: Budget exceeded
  if (insights.budgetAlerts && insights.budgetAlerts.exceeded.length > 0) {
    const exceededCategory = insights.budgetAlerts.exceeded[0];
    const overspend = exceededCategory.spent - exceededCategory.budget;
    const convertedOverspend = convertCurrency(overspend, 'USD', currency);
    recommendations.push({
      icon: 'AlertTriangle',
      color: '#EF4444',
      text: `You've exceeded your ${exceededCategory.category} budget by ${formatCurrency(convertedOverspend, currency)}`,
      type: 'error'
    });
  }

  // Recommendation 3: Savings opportunity
  if (insights.savingsOpportunities && insights.savingsOpportunities.length > 0) {
    const topOpportunity = insights.savingsOpportunities[0];
    const convertedIncrease = convertCurrency(topOpportunity.increase, 'USD', currency);
    recommendations.push({
      icon: 'Lightbulb',
      color: '#F59E0B',
      text: `Consider reducing ${topOpportunity.category} spending - up ${formatCurrency(convertedIncrease, currency)} from last month`,
      type: 'info'
    });
  }

  // Recommendation 4: Well under budget (positive)
  if (insights.budgetAlerts && insights.budgetAlerts.wellUnder.length > 0) {
    const underCategory = insights.budgetAlerts.wellUnder[0];
    const remaining = underCategory.budget - underCategory.spent;
    const convertedRemaining = convertCurrency(remaining, 'USD', currency);
    recommendations.push({
      icon: 'ThumbsUp',
      color: '#10B981',
      text: `Great job! You have ${formatCurrency(convertedRemaining, currency)} remaining in your ${underCategory.category} budget`,
      type: 'success'
    });
  }

  return recommendations.slice(0, 3); // Return top 3 recommendations
};

/**
 * Generate all financial insights
 * @param {Array} allExpenses - All user expenses
 * @param {Array} categories - Categories with budget data
 * @returns {Object} Complete insights object
 */
export const generateFinancialInsights = (allExpenses, categories) => {
  const currentMonthExpenses = getExpensesByMonth(allExpenses, 0);
  const previousMonthExpenses = getExpensesByMonth(allExpenses, -1);

  const insights = {
    monthComparison: calculateMonthComparison(currentMonthExpenses, previousMonthExpenses),
    topCategories: getTopSpendingCategories(currentMonthExpenses, categories, 3),
    budgetAlerts: getBudgetAlerts(categories, currentMonthExpenses),
    savingsOpportunities: getSavingsOpportunities(currentMonthExpenses, previousMonthExpenses, categories),
    dailyAverage: calculateDailyAverage(currentMonthExpenses)
  };

  // Generate recommendations based on all insights
  insights.recommendations = generateSmartRecommendations(insights);

  return insights;
};
