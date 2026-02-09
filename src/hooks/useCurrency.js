import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentCurrency,
  formatCurrency,
  convertCurrency,
  convertExpenseAmount,
  convertBudgetAmount
} from '../utils/currencyHelpers';

/**
 * Custom hook for currency operations
 * Provides current currency, formatting, and conversion functions
 */
export const useCurrency = () => {
  const [currency, setCurrency] = useState(getCurrentCurrency());

  // Listen for currency changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'selectedCurrency') {
        setCurrency(e.newValue || 'USD');
      }
    };

    // Also check periodically in case localStorage changed in same window
    const checkCurrency = () => {
      const current = getCurrentCurrency();
      if (current !== currency) {
        setCurrency(current);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(checkCurrency, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currency]);

  /**
   * Format amount in current currency
   */
  const formatAmount = useCallback(
    (amount) => {
      return formatCurrency(amount, currency);
    },
    [currency]
  );

  /**
   * Convert amount from USD (base currency) to current currency
   */
  const convertFromUSD = useCallback(
    (amount) => {
      return convertCurrency(amount, 'USD', currency);
    },
    [currency]
  );

  /**
   * Convert amount from current currency to USD (base currency)
   */
  const convertToUSD = useCallback(
    (amount) => {
      return convertCurrency(amount, currency, 'USD');
    },
    [currency]
  );

  /**
   * Format and display amount converted from USD
   */
  const formatFromUSD = useCallback(
    (amount) => {
      const converted = convertFromUSD(amount);
      return formatAmount(converted);
    },
    [convertFromUSD, formatAmount]
  );

  /**
   * Convert and format expense amount in current user currency
   * Handles expenses with originalCurrency field (new system) and legacy USD expenses
   * @param {object} expense - Expense with amount and originalCurrency
   * @returns {string} Formatted currency string
   */
  const formatExpenseAmount = useCallback(
    (expense) => {
      const converted = convertExpenseAmount(expense, currency);
      return formatAmount(converted);
    },
    [currency, formatAmount]
  );

  /**
   * Convert and format budget amount in current user currency
   * Handles budgets with originalCurrency field (new system) and legacy USD budgets
   * @param {object} budget - Budget with amount and originalCurrency
   * @returns {string} Formatted currency string
   */
  const formatBudgetAmount = useCallback(
    (budget) => {
      const converted = convertBudgetAmount(budget, currency);
      return formatAmount(converted);
    },
    [currency, formatAmount]
  );

  return {
    currency,
    formatAmount,
    convertFromUSD,
    convertToUSD,
    formatFromUSD,
    formatExpenseAmount,
    formatBudgetAmount,
    convertExpenseAmount: (expense) => convertExpenseAmount(expense, currency),
    convertBudgetAmount: (budget) => convertBudgetAmount(budget, currency)
  };
};
