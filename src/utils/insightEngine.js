import { getMonthlyExpenses, getCategoryStats, isSameMonth, getExpensesByPeriod } from './dataHelpers';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format currency amount using provided formatter or fallback to $
 * @param {number} amount - Amount to format
 * @param {Function} formatter - Optional formatAmount function from useCurrency
 * @returns {string} - Formatted currency string
 */
const formatCurrency = (amount, formatter) => {
  if (formatter) return formatter(amount);
  return `$${Number(amount).toFixed(0)}`;
};

/**
 * Calculate average for array of numbers
 */
const calculateAverage = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return sum / numbers.length;
};

/**
 * Get expenses from previous month
 */
const getPreviousMonthExpenses = (allExpenses) => {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  return getMonthlyExpenses(allExpenses, lastMonth);
};

/**
 * Get expenses from last N months
 */
const getLastNMonthsExpenses = (allExpenses, n, convertExpenseAmount = null) => {
  const result = [];
  for (let i = 0; i < n; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthExpenses = getMonthlyExpenses(allExpenses, date);
    const total = monthExpenses.reduce((sum, exp) => {
      const amount = convertExpenseAmount
        ? convertExpenseAmount(exp)
        : parseFloat(exp.amount || 0);
      return sum + amount;
    }, 0);
    result.push({ date, total, expenses: monthExpenses });
  }
  return result.reverse();
};

/**
 * Get expenses from previous period based on selected period
 * @param {Array} allExpenses - All expenses
 * @param {String} selectedPeriod - Current period filter
 * @returns {Array} - Expenses from the previous equivalent period
 */
const getPreviousPeriodExpenses = (allExpenses, selectedPeriod) => {
  const now = new Date();
  let startDate, endDate;

  switch (selectedPeriod) {
    case 'week': {
      // Previous week (7-14 days ago)
      const dayOfWeek = now.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      startDate = new Date(now);
      startDate.setDate(now.getDate() - daysFromMonday - 14); // 2 weeks ago Monday
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // 2 weeks ago Sunday
      endDate.setHours(23, 59, 59, 999);
      break;
    }

    case 'month':
    case 'lastmonth':
    default: {
      // Previous month
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    }

    case 'quarter': {
      // Previous quarter
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const previousQuarterStartMonth = (currentQuarter - 1) * 3;

      if (previousQuarterStartMonth < 0) {
        // Previous year's Q4
        startDate = new Date(now.getFullYear() - 1, 9, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      } else {
        startDate = new Date(now.getFullYear(), previousQuarterStartMonth, 1);
        endDate = new Date(now.getFullYear(), previousQuarterStartMonth + 3, 0, 23, 59, 59, 999);
      }
      break;
    }

    case 'year': {
      // Previous year
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    }

    case 'all': {
      // For "all time", there's no previous period - return empty
      return [];
    }
  }

  return allExpenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate >= startDate && expDate <= endDate;
  });
};

/**
 * Check if expense is on weekend
 */
const isWeekend = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

/**
 * Get day of week name
 */
const getDayName = (dayNumber) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber];
};

/**
 * Get period label for descriptions
 */
const getPeriodLabel = (period) => {
  switch (period) {
    case 'week': return 'this week';
    case 'month': return 'this month';
    case 'lastmonth': return 'last month';
    case 'quarter': return 'this quarter';
    case 'year': return 'this year';
    case 'all': return 'overall';
    default: return 'this period';
  }
};

// ============================================================================
// INSIGHT GENERATORS
// ============================================================================

/**
 * 1. Category Overspending
 * Detects categories spending significantly more than average or budget
 */
const generateCategoryOverspendingInsights = (expenses, categories, selectedPeriod = 'month', convertExpenseAmount = null, formatAmount = null) => {
  const insights = [];
  const currentPeriodExpenses = getExpensesByPeriod(expenses, selectedPeriod);
  const previousPeriodExpenses = getPreviousPeriodExpenses(expenses, selectedPeriod);

  // Skip insights if no previous period data
  if (previousPeriodExpenses.length === 0) {
    // Still check budget overages even without historical comparison
    categories.forEach(category => {
      const currentSpent = currentPeriodExpenses
        .filter(exp => exp.category === category.name)
        .reduce((sum, exp) => {
          const amount = convertExpenseAmount
            ? convertExpenseAmount(exp)
            : parseFloat(exp.amount || 0);
          return sum + amount;
        }, 0);

      // Check if over budget
      if (category.budget > 0 && currentSpent > category.budget) {
        const overAmount = Number(currentSpent - category.budget) || 0;
        const percentOver = Number(((overAmount / category.budget) * 100)).toFixed(0);

        insights.push({
          id: `budget-exceeded-${category.name}`,
          type: 'warning',
          title: `${category.name} Budget Exceeded`,
          badge: `+${Number(percentOver)}%`,
          description: `You've spent ${formatCurrency(currentSpent, formatAmount)} out of your ${formatCurrency(category.budget, formatAmount)} budget, exceeding it by ${formatCurrency(overAmount, formatAmount)}.`,
          recommendation: `Review your ${category.name} expenses and consider adjusting your budget or cutting back next ${selectedPeriod}.`,
          icon: category.icon || 'AlertTriangle',
          priority: 'high',
          score: Math.min(90, 60 + parseFloat(percentOver))
        });
      }
    });

    return insights;
  }

  categories.forEach(category => {
    const currentSpent = currentPeriodExpenses
      .filter(exp => exp.category === category.name)
      .reduce((sum, exp) => {
        const amount = convertExpenseAmount
          ? convertExpenseAmount(exp)
          : parseFloat(exp.amount || 0);
        return sum + amount;
      }, 0);

    const previousSpent = previousPeriodExpenses
      .filter(exp => exp.category === category.name)
      .reduce((sum, exp) => {
        const amount = convertExpenseAmount
          ? convertExpenseAmount(exp)
          : parseFloat(exp.amount || 0);
        return sum + amount;
      }, 0);

    // Check if significantly over previous period (>20%)
    if (currentSpent > 0 && previousSpent > 0) {
      const percentIncrease = ((currentSpent - previousSpent) / previousSpent) * 100;

      if (percentIncrease > 20) {
        // Analyze weekend contribution
        const weekendExpenses = currentPeriodExpenses.filter(
          exp => exp.category === category.name && isWeekend(exp.date)
        );
        const weekendTotal = weekendExpenses.reduce((sum, exp) => {
          const amount = convertExpenseAmount
            ? convertExpenseAmount(exp)
            : parseFloat(exp.amount || 0);
          return sum + amount;
        }, 0);
        const weekendPercent = (weekendTotal / currentSpent) * 100;

        const overspendAmount = Number(currentSpent - previousSpent) || 0;

        const periodLabel = getPeriodLabel(selectedPeriod);
        const previousPeriodLabel = selectedPeriod === 'week' ? 'last week' :
                                    selectedPeriod === 'month' ? 'last month' :
                                    selectedPeriod === 'quarter' ? 'last quarter' :
                                    selectedPeriod === 'year' ? 'last year' : 'the previous period';

        let description = `You spent ${percentIncrease.toFixed(0)}% more on ${category.name} ${periodLabel} compared to ${previousPeriodLabel}.`;
        if (weekendPercent > 50) {
          description += ` Weekend spending contributed to ${weekendPercent.toFixed(0)}% of the increase.`;
        }

        insights.push({
          id: `overspending-${category.name}`,
          type: 'warning',
          title: `${category.name} Overspending`,
          badge: `+${formatCurrency(overspendAmount, formatAmount)}`,
          description,
          recommendation: `Consider ${category.name === 'Food & Dining' ? 'meal planning and cooking at home more often. Set a weekly dining out budget' : `setting a stricter budget for ${category.name} or finding alternatives`}.`,
          icon: category.icon || 'TrendingUp',
          priority: 'high',
          score: Math.min(95, 70 + percentIncrease) // Higher percentage = higher score
        });
      }
    }

    // Check if over budget
    if (category.budget > 0 && currentSpent > category.budget) {
      const overAmount = Number(currentSpent - category.budget) || 0;
      const percentOver = Number(((overAmount / category.budget) * 100)).toFixed(0);

      insights.push({
        id: `budget-exceeded-${category.name}`,
        type: 'warning',
        title: `${category.name} Budget Exceeded`,
        badge: `+${Number(percentOver)}%`,
        description: `You've spent ${formatCurrency(currentSpent, formatAmount)} out of your ${formatCurrency(category.budget, formatAmount)} budget, exceeding it by ${formatCurrency(overAmount, formatAmount)}.`,
        recommendation: `Review your ${category.name} expenses and consider adjusting your budget or cutting back next month.`,
        icon: category.icon || 'AlertTriangle',
        priority: 'high',
        score: Math.min(90, 60 + parseFloat(percentOver))
      });
    }
  });

  return insights;
};

/**
 * 2. Category Savings
 * Detects categories with significant savings compared to previous period
 */
const generateCategorySavingsInsights = (expenses, categories, selectedPeriod = 'month', convertExpenseAmount = null, formatAmount = null) => {
  const insights = [];
  const currentPeriodExpenses = getExpensesByPeriod(expenses, selectedPeriod);
  const previousPeriodExpenses = getPreviousPeriodExpenses(expenses, selectedPeriod);

  // Skip if no previous period data
  if (previousPeriodExpenses.length === 0) {
    return insights;
  }

  categories.forEach(category => {
    const currentSpent = currentPeriodExpenses
      .filter(exp => exp.category === category.name)
      .reduce((sum, exp) => {
        const amount = convertExpenseAmount
          ? convertExpenseAmount(exp)
          : parseFloat(exp.amount || 0);
        return sum + amount;
      }, 0);

    const previousSpent = previousPeriodExpenses
      .filter(exp => exp.category === category.name)
      .reduce((sum, exp) => {
        const amount = convertExpenseAmount
          ? convertExpenseAmount(exp)
          : parseFloat(exp.amount || 0);
        return sum + amount;
      }, 0);

    if (previousSpent > 0 && currentSpent < previousSpent) {
      const savedAmount = previousSpent - currentSpent;
      const percentDecrease = ((savedAmount / previousSpent) * 100);

      // Only show if savings are significant (>15% or >$50)
      if (percentDecrease > 15 || savedAmount > 50) {
        const periodLabel = getPeriodLabel(selectedPeriod);
        const previousPeriodLabel = selectedPeriod === 'week' ? 'last week' :
                                    selectedPeriod === 'month' ? 'last month' :
                                    selectedPeriod === 'quarter' ? 'last quarter' :
                                    selectedPeriod === 'year' ? 'last year' : 'the previous period';

        insights.push({
          id: `savings-${category.name}`,
          type: 'success',
          title: `${category.name} Savings`,
          badge: `-${formatCurrency(savedAmount, formatAmount)}`,
          description: `Great job! You saved ${formatCurrency(savedAmount, formatAmount)} on ${category.name} ${periodLabel} ${category.name === 'Transportation' ? 'by using public transit more frequently' : `compared to ${previousPeriodLabel}`}.`,
          recommendation: `Continue ${category.name === 'Transportation' ? 'using public transit. Consider a monthly pass for additional savings' : `your current spending habits in ${category.name}`}.`,
          icon: category.icon || 'TrendingDown',
          priority: 'medium',
          score: Math.min(85, 50 + percentDecrease)
        });
      }
    }
  });

  return insights;
};

/**
 * 3. Weekend Spending Spike
 * Detects if weekend spending is significantly higher than weekday
 */
const generateWeekendSpikeInsight = (expenses, selectedPeriod = 'month', convertExpenseAmount = null, formatAmount = null) => {
  const currentPeriodExpenses = getExpensesByPeriod(expenses, selectedPeriod);

  if (currentPeriodExpenses.length === 0) return [];

  const weekendExpenses = currentPeriodExpenses.filter(exp => isWeekend(exp.date));
  const weekdayExpenses = currentPeriodExpenses.filter(exp => !isWeekend(exp.date));

  const weekendTotal = weekendExpenses.reduce((sum, exp) => {
    const amount = convertExpenseAmount
      ? convertExpenseAmount(exp)
      : parseFloat(exp.amount || 0);
    return sum + amount;
  }, 0);
  const weekdayTotal = weekdayExpenses.reduce((sum, exp) => {
    const amount = convertExpenseAmount
      ? convertExpenseAmount(exp)
      : parseFloat(exp.amount || 0);
    return sum + amount;
  }, 0);

  // Count unique weekend days and weekdays
  const weekendDays = [...new Set(weekendExpenses.map(exp => exp.date.split('T')[0]))].length || 1;
  const weekdayDays = [...new Set(weekdayExpenses.map(exp => exp.date.split('T')[0]))].length || 1;

  const avgWeekendDaily = weekendTotal / weekendDays;
  const avgWeekdayDaily = weekdayTotal / weekdayDays;

  if (avgWeekdayDaily > 0) {
    const ratio = avgWeekendDaily / avgWeekdayDaily;

    if (ratio >= 2) {
      // Find top categories for weekend
      const categoryTotals = {};
      weekendExpenses.forEach(exp => {
        const amount = convertExpenseAmount
          ? convertExpenseAmount(exp)
          : parseFloat(exp.amount || 0);
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amount;
      });
      const topCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([cat]) => cat);

      return [{
        id: 'weekend-spike',
        type: 'info',
        title: 'Weekend Spending Spike',
        badge: `${Number(ratio).toFixed(1)}x higher`,
        description: `Your weekend expenses are ${Number(ratio).toFixed(1)}x higher than weekdays, primarily in ${topCategories.join(' and ')} categories.`,
        recommendation: `Plan weekend activities in advance and set a weekend spending limit of ${formatCurrency(avgWeekdayDaily * 1.5, formatAmount)}.`,
        icon: 'Calendar',
        priority: 'medium',
        score: Math.min(80, 40 + (ratio * 10))
      }];
    }
  }

  return [];
};

/**
 * 4. Budget Performance Overall
 * Shows overall budget performance across all categories
 */
const generateBudgetPerformanceInsight = (expenses, categories, selectedPeriod = 'month', convertExpenseAmount = null, formatAmount = null) => {
  const currentPeriodExpenses = getExpensesByPeriod(expenses, selectedPeriod);

  const categoriesWithBudget = categories.filter(cat => cat.budget > 0);
  if (categoriesWithBudget.length === 0) return [];

  let totalBudget = 0;
  let totalSpent = 0;
  let underBudgetCount = 0;

  categoriesWithBudget.forEach(category => {
    const spent = currentPeriodExpenses
      .filter(exp => exp.category === category.name)
      .reduce((sum, exp) => {
        const amount = convertExpenseAmount
          ? convertExpenseAmount(exp)
          : parseFloat(exp.amount || 0);
        return sum + amount;
      }, 0);

    totalBudget += category.budget;
    totalSpent += spent;

    if (spent <= category.budget) {
      underBudgetCount++;
    }
  });

  if (totalSpent < totalBudget) {
    const savedAmount = totalBudget - totalSpent;
    const percentUnder = ((savedAmount / totalBudget) * 100).toFixed(0);

    // Check if this is best performance
    const last6Months = getLastNMonthsExpenses(expenses, 6, convertExpenseAmount);
    const performanceScores = last6Months.map(month => {
      let monthSpent = 0;
      categoriesWithBudget.forEach(category => {
        const catSpent = month.expenses
          .filter(exp => exp.category === category.name)
          .reduce((sum, exp) => {
            const amount = convertExpenseAmount
              ? convertExpenseAmount(exp)
              : parseFloat(exp.amount || 0);
            return sum + amount;
          }, 0);
        monthSpent += catSpent;
      });
      return totalBudget - monthSpent;
    });

    const isBestPerformance = savedAmount >= Math.max(...performanceScores);

    const periodLabel = getPeriodLabel(selectedPeriod);
    return [{
      id: 'budget-performance',
      type: 'success',
      title: 'Budget Performance',
      badge: `-${percentUnder}%`,
      description: `You are ${percentUnder}% under budget ${periodLabel} across all categories. ${isBestPerformance ? 'This is your best performance in 6 months.' : `You're staying under budget in ${underBudgetCount} out of ${categoriesWithBudget.length} categories.`}`,
      recommendation: isBestPerformance
        ? 'Consider allocating the saved amount to your emergency fund or investments.'
        : 'Keep up the good work! Consider reallocating unused budget to categories that need it.',
      icon: 'Target',
      priority: 'medium',
      score: 75 + parseInt(percentUnder) / 2
    }];
  }

  return [];
};

/**
 * 5. Unusual Transaction Detection
 * Detects single transactions that are unusually large
 */
const generateUnusualTransactionInsight = (expenses, selectedPeriod = 'month', convertExpenseAmount = null, formatAmount = null) => {
  const currentPeriodExpenses = getExpensesByPeriod(expenses, selectedPeriod);

  if (currentPeriodExpenses.length < 5) return [];

  const expensesWithAmounts = currentPeriodExpenses.map(exp => ({
    expense: exp,
    convertedAmount: convertExpenseAmount
      ? convertExpenseAmount(exp)
      : parseFloat(exp.amount || 0)
  }));

  const amounts = expensesWithAmounts.map(item => item.convertedAmount);
  const avgAmount = calculateAverage(amounts);
  const maxAmount = Math.max(...amounts);

  // Find the unusual transaction
  const unusualItem = expensesWithAmounts.find(
    item => item.convertedAmount === maxAmount
  );
  const unusualTransaction = unusualItem ? unusualItem.expense : null;

  if (maxAmount > avgAmount * 3 && unusualTransaction) {
    return [{
      id: 'unusual-transaction',
      type: 'info',
      title: 'Unusual Transaction Detected',
      badge: formatCurrency(maxAmount, formatAmount),
      description: `A large transaction of ${formatCurrency(maxAmount, formatAmount)} in ${unusualTransaction.category} was ${(maxAmount / avgAmount).toFixed(1)}x your average transaction amount.`,
      recommendation: 'Review this transaction to ensure it was planned and necessary.',
      icon: 'AlertCircle',
      priority: 'low',
      score: 60
    }];
  }

  return [];
};

/**
 * 6. Budget Alert (Projected to Exceed)
 * Warns if current spending rate will exceed budget
 */
const generateBudgetAlertInsight = (expenses, categories, selectedPeriod = 'month', convertExpenseAmount = null, formatAmount = null) => {
  const now = new Date();
  const currentPeriodExpenses = getExpensesByPeriod(expenses, selectedPeriod);
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - currentDay;

  const insights = [];

  categories.filter(cat => cat.budget > 0).forEach(category => {
    const spent = currentPeriodExpenses
      .filter(exp => exp.category === category.name)
      .reduce((sum, exp) => {
        const amount = convertExpenseAmount
          ? convertExpenseAmount(exp)
          : parseFloat(exp.amount || 0);
        return sum + amount;
      }, 0);

    const percentUsed = (spent / category.budget) * 100;
    const percentTimeElapsed = (currentDay / daysInMonth) * 100;

    // Alert if spending is ahead of time (used >70% with >25% of month remaining)
    if (percentUsed >= 70 && percentUsed < 100 && daysRemaining > daysInMonth * 0.25) {
      const dailyRate = spent / currentDay;
      const projected = dailyRate * daysInMonth;
      const projectedOver = projected - category.budget;

      if (projectedOver > 0) {
        insights.push({
          id: `budget-alert-${category.name}`,
          type: 'warning',
          title: `${category.name} Budget Alert`,
          badge: `${percentUsed.toFixed(0)}% used`,
          description: `You've spent ${formatCurrency(spent, formatAmount)} of your ${formatCurrency(category.budget, formatAmount)} budget with ${daysRemaining} days left. At this rate, you'll exceed budget by ${formatCurrency(projectedOver, formatAmount)}.`,
          recommendation: `Reduce daily ${category.name} spending to ${formatCurrency((category.budget - spent) / daysRemaining, formatAmount)} to stay on track.`,
          icon: category.icon || 'AlertTriangle',
          priority: 'high',
          score: 85
        });
      }
    }
  });

  return insights;
};

/**
 * 7. Category Trend Analysis
 * Detects categories with consistent increase/decrease over 3 months
 */
const generateCategoryTrendInsight = (expenses, categories, selectedPeriod = 'month', convertExpenseAmount = null, formatAmount = null) => {
  const last3Months = getLastNMonthsExpenses(expenses, 3, convertExpenseAmount);

  if (last3Months.length < 3) return [];

  const insights = [];

  categories.forEach(category => {
    const monthlyTotals = last3Months.map(month =>
      month.expenses
        .filter(exp => exp.category === category.name)
        .reduce((sum, exp) => {
          const amount = convertExpenseAmount
            ? convertExpenseAmount(exp)
            : parseFloat(exp.amount || 0);
          return sum + amount;
        }, 0)
    );

    // Check for consistent trend (each month higher than previous)
    const isIncreasing = monthlyTotals[1] > monthlyTotals[0] && monthlyTotals[2] > monthlyTotals[1];
    const isDecreasing = monthlyTotals[1] < monthlyTotals[0] && monthlyTotals[2] < monthlyTotals[1];

    if (isIncreasing && monthlyTotals[0] > 0) {
      const totalIncrease = monthlyTotals[2] - monthlyTotals[0];
      const percentIncrease = ((totalIncrease / monthlyTotals[0]) * 100).toFixed(0);

      if (parseFloat(percentIncrease) > 30) {
        insights.push({
          id: `trend-increase-${category.name}`,
          type: 'warning',
          title: `${category.name} Trending Up`,
          badge: `+${percentIncrease}%`,
          description: `Your ${category.name} spending has increased for 3 consecutive months, up ${percentIncrease}% overall.`,
          recommendation: `Identify the cause of this trend and consider ways to stabilize or reduce ${category.name} expenses.`,
          icon: category.icon || 'TrendingUp',
          priority: 'medium',
          score: 70
        });
      }
    } else if (isDecreasing && monthlyTotals[0] > 0) {
      const totalDecrease = monthlyTotals[0] - monthlyTotals[2];
      const percentDecrease = ((totalDecrease / monthlyTotals[0]) * 100).toFixed(0);

      if (parseFloat(percentDecrease) > 20) {
        insights.push({
          id: `trend-decrease-${category.name}`,
          type: 'success',
          title: `${category.name} Trending Down`,
          badge: `-${percentDecrease}%`,
          description: `Excellent! Your ${category.name} spending has decreased for 3 consecutive months, down ${percentDecrease}% overall.`,
          recommendation: `Keep up this positive trend! Consider what habits led to this improvement.`,
          icon: category.icon || 'TrendingDown',
          priority: 'low',
          score: 65
        });
      }
    }
  });

  return insights;
};

/**
 * 8. Day of Week Pattern
 * Identifies most/least expensive days of week
 */
const generateDayPatternInsight = (expenses, selectedPeriod = 'month', convertExpenseAmount = null, formatAmount = null) => {
  const currentPeriodExpenses = getExpensesByPeriod(expenses, selectedPeriod);

  if (currentPeriodExpenses.length < 10) return [];

  const dayTotals = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const dayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  currentPeriodExpenses.forEach(exp => {
    const day = new Date(exp.date).getDay();
    const amount = convertExpenseAmount
      ? convertExpenseAmount(exp)
      : parseFloat(exp.amount || 0);
    dayTotals[day] += amount;
    dayCounts[day]++;
  });

  const dayAverages = {};
  Object.keys(dayTotals).forEach(day => {
    dayAverages[day] = dayCounts[day] > 0 ? dayTotals[day] / dayCounts[day] : 0;
  });

  const maxDay = Object.entries(dayAverages).reduce((a, b) => a[1] > b[1] ? a : b);
  const minDay = Object.entries(dayAverages).reduce((a, b) => a[1] < b[1] && b[1] > 0 ? a : b);

  const ratio = maxDay[1] / minDay[1];

  if (ratio >= 2) {
    return [{
      id: 'day-pattern',
      type: 'info',
      title: 'Daily Spending Pattern',
      badge: `${getDayName(parseInt(maxDay[0]))}`,
      description: `${getDayName(parseInt(maxDay[0]))} is your most expensive day (avg ${formatCurrency(maxDay[1], formatAmount)}), while ${getDayName(parseInt(minDay[0]))} is your cheapest (avg ${formatCurrency(minDay[1], formatAmount)}).`,
      recommendation: `Be mindful of ${getDayName(parseInt(maxDay[0]))} spending habits and try to match your ${getDayName(parseInt(minDay[0]))} discipline.`,
      icon: 'Calendar',
      priority: 'low',
      score: 55
    }];
  }

  return [];
};

/**
 * 9. Month Comparison
 * Compares current month to previous month
 */
const generateMonthComparisonInsight = (expenses, selectedPeriod = 'month', convertExpenseAmount = null, formatAmount = null) => {
  const currentPeriodExpenses = getExpensesByPeriod(expenses, selectedPeriod);
  const previousPeriodExpenses = getPreviousPeriodExpenses(expenses, selectedPeriod);

  if (previousPeriodExpenses.length === 0) return [];

  const currentTotal = currentPeriodExpenses.reduce((sum, exp) => {
    const amount = convertExpenseAmount
      ? convertExpenseAmount(exp)
      : parseFloat(exp.amount || 0);
    return sum + amount;
  }, 0);
  const previousTotal = previousPeriodExpenses.reduce((sum, exp) => {
    const amount = convertExpenseAmount
      ? convertExpenseAmount(exp)
      : parseFloat(exp.amount || 0);
    return sum + amount;
  }, 0);

  const difference = currentTotal - previousTotal;
  const percentChange = ((difference / previousTotal) * 100).toFixed(0);

  if (Math.abs(difference) > 100) {
    const periodLabel = getPeriodLabel(selectedPeriod);
    const previousPeriodLabel = selectedPeriod === 'week' ? 'last week' :
                                selectedPeriod === 'month' ? 'last month' :
                                selectedPeriod === 'quarter' ? 'last quarter' :
                                selectedPeriod === 'year' ? 'last year' : 'the previous period';

    if (difference > 0) {
      // Find categories with biggest increases
      const categoryChanges = {};
      currentPeriodExpenses.forEach(exp => {
        const currentCat = currentPeriodExpenses
          .filter(e => e.category === exp.category)
          .reduce((sum, e) => {
            const amount = convertExpenseAmount
              ? convertExpenseAmount(e)
              : parseFloat(e.amount || 0);
            return sum + amount;
          }, 0);
        const previousCat = previousPeriodExpenses
          .filter(e => e.category === exp.category)
          .reduce((sum, e) => {
            const amount = convertExpenseAmount
              ? convertExpenseAmount(e)
              : parseFloat(e.amount || 0);
            return sum + amount;
          }, 0);
        categoryChanges[exp.category] = currentCat - previousCat;
      });

      const topIncreases = Object.entries(categoryChanges)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .filter(([cat, change]) => change > 0)
        .map(([cat, change]) => `${cat} (+${formatCurrency(change, formatAmount)})`);

      return [{
        id: 'period-comparison-increase',
        type: 'warning',
        title: 'Spending Increase',
        badge: `+${percentChange}%`,
        description: `Your spending increased by ${percentChange}% ${periodLabel} compared to ${previousPeriodLabel} (${formatCurrency(currentTotal, formatAmount)} vs ${formatCurrency(previousTotal, formatAmount)}). ${topIncreases.length > 0 ? `Main increases: ${topIncreases.join(', ')}.` : ''}`,
        recommendation: 'Review these increases and identify which were one-time expenses vs ongoing patterns.',
        icon: 'TrendingUp',
        priority: 'medium',
        score: 70
      }];
    } else {
      return [{
        id: 'period-comparison-decrease',
        type: 'success',
        title: 'Spending Decrease',
        badge: `-${Math.abs(parseFloat(percentChange))}%`,
        description: `Great job! Your spending decreased by ${Math.abs(parseFloat(percentChange))}% ${periodLabel} compared to ${previousPeriodLabel} (${formatCurrency(currentTotal, formatAmount)} vs ${formatCurrency(previousTotal, formatAmount)}).`,
        recommendation: 'Keep up these good spending habits and consider what changes led to this improvement.',
        icon: 'TrendingDown',
        priority: 'low',
        score: 65
      }];
    }
  }

  return [];
};

/**
 * 10. Top Category Insight
 * Highlights the category taking up the most budget
 */
const generateTopCategoryInsight = (expenses, categories, selectedPeriod = 'month', convertExpenseAmount = null, formatAmount = null) => {
  const currentPeriodExpenses = getExpensesByPeriod(expenses, selectedPeriod);

  if (currentPeriodExpenses.length === 0) return [];

  const categoryTotals = {};
  let totalSpent = 0;

  currentPeriodExpenses.forEach(exp => {
    const amount = convertExpenseAmount
      ? convertExpenseAmount(exp)
      : parseFloat(exp.amount || 0);
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amount;
    totalSpent += amount;
  });

  const topCategory = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])[0];

  if (topCategory && totalSpent > 0) {
    const [catName, catTotal] = topCategory;
    const percentage = ((catTotal / totalSpent) * 100).toFixed(0);

    if (parseFloat(percentage) >= 30) {
      const category = categories.find(c => c.name === catName) || {};
      const periodLabel = getPeriodLabel(selectedPeriod);

      return [{
        id: 'top-category',
        type: 'info',
        title: `${catName} Dominates Spending`,
        badge: `${percentage}%`,
        description: `${catName} represents ${percentage}% of your total spending ${periodLabel} (${formatCurrency(catTotal, formatAmount)} of ${formatCurrency(totalSpent, formatAmount)}).`,
        recommendation: `Since ${catName} is your largest expense, focus optimization efforts here for maximum impact.`,
        icon: category.icon || 'PieChart',
        priority: 'low',
        score: 60
      }];
    }
  }

  return [];
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generate Key Insights - Returns top 4 most relevant insights
 * @param {Array} expenses - All expense data
 * @param {Array} categories - All categories with budgets
 * @param {String} selectedPeriod - Time period: 'week', 'month', 'quarter', 'year', or 'all'
 * @param {Function} convertExpenseAmount - Function to convert expense amounts to selected currency
 * @returns {Array} Top 4 insights sorted by priority/score
 */
export const generateKeyInsights = (expenses, categories, selectedPeriod = 'month', convertExpenseAmount = null, formatAmount = null) => {
  if (!expenses || expenses.length === 0) {
    return [];
  }

  // Generate all possible insights with selectedPeriod parameter
  const allInsights = [
    ...generateCategoryOverspendingInsights(expenses, categories, selectedPeriod, convertExpenseAmount, formatAmount),
    ...generateCategorySavingsInsights(expenses, categories, selectedPeriod, convertExpenseAmount, formatAmount),
    ...generateWeekendSpikeInsight(expenses, selectedPeriod, convertExpenseAmount, formatAmount),
    ...generateBudgetPerformanceInsight(expenses, categories, selectedPeriod, convertExpenseAmount, formatAmount),
    ...generateUnusualTransactionInsight(expenses, selectedPeriod, convertExpenseAmount, formatAmount),
    ...generateBudgetAlertInsight(expenses, categories, selectedPeriod, convertExpenseAmount, formatAmount),
    ...generateCategoryTrendInsight(expenses, categories, selectedPeriod, convertExpenseAmount, formatAmount),
    ...generateDayPatternInsight(expenses, selectedPeriod, convertExpenseAmount, formatAmount),
    ...generateMonthComparisonInsight(expenses, selectedPeriod, convertExpenseAmount, formatAmount),
    ...generateTopCategoryInsight(expenses, categories, selectedPeriod, convertExpenseAmount, formatAmount)
  ];

  // Remove duplicates by id
  const uniqueInsights = allInsights.filter((insight, index, self) =>
    index === self.findIndex(t => t.id === insight.id)
  );

  // Sort by priority and score
  const priorityMap = { high: 3, medium: 2, low: 1 };
  uniqueInsights.sort((a, b) => {
    // First by priority
    const priorityDiff = priorityMap[b.priority] - priorityMap[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    // Then by score
    return b.score - a.score;
  });

  // Return all insights (sorted by priority and score)
  return uniqueInsights;
};

// ============================================================================
// SPENDING PATTERNS DETECTION
// ============================================================================

/**
 * Format a date for pattern prediction display
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
const formatPredictedDate = (date) => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const dateStr = date.toDateString();
  const tomorrowStr = tomorrow.toDateString();
  const nowStr = now.toDateString();

  if (dateStr === nowStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';

  // Check if within this week
  const daysUntil = Math.round((date - now) / (1000 * 60 * 60 * 24));
  if (daysUntil >= 0 && daysUntil <= 7) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  // Otherwise return formatted date
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

/**
 * Determine frequency label from average interval (in days)
 * @param {number} avgInterval - Average days between occurrences
 * @returns {string} - Frequency label
 */
const getFrequencyLabel = (avgInterval) => {
  if (avgInterval <= 2) return 'Daily';
  if (avgInterval >= 6 && avgInterval <= 8) return 'Weekly';
  if (avgInterval >= 13 && avgInterval <= 15) return 'Bi-weekly';
  if (avgInterval >= 28 && avgInterval <= 32) return 'Monthly';
  if (avgInterval > 32 && avgInterval <= 45) return 'Monthly';
  return null; // Not a recognized pattern
};

/**
 * Calculate days between two date strings
 * @param {string} date1 - First date
 * @param {string} date2 - Second date
 * @returns {number} - Days difference
 */
const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Detect recurring spending patterns in expenses
 * @param {Array} expenses - All expense data
 * @param {String} selectedPeriod - Current time period filter
 * @param {Function} convertExpenseAmount - Function to convert expense amounts to selected currency
 * @returns {Array} - Array of detected spending patterns
 */
export const detectSpendingPatterns = (expenses, selectedPeriod = 'month', convertExpenseAmount = null) => {
  if (!expenses || expenses.length < 2) return [];

  const patterns = [];

  // Group expenses by category
  const expensesByCategory = {};
  expenses.forEach(exp => {
    const category = exp.category || 'Other';
    if (!expensesByCategory[category]) {
      expensesByCategory[category] = [];
    }
    expensesByCategory[category].push(exp);
  });

  // Analyze each category for patterns
  Object.entries(expensesByCategory).forEach(([category, categoryExpenses]) => {
    if (categoryExpenses.length < 2) return; // Need at least 2 occurrences

    // Sort by date
    const sorted = [...categoryExpenses].sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    // Group by similar amounts (±15% tolerance)
    const amountGroups = [];
    sorted.forEach(exp => {
      const amount = convertExpenseAmount
        ? convertExpenseAmount(exp)
        : parseFloat(exp.amount || 0);

      // Find existing group with similar amount
      let foundGroup = amountGroups.find(group => {
        const groupAvg = calculateAverage(group.map(e => {
          return convertExpenseAmount
            ? convertExpenseAmount(e)
            : parseFloat(e.amount || 0);
        }));
        const tolerance = groupAvg * 0.15;
        return Math.abs(amount - groupAvg) <= tolerance;
      });

      if (foundGroup) {
        foundGroup.push(exp);
      } else {
        amountGroups.push([exp]);
      }
    });

    // Analyze each amount group for recurring patterns
    amountGroups.forEach(group => {
      if (group.length < 2) return; // Need at least 2 occurrences

      // Sort group by date
      const groupSorted = group.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate intervals between consecutive expenses
      const intervals = [];
      for (let i = 1; i < groupSorted.length; i++) {
        const interval = daysBetween(groupSorted[i - 1].date, groupSorted[i].date);
        intervals.push(interval);
      }

      // Calculate average interval and variance
      const avgInterval = calculateAverage(intervals);
      const variance = intervals.reduce((sum, interval) =>
        sum + Math.pow(interval - avgInterval, 2), 0
      ) / intervals.length;
      const stdDev = Math.sqrt(variance);

      // Check if intervals are consistent (low variance)
      const isConsistent = stdDev <= 2; // Allow 2 days variance

      if (isConsistent) {
        const frequency = getFrequencyLabel(avgInterval);

        if (frequency) {
          // Calculate average amount
          const amounts = groupSorted.map(e => {
            return convertExpenseAmount
              ? convertExpenseAmount(e)
              : parseFloat(e.amount || 0);
          });
          const avgAmount = calculateAverage(amounts);

          // Predict next occurrence
          const lastDate = new Date(groupSorted[groupSorted.length - 1].date);
          const nextDate = new Date(lastDate);
          nextDate.setDate(lastDate.getDate() + Math.round(avgInterval));

          // Check if this pattern is relevant for the selected period
          const now = new Date();
          const daysUntilNext = Math.round((nextDate - now) / (1000 * 60 * 60 * 24));

          let showPattern = false;
          switch (selectedPeriod) {
            case 'week':
              showPattern = daysUntilNext >= 0 && daysUntilNext <= 7;
              break;
            case 'month':
              showPattern = daysUntilNext >= 0 && daysUntilNext <= 30;
              break;
            case 'quarter':
              showPattern = daysUntilNext >= 0 && daysUntilNext <= 90;
              break;
            case 'year':
            case 'all':
              showPattern = true; // Show all patterns
              break;
            default:
              showPattern = daysUntilNext >= 0 && daysUntilNext <= 30;
          }

          if (showPattern) {
            patterns.push({
              title: groupSorted[groupSorted.length - 1].description || category,
              frequency,
              averageAmount: Math.round(avgAmount),
              nextPredicted: formatPredictedDate(nextDate),
              _sortOrder: avgInterval // For sorting (daily first)
            });
          }
        }
      }
    });
  });

  // Sort patterns by frequency (daily first, then weekly, etc.)
  patterns.sort((a, b) => a._sortOrder - b._sortOrder);

  // Remove sort order field and return top 6 patterns
  return patterns.slice(0, 6).map(({ _sortOrder, ...pattern }) => pattern);
};
