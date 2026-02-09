import { getMonthlyExpenses, getExpensesByPeriod } from './dataHelpers';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate average for array of numbers
 */
const calculateAverage = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return sum / numbers.length;
};

/**
 * Calculate weighted average with recent values having more weight
 * @param {Array} values - Array of numbers
 * @param {Array} weights - Array of weights (should sum to 1)
 * @returns {number} - Weighted average
 */
const getWeightedAverage = (values, weights) => {
  if (!values || values.length === 0) return 0;
  if (!weights || weights.length !== values.length) {
    return calculateAverage(values);
  }

  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i] * weights[i];
  }
  return sum;
};

/**
 * Calculate trend from historical values
 * @param {Array} values - Array of numbers (oldest first)
 * @returns {Object} - { direction: 'up'|'down'|'stable', rate: number }
 */
const calculateTrend = (values) => {
  if (!values || values.length < 2) {
    return { direction: 'stable', rate: 0 };
  }

  // Simple linear regression
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgValue = sumY / n;
  const rate = avgValue !== 0 ? (slope / avgValue) : 0;

  // Determine direction based on slope
  if (Math.abs(rate) < 0.05) return { direction: 'stable', rate: 0 };
  if (slope > 0) return { direction: 'up', rate: Math.abs(rate) };
  return { direction: 'down', rate: Math.abs(rate) };
};

/**
 * Get period label for display
 * @param {String} period - Period type
 * @returns {String} - Display label
 */
const getPeriodLabel = (period) => {
  switch (period) {
    case 'week': return 'Next Week';
    case 'month': return 'Next Month';
    case 'lastmonth': return 'Next Month';
    case 'quarter': return 'Next Quarter';
    case 'year': return 'Next Year';
    case 'all': return 'Next Month';
    default: return 'Next Month';
  }
};

/**
 * Get last N months of expense data
 * @param {Array} expenses - All expenses
 * @param {number} n - Number of months
 * @param {Function} convertExpenseAmount - Function to convert expense amounts to selected currency
 * @returns {Array} - Array of { month, total, expenses }
 */
const getLastNMonths = (expenses, n, convertExpenseAmount = null) => {
  const result = [];
  const now = new Date();

  for (let i = 0; i < n; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthExpenses = getMonthlyExpenses(expenses, date);
    const total = monthExpenses.reduce((sum, exp) => {
      const amount = convertExpenseAmount
        ? convertExpenseAmount(exp)
        : parseFloat(exp.amount || 0);
      return sum + amount;
    }, 0);
    result.push({ date, total, expenses: monthExpenses });
  }

  return result.reverse(); // Oldest first
};

/**
 * Get last N weeks of expense data
 * @param {Array} expenses - All expenses
 * @param {number} n - Number of weeks
 * @param {Function} convertExpenseAmount - Function to convert expense amounts to selected currency
 * @returns {Array} - Array of { weekStart, total, expenses }
 */
const getLastNWeeks = (expenses, n, convertExpenseAmount = null) => {
  const result = [];
  const now = new Date();

  for (let i = 0; i < n; i++) {
    // Calculate week start (Monday)
    const dayOfWeek = now.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMonday - (i * 7));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= weekStart && expDate <= weekEnd;
    });

    const total = weekExpenses.reduce((sum, exp) => {
      const amount = convertExpenseAmount
        ? convertExpenseAmount(exp)
        : parseFloat(exp.amount || 0);
      return sum + amount;
    }, 0);
    result.push({ weekStart, total, expenses: weekExpenses });
  }

  return result.reverse(); // Oldest first
};

// ============================================================================
// PREDICTION ALGORITHMS
// ============================================================================

/**
 * Predict next period spending based on historical data
 * @param {Array} expenses - All expense data
 * @param {Array} categories - All categories
 * @param {String} selectedPeriod - Current period filter
 * @param {Array} spendingPatterns - Detected spending patterns
 * @param {Function} convertExpenseAmount - Function to convert expense amounts to selected currency
 * @returns {Object} - { estimated, confidence, trend, periodLabel }
 */
export const predictNextPeriodSpending = (expenses, categories, selectedPeriod = 'month', spendingPatterns = [], convertExpenseAmount = null) => {
  if (!expenses || expenses.length === 0) {
    return {
      estimated: 0,
      confidence: 0,
      trend: 'stable',
      periodLabel: getPeriodLabel(selectedPeriod)
    };
  }

  let historicalData = [];
  let prediction = 0;
  let baseConfidence = 20;

  // Get historical data based on period
  switch (selectedPeriod) {
    case 'week': {
      historicalData = getLastNWeeks(expenses, 4, convertExpenseAmount);

      if (historicalData.length >= 2) {
        const values = historicalData.map(w => w.total);

        if (historicalData.length >= 3) {
          // Weighted average: recent weeks have more weight
          const weights = historicalData.length === 3
            ? [0.25, 0.35, 0.40]
            : [0.20, 0.25, 0.30, 0.25];
          prediction = getWeightedAverage(values, weights);
          baseConfidence = 30 + (historicalData.length * 10);
        } else {
          prediction = calculateAverage(values);
          baseConfidence = 35;
        }
      } else {
        // Fallback: use average daily spending * 7
        const allTotal = expenses.reduce((sum, exp) => {
          const amount = convertExpenseAmount
            ? convertExpenseAmount(exp)
            : parseFloat(exp.amount || 0);
          return sum + amount;
        }, 0);
        const days = Math.max(1, Math.ceil((new Date() - new Date(expenses[0].date)) / (1000 * 60 * 60 * 24)));
        prediction = (allTotal / days) * 7;
        baseConfidence = 25;
      }
      break;
    }

    case 'month':
    case 'lastmonth':
    default: {
      historicalData = getLastNMonths(expenses, 6, convertExpenseAmount);

      if (historicalData.length >= 2) {
        const values = historicalData.map(m => m.total);

        if (historicalData.length >= 3) {
          // Weighted average: recent months have more weight
          const weights = historicalData.length === 3
            ? [0.20, 0.30, 0.50]
            : historicalData.length === 4
            ? [0.15, 0.20, 0.30, 0.35]
            : historicalData.length === 5
            ? [0.10, 0.15, 0.20, 0.25, 0.30]
            : [0.10, 0.12, 0.15, 0.18, 0.20, 0.25];

          prediction = getWeightedAverage(values.slice(-Math.min(values.length, 6)), weights.slice(-values.length));
          baseConfidence = Math.min(30 + (historicalData.length * 12), 75);
        } else {
          prediction = calculateAverage(values);
          baseConfidence = 40;
        }
      } else {
        // Fallback: use current month total
        const currentMonth = getMonthlyExpenses(expenses);
        prediction = currentMonth.reduce((sum, exp) => {
          const amount = convertExpenseAmount
            ? convertExpenseAmount(exp)
            : parseFloat(exp.amount || 0);
          return sum + amount;
        }, 0);
        baseConfidence = 30;
      }
      break;
    }

    case 'quarter': {
      historicalData = getLastNMonths(expenses, 9, convertExpenseAmount); // Last 3 quarters

      if (historicalData.length >= 3) {
        // Group by quarters
        const quarters = [];
        for (let i = 0; i < historicalData.length; i += 3) {
          const quarterData = historicalData.slice(i, i + 3);
          const quarterTotal = quarterData.reduce((sum, m) => sum + m.total, 0);
          quarters.push(quarterTotal);
        }

        if (quarters.length >= 2) {
          const weights = quarters.length === 2 ? [0.40, 0.60] : [0.25, 0.35, 0.40];
          prediction = getWeightedAverage(quarters, weights);
          baseConfidence = Math.min(40 + (quarters.length * 15), 75);
        } else {
          prediction = quarters[0];
          baseConfidence = 35;
        }
      } else {
        // Fallback: current quarter * estimate
        const currentQuarter = expenses.filter(exp => {
          const expDate = new Date(exp.date);
          const now = new Date();
          const quarterAgo = new Date(now);
          quarterAgo.setMonth(now.getMonth() - 3);
          return expDate >= quarterAgo;
        });
        prediction = currentQuarter.reduce((sum, exp) => {
          const amount = convertExpenseAmount
            ? convertExpenseAmount(exp)
            : parseFloat(exp.amount || 0);
          return sum + amount;
        }, 0);
        baseConfidence = 30;
      }
      break;
    }

    case 'year':
    case 'all': {
      historicalData = getLastNMonths(expenses, 12, convertExpenseAmount);

      if (historicalData.length >= 6) {
        const values = historicalData.map(m => m.total);
        const recentValues = values.slice(-6); // Last 6 months
        const weights = [0.10, 0.12, 0.15, 0.18, 0.20, 0.25];
        const monthlyAvg = getWeightedAverage(recentValues, weights);
        prediction = monthlyAvg * 12; // Annual prediction
        baseConfidence = Math.min(40 + (historicalData.length * 3), 70);
      } else {
        // Fallback: current year trend
        const yearExpenses = expenses.filter(exp => {
          const expDate = new Date(exp.date);
          const now = new Date();
          return expDate.getFullYear() === now.getFullYear();
        });
        const yearTotal = yearExpenses.reduce((sum, exp) => {
          const amount = convertExpenseAmount
            ? convertExpenseAmount(exp)
            : parseFloat(exp.amount || 0);
          return sum + amount;
        }, 0);
        const monthsElapsed = new Date().getMonth() + 1;
        prediction = (yearTotal / monthsElapsed) * 12;
        baseConfidence = 35;
      }
      break;
    }
  }

  // Calculate trend
  const values = historicalData.map(d => d.total).filter(v => v > 0);
  const trend = calculateTrend(values);

  // Adjust prediction based on trend
  if (trend.direction === 'up') {
    prediction *= (1 + Math.min(trend.rate, 0.15)); // Cap at 15% increase
  } else if (trend.direction === 'down') {
    prediction *= (1 - Math.min(trend.rate, 0.15)); // Cap at 15% decrease
  }

  // Add recurring patterns for next period
  if (spendingPatterns && spendingPatterns.length > 0) {
    const recurringAmount = spendingPatterns.reduce((sum, pattern) => {
      return sum + (pattern.averageAmount || 0);
    }, 0);

    // Add a portion of recurring expenses (they're already partially in historical average)
    prediction += recurringAmount * 0.2; // 20% adjustment
    baseConfidence += 5; // Patterns increase confidence
  }

  // Calculate variance penalty for confidence
  if (values.length >= 2) {
    const avg = calculateAverage(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const coefficientOfVariation = avg !== 0 ? Math.sqrt(variance) / avg : 0;
    const variancePenalty = Math.min(coefficientOfVariation * 25, 30);
    baseConfidence -= variancePenalty;
  }

  // Final confidence (clamped between 20-85%)
  const confidence = Math.round(Math.max(20, Math.min(85, baseConfidence)));

  return {
    estimated: Math.round(prediction),
    confidence,
    trend: trend.direction,
    periodLabel: getPeriodLabel(selectedPeriod)
  };
};

/**
 * Identify savings opportunity based on budget, trends, and patterns
 * @param {Array} expenses - All expense data
 * @param {Array} categories - All categories
 * @param {String} selectedPeriod - Current period filter
 * @param {Array} budgetVariance - Budget variance data
 * @param {Function} convertExpenseAmount - Function to convert expense amounts to selected currency
 * @returns {Object} - { amount, category, reason }
 */
export const identifySavingsOpportunity = (expenses, categories, selectedPeriod = 'month', budgetVariance = [], convertExpenseAmount = null, formatAmount = null) => {
  if (!expenses || expenses.length === 0 || !categories || categories.length === 0) {
    return {
      amount: 0,
      category: 'N/A',
      reason: 'Not enough data to identify savings opportunities'
    };
  }

  // Priority 1: Categories exceeding budget
  if (budgetVariance && budgetVariance.length > 0) {
    const overBudget = budgetVariance
      .filter(v => v.variance > 0)
      .sort((a, b) => b.variance - a.variance);

    if (overBudget.length > 0) {
      const topOverage = overBudget[0];
      // Suggest saving 50-70% of the overage amount
      const savingsAmount = Math.round(topOverage.variance * 0.6);

      return {
        amount: savingsAmount,
        category: topOverage.category,
        reason: `This category exceeded its budget by ${formatAmount ? formatAmount(topOverage.variance) : `$${topOverage.variance}`}. Consider reducing spending here.`
      };
    }
  }

  // Priority 2: Categories with upward trends
  const periodExpenses = getExpensesByPeriod(expenses, selectedPeriod);
  const historicalMonths = getLastNMonths(expenses, 3, convertExpenseAmount);

  if (historicalMonths.length >= 3) {
    const categoryTrends = [];

    categories.forEach(category => {
      const monthlyTotals = historicalMonths.map(month => {
        return month.expenses
          .filter(exp => exp.category === category.name)
          .reduce((sum, exp) => {
            const amount = convertExpenseAmount
              ? convertExpenseAmount(exp)
              : parseFloat(exp.amount || 0);
            return sum + amount;
          }, 0);
      });

      if (monthlyTotals.some(t => t > 0)) {
        const trend = calculateTrend(monthlyTotals);

        if (trend.direction === 'up' && trend.rate > 0.1) {
          const currentTotal = monthlyTotals[monthlyTotals.length - 1];
          const increase = currentTotal * trend.rate;
          categoryTrends.push({
            category: category.name,
            increase,
            currentTotal,
            rate: trend.rate
          });
        }
      }
    });

    if (categoryTrends.length > 0) {
      categoryTrends.sort((a, b) => b.increase - a.increase);
      const topTrend = categoryTrends[0];
      const savingsAmount = Math.round(topTrend.increase * 0.5);

      return {
        amount: savingsAmount,
        category: topTrend.category,
        reason: `Spending on ${topTrend.category} has increased by ${Math.round(topTrend.rate * 100)}% over recent months.`
      };
    }
  }

  // Priority 3: Highest spending category
  const categoryTotals = {};
  periodExpenses.forEach(exp => {
    const category = exp.category || 'Other';
    const amount = convertExpenseAmount
      ? convertExpenseAmount(exp)
      : parseFloat(exp.amount || 0);
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, total]) => total > 0);

  if (sortedCategories.length > 0) {
    const [topCategory, topTotal] = sortedCategories[0];
    const savingsAmount = Math.round(topTotal * 0.10); // 10% savings goal

    return {
      amount: savingsAmount,
      category: topCategory,
      reason: `${topCategory} is your highest spending category. Even a small reduction can lead to significant savings.`
    };
  }

  // Fallback
  return {
    amount: 0,
    category: 'N/A',
    reason: 'Not enough data to identify savings opportunities'
  };
};
