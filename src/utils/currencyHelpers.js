// Currency conversion utilities

const EXCHANGE_RATES_KEY = 'exchangeRates';

// Default exchange rates (base currency: USD)
const DEFAULT_RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  XAF: 605.0,
  lastUpdated: Date.now()
};

/**
 * Get exchange rates from localStorage, or return defaults
 */
export const getExchangeRates = () => {
  try {
    const stored = localStorage.getItem(EXCHANGE_RATES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading exchange rates:', error);
  }
  return DEFAULT_RATES;
};

/**
 * Save exchange rates to localStorage
 */
export const setExchangeRates = (rates) => {
  try {
    const updatedRates = {
      ...rates,
      lastUpdated: Date.now()
    };
    localStorage.setItem(EXCHANGE_RATES_KEY, JSON.stringify(updatedRates));
    return true;
  } catch (error) {
    console.error('Error saving exchange rates:', error);
    return false;
  }
};

/**
 * Reset exchange rates to defaults
 */
export const resetExchangeRates = () => {
  return setExchangeRates(DEFAULT_RATES);
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {number} Converted amount
 */
export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (!amount || isNaN(amount)) return 0;
  if (fromCurrency === toCurrency) return parseFloat(amount);

  const rates = getExchangeRates();

  // Convert to USD first (base currency)
  const amountInUSD = parseFloat(amount) / rates[fromCurrency];

  // Then convert to target currency
  const convertedAmount = amountInUSD * rates[toCurrency];

  return convertedAmount;
};

/**
 * Format amount in specified currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(0);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parseFloat(amount));
};

/**
 * Get current user's selected currency from localStorage
 */
export const getCurrentCurrency = () => {
  try {
    const currency = localStorage.getItem('selectedCurrency');
    return currency || 'USD';
  } catch (error) {
    console.error('Error getting current currency:', error);
    return 'USD';
  }
};

/**
 * Get default exchange rates
 */
export const getDefaultRates = () => {
  return { ...DEFAULT_RATES };
};

/**
 * Get currency symbol for a given currency code
 */
export const getCurrencySymbol = (currency) => {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    XAF: 'FCFA'
  };
  return symbols[currency] || currency;
};

/**
 * Get available currencies
 */
export const getAvailableCurrencies = () => {
  return ['USD', 'EUR', 'GBP', 'XAF'];
};

/**
 * Convert expense amount from its original currency to target currency
 * Handles both new expenses (with originalCurrency) and legacy expenses (stored as USD)
 * @param {object} expense - Expense object with amount and originalCurrency
 * @param {string} targetCurrency - Target currency code
 * @returns {number} Converted amount
 */
export const convertExpenseAmount = (expense, targetCurrency) => {
  if (!expense || !expense.amount) return 0;

  // Get the original currency (default to USD for legacy expenses)
  const fromCurrency = expense.originalCurrency || 'USD';

  // If already in target currency, return as-is (no precision loss)
  if (fromCurrency === targetCurrency) {
    return parseFloat(expense.amount);
  }

  // Convert from original currency to target currency
  return convertCurrency(expense.amount, fromCurrency, targetCurrency);
};

/**
 * Convert budget amount from its original currency to target currency
 * Handles both new budgets (with originalCurrency) and legacy budgets (assumed USD)
 * @param {object} budget - Budget object with amount and originalCurrency
 * @param {string} targetCurrency - Target currency code
 * @returns {number} Converted amount
 */
export const convertBudgetAmount = (budget, targetCurrency) => {
  if (!budget || !budget.amount) return 0;

  // Get the original currency (default to USD for legacy budgets)
  const fromCurrency = budget.originalCurrency || 'USD';

  // If already in target currency, return as-is (no precision loss)
  if (fromCurrency === targetCurrency) {
    return parseFloat(budget.amount);
  }

  // Convert from original currency to target currency
  return convertCurrency(budget.amount, fromCurrency, targetCurrency);
};
