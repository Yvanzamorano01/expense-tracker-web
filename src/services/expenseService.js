import apiClient from './api';

/**
 * Expense Service
 * Handles all expense-related API calls
 */

const expenseService = {
  /**
   * Get all expenses with optional filtering
   * @param {Object} params - Query parameters (categoryId, startDate, endDate, limit, offset)
   * @returns {Promise<Array>} List of expenses
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get('/expenses', { params });
    return response.data.expenses || [];
  },

  /**
   * Get a single expense by ID
   * @param {number} id - Expense ID
   * @returns {Promise<Object>} Expense object
   */
  getById: async (id) => {
    const response = await apiClient.get(`/expenses/${id}`);
    return response.data.data || response.data;
  },

  /**
   * Create a new expense
   * @param {Object} expenseData - Expense data (amount, date, categoryId, description, paymentMethod)
   * @returns {Promise<Object>} Created expense
   */
  create: async (expenseData) => {
    console.log('🔍 DEBUG expenseService.create - expenseData BEFORE axios:', JSON.stringify(expenseData, null, 2));
    const response = await apiClient.post('/expenses', expenseData);
    console.log('🔍 DEBUG expenseService.create - response:', response);
    return response.data.data || response.data;
  },

  /**
   * Update an existing expense
   * @param {number} id - Expense ID
   * @param {Object} expenseData - Updated expense data
   * @returns {Promise<Object>} Updated expense
   */
  update: async (id, expenseData) => {
    const response = await apiClient.put(`/expenses/${id}`, expenseData);
    return response.data.data || response.data;
  },

  /**
   * Delete an expense
   * @param {number} id - Expense ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/expenses/${id}`);
    return response.data;
  },

  /**
   * Search expenses by keyword
   * @param {string} keyword - Search keyword
   * @returns {Promise<Array>} Matching expenses
   */
  search: async (keyword) => {
    const response = await apiClient.get('/expenses/search', {
      params: { keyword }
    });
    return response.data.expenses || [];
  },

  /**
   * Get expenses within a date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Filtered expenses
   */
  getByDateRange: async (startDate, endDate) => {
    const response = await apiClient.get('/expenses/date-range', {
      params: { startDate, endDate }
    });
    return response.data.expenses || [];
  },

  /**
   * Get expense summary grouped by category
   * @param {Object} params - Query parameters (startDate, endDate)
   * @returns {Promise<Array>} Category-wise summary
   */
  getSummary: async (params = {}) => {
    const response = await apiClient.get('/expenses/summary', { params });
    return response.data.summary || [];
  }
};

export default expenseService;
