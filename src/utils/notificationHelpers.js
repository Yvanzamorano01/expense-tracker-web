/**
 * Notification Helpers
 * Utilities for creating and managing notifications
 */

let notificationId = 0;

/**
 * Create a notification object
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type: 'info', 'success', 'warning', 'error'
 * @param {number} duration - Duration in milliseconds (0 = no auto-dismiss)
 * @returns {Object} - Notification object
 */
export const createNotification = (title, message, type = 'info', duration = 5000) => {
  return {
    id: ++notificationId,
    title,
    message,
    type, // 'info', 'success', 'warning', 'error'
    duration,
    createdAt: Date.now()
  };
};

/**
 * Get notification settings from localStorage
 * @returns {Object} - Notification settings
 */
export const getNotificationSettings = () => {
  const settings = localStorage.getItem('notificationSettings');
  if (settings) {
    return JSON.parse(settings);
  }

  // Default settings
  return {
    budgetAlerts: true,
    spendingThreshold: 80,
    dailyReminders: false,
    weeklyReports: true,
    monthlyReports: true
  };
};

/**
 * Check if daily reminder should be shown
 * @returns {boolean} - True if should show reminder
 */
export const shouldShowDailyReminder = () => {
  const settings = getNotificationSettings();
  if (!settings.dailyReminders) return false;

  const lastReminder = localStorage.getItem('lastDailyReminder');
  if (!lastReminder) return true;

  const lastReminderDate = new Date(parseInt(lastReminder));
  const today = new Date();

  // Check if it's a new day
  return lastReminderDate.toDateString() !== today.toDateString();
};

/**
 * Mark daily reminder as shown
 */
export const markDailyReminderShown = () => {
  localStorage.setItem('lastDailyReminder', Date.now().toString());
};

/**
 * Check if weekly report should be shown
 * @returns {boolean} - True if should show report
 */
export const shouldShowWeeklyReport = () => {
  const settings = getNotificationSettings();
  if (!settings.weeklyReports) return false;

  const lastReport = localStorage.getItem('lastWeeklyReport');
  if (!lastReport) return true;

  const lastReportDate = new Date(parseInt(lastReport));
  const today = new Date();

  // Check if it's been a week
  const daysDiff = Math.floor((today - lastReportDate) / (1000 * 60 * 60 * 24));
  return daysDiff >= 7;
};

/**
 * Mark weekly report as shown
 */
export const markWeeklyReportShown = () => {
  localStorage.setItem('lastWeeklyReport', Date.now().toString());
};

/**
 * Check if monthly report should be shown
 * @returns {boolean} - True if should show report
 */
export const shouldShowMonthlyReport = () => {
  const settings = getNotificationSettings();
  if (!settings.monthlyReports) return false;

  const lastReport = localStorage.getItem('lastMonthlyReport');
  if (!lastReport) return true;

  const lastReportDate = new Date(parseInt(lastReport));
  const today = new Date();

  // Check if it's a new month
  return (
    lastReportDate.getMonth() !== today.getMonth() ||
    lastReportDate.getFullYear() !== today.getFullYear()
  );
};

/**
 * Mark monthly report as shown
 */
export const markMonthlyReportShown = () => {
  localStorage.setItem('lastMonthlyReport', Date.now().toString());
};
