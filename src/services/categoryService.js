import apiClient from './api';

/**
 * Category Service
 * Handles all category-related API calls
 */

const categoryService = {
  /**
   * Get all categories
   * @returns {Promise<Array>} List of categories
   */
  getAll: async () => {
    const response = await apiClient.get('/categories');
    return response.data.categories || [];
  },

  /**
   * Get a single category by ID
   * @param {number} id - Category ID
   * @returns {Promise<Object>} Category object
   */
  getById: async (id) => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data.category;
  },

  /**
   * Create a new custom category
   * @param {Object} categoryData - Category data (name, color, icon)
   * @returns {Promise<Object>} Created category
   */
  create: async (categoryData) => {
    const response = await apiClient.post('/categories', categoryData);
    return response.data.category;
  },

  /**
   * Update an existing category
   * @param {number} id - Category ID
   * @param {Object} categoryData - Updated category data
   * @returns {Promise<Object>} Updated category
   */
  update: async (id, categoryData) => {
    const response = await apiClient.put(`/categories/${id}`, categoryData);
    return response.data.category;
  },

  /**
   * Delete a category
   * @param {number} id - Category ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  },

  /**
   * Get total spent for a specific category
   * @param {number} id - Category ID
   * @param {Object} params - Query parameters (startDate, endDate)
   * @returns {Promise<Object>} Total spent information
   */
  getTotal: async (id, params = {}) => {
    const response = await apiClient.get(`/categories/${id}/total`, { params });
    return response.data;
  },

  /**
   * Get statistics for a specific category
   * @param {number} id - Category ID
   * @param {Object} params - Query parameters (startDate, endDate)
   * @returns {Promise<Object>} Category statistics
   */
  getStats: async (id, params = {}) => {
    const response = await apiClient.get(`/categories/${id}/stats`, { params });
    return response.data.stats;
  }
};

export default categoryService;
