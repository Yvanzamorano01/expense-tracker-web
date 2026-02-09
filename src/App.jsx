import React, { useEffect, useCallback } from "react";
import Routes from "./Routes";
import { NotificationProvider, useNotifications } from "./contexts/NotificationContext";
import { NotificationToastContainer } from "./components/notifications/NotificationToast";
import useWeeklyReport from "./hooks/useWeeklyReport";
import { useBudgetAlerts } from "./hooks/useBudgetAlerts";

// Main App component with theme management and notification system
function App() {
  useEffect(() => {
    // Initialize theme on app load
    const savedTheme = localStorage.getItem('selectedTheme') || 'light';
    
    const applyTheme = (theme) => {
      if (theme === 'dark') {
        document.documentElement?.classList?.add('dark');
      } else if (theme === 'light') {
        document.documentElement?.classList?.remove('dark');
      } else if (theme === 'auto') {
        // Auto mode - check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')?.matches;
        if (prefersDark) {
          document.documentElement?.classList?.add('dark');
        } else {
          document.documentElement?.classList?.remove('dark');
        }
      }
    };

    // Apply saved theme
    applyTheme(savedTheme);

    // Listen for system theme changes if auto mode is selected
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      const currentTheme = localStorage.getItem('selectedTheme');
      if (currentTheme === 'auto') {
        applyTheme('auto');
      }
    };

    mediaQuery?.addEventListener?.('change', handleSystemThemeChange);

    // Cleanup listener on unmount
    return () => {
      mediaQuery?.removeEventListener?.('change', handleSystemThemeChange);
    };
  }, []);

  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

// Separate component to use notification hook
const AppContent = () => {
  const { toasts, removeToast, addNotification } = useNotifications();

  // Automatic weekly report generation
  useWeeklyReport();

  // Budget alerts system - wrap addNotification to match expected format
  const handleBudgetAlert = useCallback((title, message, type, duration) => {
    addNotification({
      type,
      title,
      message,
      showToast: true,
      duration
    });
  }, [addNotification]);

  useBudgetAlerts(handleBudgetAlert);

  return (
    <>
      <Routes />
      <NotificationToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
};

export default App;