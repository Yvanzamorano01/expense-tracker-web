import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Notification Context
 * Manages global notification state for in-app notifications
 */

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }, [notifications]);

  /**
   * Add a new notification
   * @param {Object} notification - Notification object
   * @param {string} notification.type - Type: 'success', 'warning', 'error', 'info', 'exceeded'
   * @param {string} notification.title - Notification title
   * @param {string} notification.message - Notification message
   * @param {boolean} notification.showToast - Whether to show toast (default: true)
   * @param {number} notification.duration - Toast duration in ms (default: 5000)
   */
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
      dismissed: false,
      ...notification,
    };

    // Add to notifications list
    setNotifications((prev) => [newNotification, ...prev]);

    // Show toast if requested (default: true)
    if (notification.showToast !== false) {
      const toast = {
        ...newNotification,
        duration: notification.duration || 5000,
      };
      setToasts((prev) => [...prev, toast]);

      // Auto-remove toast after duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration);
    }

    return newNotification.id;
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  }, []);

  /**
   * Dismiss notification (remove from center)
   */
  const dismissNotification = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, dismissed: true } : notif
      )
    );
  }, []);

  /**
   * Remove toast immediately
   */
  const removeToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
    setToasts([]);
  }, []);

  /**
   * Clear old notifications (older than 30 days)
   */
  const clearOldNotifications = useCallback(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    setNotifications((prev) =>
      prev.filter((notif) => new Date(notif.timestamp) > thirtyDaysAgo)
    );
  }, []);

  // Get unread count
  const unreadCount = notifications.filter(
    (notif) => !notif.read && !notif.dismissed
  ).length;

  // Get active notifications (not dismissed)
  const activeNotifications = notifications.filter((notif) => !notif.dismissed);

  const value = {
    notifications: activeNotifications,
    toasts,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    removeToast,
    clearAll,
    clearOldNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
