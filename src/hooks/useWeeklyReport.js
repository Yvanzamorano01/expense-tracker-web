import { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import {
  generateWeeklyReport,
  formatWeeklyReportNotification,
  wasReportSentThisWeek,
  markReportAsSent,
  isReportDay
} from '../services/weeklyReportService';

/**
 * Hook for automatic weekly report generation
 * Checks if it's Monday and if the report hasn't been sent this week
 * Then generates and sends a notification with the weekly spending report
 */
const useWeeklyReport = () => {
  const { addNotification } = useNotifications();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    const checkAndSendWeeklyReport = async () => {
      // Prevent multiple checks in the same session
      if (hasCheckedRef.current) {
        return;
      }

      try {
        // Check if weekly reports are enabled in settings
        const notificationSettings = localStorage.getItem('notificationSettings');
        let weeklyReportsEnabled = true; // Default to enabled

        if (notificationSettings) {
          const settings = JSON.parse(notificationSettings);
          weeklyReportsEnabled = settings.weeklyReports !== false;
        }

        if (!weeklyReportsEnabled) {
          console.log('📊 Weekly reports are disabled in settings');
          hasCheckedRef.current = true;
          return;
        }

        // Check if it's Monday (report day)
        if (!isReportDay()) {
          console.log('📊 Not Monday - skipping weekly report');
          hasCheckedRef.current = true;
          return;
        }

        // Check if report was already sent this week
        if (wasReportSentThisWeek()) {
          console.log('📊 Weekly report already sent this week');
          hasCheckedRef.current = true;
          return;
        }

        console.log('📊 Generating weekly report...');

        // Generate the report
        const report = await generateWeeklyReport();

        if (!report) {
          console.log('📊 No data available for weekly report');
          hasCheckedRef.current = true;
          return;
        }

        // Format notification
        const { title, message } = formatWeeklyReportNotification(report);

        // Send notification
        addNotification({
          type: 'info',
          title,
          message,
          showToast: true,
          duration: 10000, // 10 seconds for weekly report
        });

        // Mark as sent
        markReportAsSent();

        console.log('✅ Weekly report sent successfully');
        hasCheckedRef.current = true;
      } catch (error) {
        console.error('❌ Error sending weekly report:', error);
        hasCheckedRef.current = true;
      }
    };

    // Run check after a short delay to ensure app is fully loaded
    const timeoutId = setTimeout(() => {
      checkAndSendWeeklyReport();
    }, 2000); // 2 second delay

    return () => clearTimeout(timeoutId);
  }, [addNotification]);
};

export default useWeeklyReport;
