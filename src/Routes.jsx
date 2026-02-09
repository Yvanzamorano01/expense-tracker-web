import React, { useEffect } from "react";
import { HashRouter, Routes as RouterRoutes, Route, useNavigate } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import SettingsPreferences from './pages/settings-preferences';
import BudgetManagement from './pages/budget-management';
import ExpensesManagement from './pages/expenses-management';
import Dashboard from './pages/dashboard';
import CategoriesManagement from './pages/categories-management';
import AddEditExpense from './pages/add-edit-expense';
import AnalyticsReports from './pages/analytics-reports';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Navigation listener for Electron menu navigation events
const ElectronNavigationListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if running in Electron
    if (window.electronAPI?.isElectron) {
      // Listen for navigation events from main process
      window.electronAPI.onNavigate((route) => {
        navigate(route);
      });

      // Cleanup listener on unmount
      return () => {
        window.electronAPI.removeNavigateListener();
      };
    }
  }, [navigate]);

  return null;
};

// Global hooks provider - wraps routes to provide Router context
const GlobalHooksProvider = ({ children }) => {
  useKeyboardShortcuts();
  return children;
};

const Routes = () => {
  return (
    <HashRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <ElectronNavigationListener />
        <GlobalHooksProvider>
          <RouterRoutes>
            {/* Define your route here */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings-preferences" element={<SettingsPreferences />} />
            <Route path="/budget-management" element={<BudgetManagement />} />
            <Route path="/expenses-management" element={<ExpensesManagement />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/categories-management" element={<CategoriesManagement />} />
            <Route path="/add-edit-expense" element={<AddEditExpense />} />
            <Route path="/analytics-reports" element={<AnalyticsReports />} />
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </GlobalHooksProvider>
      </ErrorBoundary>
    </HashRouter>
  );
};

export default Routes;
