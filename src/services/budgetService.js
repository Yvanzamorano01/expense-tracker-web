import apiClient from './api';

/**
 * Budget Service
 * Handles all budget-related API calls
 */

const budgetService = {
  /**
   * Get all budgets
   * @param {Object} params - Query parameters (month, year)
   * @returns {Promise<Array>} List of budgets
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get('/budgets', { params });
    return response.data?.budgets || [];
  },

  /**
   * Get a single budget by ID
   * @param {number} id - Budget ID
   * @returns {Promise<Object>} Budget object
   */
  getById: async (id) => {
    const response = await apiClient.get(`/budgets/${id}`);
    return response.data;
  },

  /**
   * Create a new budget
   * @param {Object} budgetData - Budget data (amount, categoryId, month, year)
   * @returns {Promise<Object>} Created budget
   */
  create: async (budgetData) => {
    const response = await apiClient.post('/budgets', budgetData);
    return response.data;
  },

  /**
   * Update an existing budget
   * @param {number} id - Budget ID
   * @param {Object} budgetData - Updated budget data
   * @returns {Promise<Object>} Updated budget
   */
  update: async (id, budgetData) => {
    const response = await apiClient.put(`/budgets/${id}`, budgetData);
    return response.data;
  },

  /**
   * Delete a budget
   * @param {number} id - Budget ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/budgets/${id}`);
    return response.data;
  },

  /**
   * Get budgets for the current month
   * @returns {Promise<Array>} Current month budgets
   */
  getCurrent: async () => {
    const response = await apiClient.get('/budgets/current');
    return response.data?.budgets || [];
  },

  /**
   * Get budget status with spending information
   * @param {Object} params - Query parameters (month, year)
   * @returns {Promise<Object>} Budget status with alerts
   */
  getStatus: async (params = {}) => {
    const response = await apiClient.get('/budgets/status', { params });
    return response.data || {};
  },

  /**
   * Get active budget alerts (80% warning, 100% exceeded)
   * @param {Object} params - Query parameters (month, year)
   * @returns {Promise<Array>} List of budget alerts
   */
  getAlerts: async (params = {}) => {
    const response = await apiClient.get('/budgets/alerts', { params });
    return response.data?.alerts || [];
  }
};

export default budgetService;
