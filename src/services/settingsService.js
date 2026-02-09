import apiClient from './api';

/**
 * Settings Service
 * Handles user settings and preferences API calls
 */

const settingsService = {
  /**
   * Get user settings/preferences
   * @returns {Promise<Object>} User settings
   */
  get: async () => {
    const response = await apiClient.get('/settings');
    return response.data.settings || {};
  },

  /**
   * Update user settings/preferences
   * @param {Object} settingsData - Settings data (currency, theme, dateFormat, etc.)
   * @returns {Promise<Object>} Updated settings
   */
  update: async (settingsData) => {
    const response = await apiClient.put('/settings', settingsData);
    return response.data.settings;
  }
};

export default settingsService;
