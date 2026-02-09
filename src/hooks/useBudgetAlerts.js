import { useEffect, useRef } from 'react';
import { loadExpenses, loadCategoriesWithBudgets } from '../utils/storageHelpers';
import { getNotificationSettings } from '../utils/notificationHelpers';
import { formatCurrency, getCurrentCurrency, convertCurrency } from '../utils/currencyHelpers';

/**
 * useBudgetAlerts Hook
 * Monitors budget spending and triggers notifications when thresholds are reached
 * @param {Function} addNotification - Function to add a notification
 */
export const useBudgetAlerts = (addNotification) => {
  const notifiedCategories = useRef(new Set());

  useEffect(() => {
    const checkBudgets = async () => {
      const settings = getNotificationSettings();

      if (!settings.budgetAlerts) {
        return; // Budget alerts disabled
      }

      try {
        const [expenses, categories] = await Promise.all([
          loadExpenses(),
          loadCategoriesWithBudgets()
        ]);

        // Get current currency for display
        const currency = getCurrentCurrency();

        // Get current month expenses
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyExpenses = expenses.filter((exp) => {
          const expDate = new Date(exp.date);
          return (
            expDate.getMonth() === currentMonth &&
            expDate.getFullYear() === currentYear
          );
        });

        // Check each category with budget
        categories.forEach((category) => {
          const budget = parseFloat(category.budget || 0);

          if (budget > 0) {
            // Calculate spending for this category (all in USD)
            const spent = monthlyExpenses
              .filter((exp) => exp.category === category.name)
              .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

            const percentage = (spent / budget) * 100;
            const threshold = settings.spendingThreshold;

            const notificationKey = `${category.name}-${currentMonth}-${currentYear}`;

            // Convert amounts to current currency for display
            const spentConverted = convertCurrency(spent, 'USD', currency);
            const budgetConverted = convertCurrency(budget, 'USD', currency);

            // Check if threshold exceeded and not already notified
            if (percentage >= threshold && percentage < 100) {
              if (!notifiedCategories.current.has(notificationKey)) {
                addNotification(
                  'Budget Alert',
                  `You've used ${percentage.toFixed(0)}% of your ${category.name} budget (${formatCurrency(spentConverted, currency)} of ${formatCurrency(budgetConverted, currency)})`,
                  'warning',
                  8000
                );
                notifiedCategories.current.add(notificationKey);
              }
            } else if (percentage >= 100) {
              const exceededKey = `${notificationKey}-exceeded`;
              if (!notifiedCategories.current.has(exceededKey)) {
                addNotification(
                  'Budget Exceeded',
                  `You've exceeded your ${category.name} budget! ${formatCurrency(spentConverted, currency)} of ${formatCurrency(budgetConverted, currency)} spent`,
                  'error',
                  10000
                );
                notifiedCategories.current.add(exceededKey);
              }
            }
          }
        });

        // Store last check time
        localStorage.setItem('lastBudgetCheck', Date.now().toString());
      } catch (error) {
        console.error('Error checking budgets:', error);
      }
    };

    // Check budgets on mount
    checkBudgets();

    // Check budgets every 5 minutes
    const interval = setInterval(checkBudgets, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [addNotification]);

  // Reset notified categories each month
  useEffect(() => {
    const resetNotifications = () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const lastReset = localStorage.getItem('lastBudgetReset');
      if (lastReset) {
        const lastResetDate = new Date(parseInt(lastReset));
        if (
          lastResetDate.getMonth() !== currentMonth ||
          lastResetDate.getFullYear() !== currentYear
        ) {
          notifiedCategories.current.clear();
          localStorage.setItem('lastBudgetReset', Date.now().toString());
        }
      } else {
        localStorage.setItem('lastBudgetReset', Date.now().toString());
      }
    };

    resetNotifications();

    // Check daily for month change
    const dailyCheck = setInterval(resetNotifications, 24 * 60 * 60 * 1000);

    return () => clearInterval(dailyCheck);
  }, []);
};
