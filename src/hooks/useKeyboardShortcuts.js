import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * useKeyboardShortcuts Hook
 * Implements global keyboard shortcuts for the application
 * Shortcuts:
 * - Ctrl/Cmd + N: Add new expense
 * - Ctrl/Cmd + D: Go to dashboard
 * - Ctrl/Cmd + ,: Go to settings
 * - Ctrl/Cmd + F: Focus search input (if available)
 */
export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Check if keyboard shortcuts are enabled
      const settings = localStorage.getItem('accessibilitySettings');
      const keyboardEnabled = settings
        ? JSON.parse(settings).keyboardShortcuts !== false
        : true;

      if (!keyboardEnabled) return;

      // Don't trigger if user is typing in an input/textarea
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        // Exception: Allow Ctrl+F even in inputs for global search
        if (!((e.ctrlKey || e.metaKey) && e.key === 'f')) {
          return;
        }
      }

      // Ctrl/Cmd + N - Add new expense
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        navigate('/add-edit-expense');
      }

      // Ctrl/Cmd + D - Dashboard
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        navigate('/dashboard');
      }

      // Ctrl/Cmd + , - Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        navigate('/settings-preferences');
      }

      // Ctrl/Cmd + F - Focus search (if exists on current page)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        const searchInput = document.querySelector(
          'input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]'
        );
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }

      // Ctrl/Cmd + E - Go to expenses management
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        navigate('/expenses-management');
      }

      // Ctrl/Cmd + A - Go to analytics (only if not in an input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        if (
          e.target.tagName !== 'INPUT' &&
          e.target.tagName !== 'TEXTAREA' &&
          !e.target.isContentEditable
        ) {
          e.preventDefault();
          navigate('/analytics-reports');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);
};
