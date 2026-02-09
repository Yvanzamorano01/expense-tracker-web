import apiClient from './api';

/**
 * Analytics Service
 * Handles all analytics and chart-related API calls
 */

const analyticsService = {
  /**
   * Get dashboard summary
   * Includes total expenses, budget status, top categories, recent transactions
   * @param {Object} params - Query parameters (month, year)
   * @returns {Promise<Object>} Dashboard summary data
   */
  getDashboard: async (params = {}) => {
    const response = await apiClient.get('/analytics/dashboard', { params });
    return response.data.dashboard || {};
  },

  /**
   * Get pie chart data (category distribution)
   * @param {Object} params - Query parameters (startDate, endDate)
   * @returns {Promise<Object>} Pie chart data
   */
  getPieChart: async (params = {}) => {
    const response = await apiClient.get('/analytics/pie-chart', { params });
    return response.data.pieChart || {};
  },

  /**
   * Get bar chart data (monthly comparison)
   * @param {Object} params - Query parameters (months, year)
   * @returns {Promise<Object>} Bar chart data
   */
  getBarChart: async (params = {}) => {
    const response = await apiClient.get('/analytics/bar-chart', { params });
    return response.data.barChart || {};
  },

  /**
   * Get line chart data (trend analysis)
   * @param {Object} params - Query parameters (startDate, endDate, groupBy)
   * @returns {Promise<Object>} Line chart data
   */
  getLineChart: async (params = {}) => {
    const response = await apiClient.get('/analytics/line-chart', { params });
    return response.data.lineChart || {};
  }
};

export default analyticsService;
