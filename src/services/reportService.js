import apiClient from './api';

/**
 * Report Service
 * Handles all report generation and export API calls
 */

const reportService = {
  /**
   * Generate expense report
   * @param {Object} reportData - Report configuration (startDate, endDate, categories, includeCharts, etc.)
   * @returns {Promise<Object>} Generated report data
   */
  generate: async (reportData) => {
    const response = await apiClient.post('/reports/generate', reportData);
    return response.data.report || {};
  },

  /**
   * Export expenses to CSV
   * Downloads CSV file directly to user's device
   * @param {Object} params - Query parameters (startDate, endDate, categories)
   * @returns {Promise<Blob>} CSV file blob
   */
  exportToCsv: async (params = {}) => {
    const response = await apiClient.get('/reports/export/csv', {
      params,
      responseType: 'blob' // Important for file download
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expense_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response;
  },

  /**
   * Export expenses to PDF
   * Downloads PDF file directly to user's device
   * @param {Object} params - Query parameters (startDate, endDate, categories)
   * @returns {Promise<Blob>} PDF file blob
   */
  exportToPdf: async (params = {}) => {
    const response = await apiClient.get('/reports/export/pdf', {
      params,
      responseType: 'blob' // Important for file download
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expense_report_${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response;
  }
};

export default reportService;
