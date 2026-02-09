/**
 * Storage Helpers - API Version
 * Replaces localStorage operations with API calls
 * Note: These functions are async and return promises
 */

import { expenseService, categoryService, budgetService, settingsService } from '../services';

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
 * Load expenses from API
 * @returns {Promise<Array>} - Array of expenses
 */
export const loadExpenses = async () => {
  try {
    const expenses = await expenseService.getAll();
    console.log('🔍 DEBUG storageHelpers.loadExpenses - API Response count:', expenses?.length);
    if (expenses?.length > 0) {
      console.log('🔍 DEBUG storageHelpers.loadExpenses - First expense:', expenses[0]);
    }

    // Transform API response to match frontend format
    // Backend may return 'id' or 'expenseId', handle both
    return expenses.map(expense => ({
      id: (expense.expenseId || expense.id)?.toString(),
      amount: expense.amount,
      date: expense.date,
      originalCurrency: expense.originalCurrency || 'USD',  // Include original currency!
      // Ensure category is always a string, not an object
      category: expense.Category?.name ||
               (typeof expense.category === 'object' && expense.category !== null
                 ? expense.category?.name
                 : expense.category) ||
               'Uncategorized',
      categoryId: expense.categoryId,
      description: expense.description || '',
      location: expense.location || '',
      paymentMethod: expense.paymentMethod || 'Cash',
      isRecurring: expense.isRecurring || false,
      recurringFrequency: expense.recurringFrequency || 'monthly',
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt
    }));
  } catch (error) {
    console.error('Error loading expenses from API:', error);
    return [];
  }
};

/**
 * Helper function to normalize payment method values
 * Converts old frontend values to backend-expected values
 * @param {String} method - Payment method value
 * @returns {String} - Normalized payment method
 */
const normalizePaymentMethod = (method) => {
  // DEBUG: Log input to normalization function
  console.log('🔍 DEBUG normalizePaymentMethod - Input:', method);
  console.log('🔍 DEBUG normalizePaymentMethod - typeof:', typeof method);

  // Default to 'Cash' if empty, undefined, null, or whitespace
  if (!method || typeof method !== 'string' || method.trim() === '') {
    console.log('🔍 DEBUG normalizePaymentMethod - Empty/invalid input, returning Cash');
    return 'Cash';
  }

  const trimmed = method.trim();
  console.log('🔍 DEBUG normalizePaymentMethod - Trimmed value:', trimmed);

  // Mapping of old values to new values
  const mapping = {
    'cash': 'Cash',
    'credit-card': 'Card',
    'debit-card': 'Card',
    'bank-transfer': 'Bank Transfer',
    'digital-wallet': 'Digital Wallet',
    'check': 'Other'
  };

  const normalized = mapping[trimmed.toLowerCase()];
  console.log('🔍 DEBUG normalizePaymentMethod - After mapping lookup:', normalized);

  const result = normalized || trimmed;
  console.log('🔍 DEBUG normalizePaymentMethod - Result (normalized or original):', result);

  // Validation finale contre les valeurs acceptées par le backend
  const validMethods = ['Cash', 'Card', 'Bank Transfer', 'Digital Wallet', 'Other'];
  const finalResult = validMethods.includes(result) ? result : 'Cash';
  console.log('🔍 DEBUG normalizePaymentMethod - Final result after validation:', finalResult);

  return finalResult;
};

/**
 * Save an expense via API
 * @param {Object} expense - Expense object
 * @returns {Promise<Object>} - Created expense
 */
export const saveExpense = async (expense) => {
  try {
    // DEBUG: Log input expense object
    console.log('🔍 DEBUG storageHelpers.saveExpense - Input expense:', expense);
    console.log('🔍 DEBUG storageHelpers.saveExpense - Input paymentMethod:', expense.paymentMethod);
    console.log('🔍 DEBUG storageHelpers.saveExpense - typeof paymentMethod:', typeof expense.paymentMethod);

    // Get categoryId if not provided
    let categoryId = expense.categoryId ? parseInt(expense.categoryId) : null;

    if (!categoryId && expense.category) {
      // Find category by name
      const categories = await loadCategories();
      const category = categories.find(cat =>
        cat.name.toLowerCase() === expense.category.toLowerCase()
      );
      categoryId = category ? parseInt(category.id) : 13; // Default to Uncategorized
    }

    // DEBUG: Log normalization
    const normalizedPaymentMethod = normalizePaymentMethod(expense.paymentMethod);
    console.log('🔍 DEBUG storageHelpers.saveExpense - After normalization:', normalizedPaymentMethod);

    // Transform frontend format to API format
    const expenseData = {
      amount: parseFloat(expense.amount),
      date: expense.date,
      categoryId: categoryId || 13,
      description: expense.description || '',
      location: expense.location || '',
      paymentMethod: normalizedPaymentMethod,
      originalCurrency: expense.originalCurrency || 'USD',  // ✅ CRITICAL FIX: Include originalCurrency!
      isRecurring: expense.isRecurring || false,
      recurringFrequency: expense.recurringFrequency || 'monthly'
    };

    console.log('🔍 DEBUG storageHelpers.saveExpense - Final expenseData payload:', expenseData);
    console.log('🔍 DEBUG storageHelpers.saveExpense - expenseData.paymentMethod:', expenseData.paymentMethod);

    const created = await expenseService.create(expenseData);
    console.log('🔍 DEBUG storageHelpers.saveExpense - API Response (created):', created);
    console.log('🔍 DEBUG storageHelpers.saveExpense - created.id:', created?.id);
    console.log('🔍 DEBUG storageHelpers.saveExpense - created.expenseId:', created?.expenseId);

    // Validate API response
    if (!created) {
      throw new Error('No data returned from API');
    }

    resetDataClearedFlag();

    // Transform response back to frontend format
    // Backend may return 'id' or 'expenseId', handle both
    return {
      id: (created.expenseId || created.id)?.toString(),
      amount: created.amount,
      date: created.date,
      category: created.Category?.name || expense.category,
      categoryId: created.categoryId,
      description: created.description || '',
      location: created.location || '',
      paymentMethod: created.paymentMethod || 'Cash',
      originalCurrency: created.originalCurrency || 'USD',  // ✅ CRITICAL FIX: Include originalCurrency in response!
      isRecurring: created.isRecurring || false,
      recurringFrequency: created.recurringFrequency || 'monthly',
      createdAt: created.createdAt
    };
  } catch (error) {
    console.error('Error saving expense to API:', error);
    throw error;
  }
};

/**
 * Update an expense via API
 * @param {String} id - Expense ID
 * @param {Object} updates - Updated expense data
 * @returns {Promise<Object>} - Updated expense
 */
export const updateExpense = async (id, updates) => {
  try {
    const expenseData = {
      amount: updates.amount ? parseFloat(updates.amount) : undefined,
      date: updates.date,
      categoryId: updates.categoryId ? parseInt(updates.categoryId) : undefined,
      description: updates.description,
      location: updates.location,
      paymentMethod: updates.paymentMethod ? normalizePaymentMethod(updates.paymentMethod) : undefined,
      originalCurrency: updates.originalCurrency,  // ✅ CRITICAL FIX: Include originalCurrency!
      isRecurring: updates.isRecurring,
      recurringFrequency: updates.recurringFrequency
    };

    // Remove undefined values
    Object.keys(expenseData).forEach(key =>
      expenseData[key] === undefined && delete expenseData[key]
    );

    const updated = await expenseService.update(parseInt(id), expenseData);
    console.log('🔍 DEBUG storageHelpers.updateExpense - API Response (updated):', updated);

    // Backend may return 'id' or 'expenseId', handle both
    return {
      id: (updated.expenseId || updated.id)?.toString(),
      amount: updated.amount,
      date: updated.date,
      category: updated.Category?.name,
      categoryId: updated.categoryId,
      description: updated.description || '',
      location: updated.location || '',
      paymentMethod: updated.paymentMethod || 'Cash',
      originalCurrency: updated.originalCurrency || 'USD',  // ✅ CRITICAL FIX: Include originalCurrency in response!
      isRecurring: updated.isRecurring || false,
      recurringFrequency: updated.recurringFrequency || 'monthly',
      updatedAt: updated.updatedAt
    };
  } catch (error) {
    console.error('Error updating expense via API:', error);
    throw error;
  }
};

/**
 * Delete an expense via API
 * @param {String} id - Expense ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteExpense = async (id) => {
  try {
    await expenseService.delete(parseInt(id));
    return true;
  } catch (error) {
    console.error('Error deleting expense via API:', error);
    throw error;
  }
};

/**
 * Load categories from API
 * @returns {Promise<Array>} - Array of categories
 */
export const loadCategories = async () => {
  try {
    const categories = await categoryService.getAll();
    console.log('🔍 DEBUG storageHelpers.loadCategories - API Response count:', categories?.length);
    if (categories?.length > 0) {
      console.log('🔍 DEBUG storageHelpers.loadCategories - First category:', categories[0]);
    }

    // Transform API response to match frontend format
    // Backend may return 'id' or 'categoryId', handle both
    return categories.map(category => ({
      id: (category.categoryId || category.id)?.toString(),
      name: category.name,
      color: category.color,
      icon: category.icon || 'HelpCircle',
      budget: category.budget || 0,
      isDefault: category.isDefault
    }));
  } catch (error) {
    console.error('Error loading categories from API:', error);
    return [];
  }
};

/**
 * Save/update categories via API
 * @param {Array} categories - Array of categories
 * @returns {Promise<void>}
 */
export const saveCategories = async (categories) => {
  try {
    // This function is complex as it may involve create/update operations
    // For now, we'll handle individual category operations through categoryService
    console.warn('saveCategories: Use categoryService.create/update for individual operations');
  } catch (error) {
    console.error('Error saving categories via API:', error);
    throw error;
  }
};


/**
 * Load budgets from API
 * @param {Number} month - Month (1-12)
 * @param {Number} year - Year
 * @returns {Promise<Array>} - Array of budgets
 */
export const loadBudgets = async (month, year) => {
  try {
    const budgets = await budgetService.getAll({ month, year });

    // Backend may return 'id' or 'budgetId', handle both
    return budgets.map(budget => ({
      id: (budget.budgetId || budget.id)?.toString(),
      amount: budget.amount,
      originalCurrency: budget.originalCurrency || 'USD',
      categoryId: budget.categoryId?.toString(),
      category: budget.Category?.name,
      month: budget.month,
      year: budget.year
    }));
  } catch (error) {
    console.error('Error loading budgets from API:', error);
    return [];
  }
};

/**
 * Get current month budgets
 * @returns {Promise<Array>} - Array of current month budgets
 */
export const getCurrentBudgets = async () => {
  try {
    const budgets = await budgetService.getCurrent();

    // Backend may return 'id' or 'budgetId', handle both
    return budgets.map(budget => ({
      id: (budget.budgetId || budget.id)?.toString(),
      amount: budget.amount,
      originalCurrency: budget.originalCurrency || 'USD',
      categoryId: budget.categoryId?.toString(),
      category: budget.Category?.name,
      month: budget.month,
      year: budget.year
    }));
  } catch (error) {
    console.error('Error loading current budgets from API:', error);
    return [];
  }
};

/**
 * Load categories with their associated budgets merged
 * @returns {Promise<Array>} - Array of categories with budget values
 */
export const loadCategoriesWithBudgets = async () => {
  try {
    const [categories, budgets] = await Promise.all([
      loadCategories(),
      getCurrentBudgets()
    ]);

    // Fusionner budgets avec catégories
    return categories.map(category => {
      const budget = budgets.find(b =>
        b.categoryId?.toString() === category.id?.toString()
      );
      return {
        ...category,
        budget: budget ? parseFloat(budget.amount) : 0
      };
    });
  } catch (error) {
    console.error('Error loading categories with budgets:', error);
    return loadCategories(); // Fallback sans budgets
  }
};

/**
 * Get budget status with alerts
 * @returns {Promise<Object>} - Budget status
 */
export const getBudgetStatus = async () => {
  try {
    return await budgetService.getStatus();
  } catch (error) {
    console.error('Error getting budget status from API:', error);
    return {};
  }
};

/**
 * Save (create or update) a budget
 * @param {Object} budgetData - Budget data with amount, categoryId, month, year
 * @param {number} existingBudgetId - ID of existing budget (if updating)
 * @returns {Promise<Object>} - Created or updated budget
 */
export const saveBudget = async (budgetData, existingBudgetId = null) => {
  try {
    console.log('💰 Saving budget - Data:', budgetData, 'Existing ID:', existingBudgetId);

    if (existingBudgetId) {
      // Update existing budget
      const updated = await budgetService.update(parseInt(existingBudgetId), {
        amount: parseFloat(budgetData.amount),
        originalCurrency: budgetData.originalCurrency
      });

      return {
        id: (updated.budgetId || updated.id)?.toString(),
        amount: updated.amount,
        originalCurrency: updated.originalCurrency || 'USD',
        categoryId: updated.categoryId?.toString(),
        category: updated.Category?.name,
        month: updated.month,
        year: updated.year
      };
    } else {
      // Create new budget
      try {
        const created = await budgetService.create({
          amount: parseFloat(budgetData.amount),
          categoryId: budgetData.categoryId ? parseInt(budgetData.categoryId) : null,
          month: budgetData.month,
          year: budgetData.year,
          originalCurrency: budgetData.originalCurrency || 'USD'
        });

        return {
          id: (created.budgetId || created.id)?.toString(),
          amount: created.amount,
          originalCurrency: created.originalCurrency || 'USD',
          categoryId: created.categoryId?.toString(),
          category: created.Category?.name,
          month: created.month,
          year: created.year
        };
      } catch (createError) {
        // If budget already exists (409 Conflict), fetch it and update instead
        if (createError.message?.includes('already exists') || createError.message?.includes('409')) {
          console.log('⚠️ Budget already exists, fetching and updating...');

          // Fetch all budgets for this month/year
          const existingBudgets = await budgetService.getAll({
            month: budgetData.month,
            year: budgetData.year
          });

          // Find the budget for this category
          const existingBudget = existingBudgets.find(b =>
            parseInt(b.categoryId) === parseInt(budgetData.categoryId)
          );

          if (existingBudget) {
            console.log('✅ Found existing budget, updating:', existingBudget.id);

            // Update the existing budget
            const updated = await budgetService.update(parseInt(existingBudget.id), {
              amount: parseFloat(budgetData.amount),
              originalCurrency: budgetData.originalCurrency
            });

            return {
              id: (updated.budgetId || updated.id)?.toString(),
              amount: updated.amount,
              originalCurrency: updated.originalCurrency || 'USD',
              categoryId: updated.categoryId?.toString(),
              category: updated.Category?.name,
              month: updated.month,
              year: updated.year
            };
          }
        }

        // If not a 409 or budget not found, re-throw the error
        throw createError;
      }
    }
  } catch (error) {
    console.error('❌ Error saving budget to API:', error);
    throw error;
  }
};

/**
 * Delete a budget
 * @param {number|string} budgetId - Budget ID to delete
 * @returns {Promise<void>}
 */
export const deleteBudget = async (budgetId) => {
  try {
    console.log('🗑️ Deleting budget - ID:', budgetId);
    await budgetService.delete(parseInt(budgetId));
  } catch (error) {
    console.error('❌ Error deleting budget from API:', error);
    throw error;
  }
};

/**
 * Load user settings from API
 * @returns {Promise<Object>} - User settings
 */
export const loadSettings = async () => {
  try {
    const settings = await settingsService.get();
    return {
      currency: settings.currency || 'USD',
      theme: settings.theme || 'light',
      dateFormat: settings.dateFormat || 'MM/DD/YYYY'
    };
  } catch (error) {
    console.error('Error loading settings from API:', error);
    return {
      currency: 'USD',
      theme: 'light',
      dateFormat: 'MM/DD/YYYY'
    };
  }
};

/**
 * Save user settings via API
 * @param {Object} settings - Settings object
 * @returns {Promise<Object>} - Updated settings
 */
export const saveSettings = async (settings) => {
  try {
    return await settingsService.update(settings);
  } catch (error) {
    console.error('Error saving settings via API:', error);
    throw error;
  }
};
