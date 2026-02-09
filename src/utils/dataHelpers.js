/**
 * Check if data has been cleared by the user
 * @returns {boolean} - True if data was cleared
 */
export const isDataCleared = () => {
  return localStorage.getItem('dataCleared') === 'true';
};

/**
 * Reset the data cleared flag (when new data is added)
 */
export const resetDataClearedFlag = () => {
  localStorage.removeItem('dataCleared');
};

/**
 * Load expenses from localStorage
 * @returns {Array} - Array of expenses
 */
export const loadExpenses = () => {
  try {
    const expenses = localStorage.getItem('expenses');
    return expenses ? JSON.parse(expenses) : [];
  } catch (error) {
    console.error('Error loading expenses:', error);
    return [];
  }
};

/**
 * Save an expense to localStorage
 * @param {Object} expense - Expense object
 */
export const saveExpense = (expense) => {
  try {
    const expenses = loadExpenses();
    const newExpense = {
      ...expense,
      id: expense.id || Date.now().toString(),
      createdAt: expense.createdAt || new Date().toISOString()
    };
    expenses.push(newExpense);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    resetDataClearedFlag();
    return newExpense;
  } catch (error) {
    console.error('Error saving expense:', error);
    throw error;
  }
};

/**
 * Update an expense in localStorage
 * @param {String} id - Expense ID
 * @param {Object} updates - Updated expense data
 */
export const updateExpense = (id, updates) => {
  try {
    const expenses = loadExpenses();
    const updatedExpenses = expenses.map(expense =>
      expense.id === id
        ? { ...expense, ...updates, updatedAt: new Date().toISOString() }
        : expense
    );
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
    return updatedExpenses.find(e => e.id === id);
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

/**
 * Delete an expense from localStorage
 * @param {String} id - Expense ID
 */
export const deleteExpense = (id) => {
  try {
    const expenses = loadExpenses();
    const filteredExpenses = expenses.filter(expense => expense.id !== id);
    localStorage.setItem('expenses', JSON.stringify(filteredExpenses));
    return true;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

/**
 * Default categories
 */
export const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Food & Dining', color: '#EF4444', icon: 'Utensils', budget: 500 },
  { id: '2', name: 'Transportation', color: '#3B82F6', icon: 'Car', budget: 300 },
  { id: '3', name: 'Shopping', color: '#10B981', icon: 'ShoppingCart', budget: 400 },
  { id: '4', name: 'Entertainment', color: '#8B5CF6', icon: 'Gamepad2', budget: 200 },
  { id: '5', name: 'Bills & Utilities', color: '#F59E0B', icon: 'Home', budget: 600 },
  { id: '6', name: 'Healthcare', color: '#EC4899', icon: 'Heart', budget: 300 },
  { id: '7', name: 'Education', color: '#06B6D4', icon: 'GraduationCap', budget: 250 },
  { id: '8', name: 'Travel', color: '#84CC16', icon: 'Plane', budget: 500 },
  { id: '9', name: 'Personal Care', color: '#F97316', icon: 'Scissors', budget: 150 },
  { id: '10', name: 'Other', color: '#6B7280', icon: 'MoreHorizontal', budget: 200 }
];

/**
 * Load categories from localStorage or initialize with defaults
 * @returns {Array} - Array of categories
 */
export const loadCategories = () => {
  try {
    const categories = localStorage.getItem('categories');
    if (!categories) {
      // Initialize with default categories
      localStorage.setItem('categories', JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(categories);
  } catch (error) {
    console.error('Error loading categories:', error);
    return DEFAULT_CATEGORIES;
  }
};

/**
 * Save categories to localStorage
 * @param {Array} categories - Array of categories
 */
export const saveCategories = (categories) => {
  try {
    localStorage.setItem('categories', JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving categories:', error);
    throw error;
  }
};

/**
 * Check if two dates are in the same month and year
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date (defaults to now)
 * @returns {boolean} - True if dates are in same month and year
 */
export const isSameMonth = (date1, date2 = new Date()) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
};

/**
 * Filter expenses by month
 * @param {Array} expenses - Array of expenses
 * @param {Date|string} referenceDate - Reference date (defaults to now)
 * @returns {Array} - Expenses from the same month as referenceDate
 */
export const getMonthlyExpenses = (expenses, referenceDate = new Date()) => {
  if (!expenses || expenses.length === 0) return [];

  return expenses.filter(expense => {
    if (!expense.date) return false;
    return isSameMonth(expense.date, referenceDate);
  });
};

/**
 * Filter expenses by selected time period
 * @param {Array} expenses - Array of all expenses
 * @param {String} period - 'week', 'month', 'quarter', 'year', or 'all'
 * @returns {Array} - Filtered expenses
 */
export const getExpensesByPeriod = (expenses, period = 'month') => {
  if (!expenses || expenses.length === 0) return [];

  const now = new Date();

  switch (period) {
    case 'week': {
      // Current calendar week (Monday to Sunday)
      const dayOfWeek = now.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysFromMonday);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      return expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= weekStart && expDate <= weekEnd;
      });
    }

    case 'month': {
      // Current month
      return getMonthlyExpenses(expenses);
    }

    case 'lastmonth': {
      // Previous month
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return getMonthlyExpenses(expenses, lastMonth);
    }

    case 'quarter': {
      // Last 3 months
      const quarterAgo = new Date(now);
      quarterAgo.setMonth(now.getMonth() - 3);
      return expenses.filter(exp => new Date(exp.date) >= quarterAgo);
    }

    case 'year': {
      // Last 12 months
      const yearAgo = new Date(now);
      yearAgo.setFullYear(now.getFullYear() - 1);
      return expenses.filter(exp => new Date(exp.date) >= yearAgo);
    }

    case 'all': {
      // All time
      return expenses;
    }

    default:
      return getMonthlyExpenses(expenses);
  }
};

/**
 * Calculate statistics from expenses
 * @param {Array} expenses - Array of expenses
 * @returns {Object} - Statistics object
 */
export const calculateStats = (expenses, convertExpenseAmount = null) => {
  if (!expenses || expenses.length === 0) {
    return {
      totalExpenses: 0,
      expenseCount: 0,
      averageExpense: 0,
      highestExpense: null,
      categoryBreakdown: {},
      monthlyTotal: 0
    };
  }

  // Helper function to get converted or raw amount
  const getAmount = (expense) => {
    if (convertExpenseAmount) {
      return convertExpenseAmount(expense);
    }
    return parseFloat(expense.amount || 0);
  };

  const total = expenses.reduce((sum, expense) => sum + getAmount(expense), 0);
  const sortedExpenses = [...expenses].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));

  // Category breakdown
  const categoryBreakdown = expenses.reduce((acc, expense) => {
    const category = expense.category || 'other';
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0 };
    }
    acc[category].total += getAmount(expense);
    acc[category].count += 1;
    return acc;
  }, {});

  // Current month total - use helper function to avoid timezone issues
  const monthlyExpenses = getMonthlyExpenses(expenses);
  const monthlyTotal = monthlyExpenses.reduce((sum, expense) => sum + getAmount(expense), 0);

  return {
    totalExpenses: total,
    expenseCount: expenses.length,
    averageExpense: total / expenses.length,
    highestExpense: sortedExpenses[0] || null,
    categoryBreakdown,
    monthlyTotal
  };
};

/**
 * Get category statistics with spent amounts
 * @param {Array} categories - Array of categories
 * @param {Array} expenses - Array of expenses
 * @param {boolean} filterByMonth - If true, only count expenses from current month (default: true)
 * @returns {Array} - Categories with statistics
 */
export const getCategoryStats = (categories, expenses, filterByMonth = true) => {
  // Filter expenses by month if requested
  const expensesToProcess = filterByMonth ? getMonthlyExpenses(expenses) : expenses;

  return categories.map(category => {
    const categoryExpenses = expensesToProcess.filter(expense => {
      // Match category by name (case insensitive and handle dashes/spaces)
      const expenseCat = (expense.category || '').toLowerCase().replace(/\s+/g, '-');
      const catName = category.name.toLowerCase().replace(/\s+/g, '-');
      return expenseCat === catName || expense.category === category.id;
    });

    const spent = categoryExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
    const transactionCount = categoryExpenses.length;

    return {
      ...category,
      spent,
      transactionCount
    };
  });
};

/**
 * Get category info by name or id
 * @param {String|Object} categoryNameOrId - Category name, ID, or category object
 * @param {Array} categories - Array of categories
 * @returns {Object} - Category info with name, icon, color
 */
export const getCategoryInfo = (categoryNameOrId, categories) => {
  const defaultCategory = {
    name: 'Other',
    icon: 'MoreHorizontal',
    color: '#6B7280'
  };

  if (!categories || categories.length === 0) {
    return defaultCategory;
  }

  // If categoryNameOrId is already a category object with all needed properties, return it
  if (typeof categoryNameOrId === 'object' && categoryNameOrId !== null) {
    if (categoryNameOrId.name && categoryNameOrId.icon && categoryNameOrId.color) {
      return categoryNameOrId;
    }
    // If it's an object but incomplete, try to use the name field
    categoryNameOrId = categoryNameOrId.name || 'Other';
  }

  // Ensure we have a string to work with
  if (typeof categoryNameOrId !== 'string') {
    return defaultCategory;
  }

  const input = categoryNameOrId.toLowerCase();

  // Try exact match first (case insensitive)
  let found = categories.find(cat => cat.name && cat.name.toLowerCase() === input);

  // Try ID match
  if (!found) {
    found = categories.find(cat => cat.id === categoryNameOrId);
  }

  // Try normalized match (remove all special characters and spaces)
  if (!found && input) {
    const normalized = input.replace(/[^a-z0-9]/g, '');
    found = categories.find(cat => {
      if (!cat.name) return false;
      const catName = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return catName === normalized;
    });
  }

  return found || defaultCategory;
};

/**
 * Calculate trend data for charts (daily/weekly/monthly)
 * @param {Array} expenses - Array of expenses
 * @param {String} period - 'daily', 'weekly', or 'monthly'
 * @returns {Array} - Chart data
 */
export const calculateTrendData = (expenses, period = 'weekly') => {
  if (!expenses || expenses.length === 0) return [];

  const now = new Date();
  const data = [];

  if (period === 'daily') {
    // Last 7 days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);

      const dayExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= date && expenseDate < nextDay;
      });

      const amount = dayExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);

      data.push({
        name: days[date.getDay()],
        amount: parseFloat(amount.toFixed(2))
      });
    }
  } else if (period === 'weekly') {
    // Last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7 + 6));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= weekStart && expenseDate < weekEnd;
      });

      const amount = weekExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);

      data.push({
        name: `Week ${4 - i}`,
        amount: parseFloat(amount.toFixed(2))
      });
    }
  } else if (period === 'monthly') {
    // Last 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= monthDate && expenseDate < nextMonth;
      });

      const amount = monthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);

      data.push({
        name: months[monthDate.getMonth()],
        amount: parseFloat(amount.toFixed(2))
      });
    }
  }

  return data;
};
