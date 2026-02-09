import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';
import { formatDistanceToNow } from 'date-fns';

/**
 * NotificationCenter Component
 * Dropdown panel showing all notifications
 */

const NotificationItem = ({ notification, onMarkAsRead, onDismiss }) => {
  // Icon and color based on notification type
  const getTypeConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: 'CheckCircle2',
          iconColor: 'text-success',
          bgColor: 'bg-success/10',
        };
      case 'warning':
        return {
          icon: 'AlertTriangle',
          iconColor: 'text-warning',
          bgColor: 'bg-warning/10',
        };
      case 'error':
        return {
          icon: 'XCircle',
          iconColor: 'text-error',
          bgColor: 'bg-error/10',
        };
      case 'exceeded':
        return {
          icon: 'TrendingUp',
          iconColor: 'text-destructive',
          bgColor: 'bg-destructive/10',
        };
      case 'info':
      default:
        return {
          icon: 'Info',
          iconColor: 'text-primary',
          bgColor: 'bg-primary/10',
        };
    }
  };

  const config = getTypeConfig(notification.type);
  const timeAgo = formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true });

  return (
    <div
      className={cn(
        'p-4 border-b border-border hover:bg-muted/50 transition-colors',
        !notification.read && 'bg-primary/5'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('flex-shrink-0 p-2 rounded-lg', config.bgColor)}>
          <Icon name={config.icon} size={18} className={config.iconColor} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-semibold text-sm text-foreground">
              {notification.title}
            </p>
            {!notification.read && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
            )}
          </div>
          {notification.message && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {notification.message}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
            <div className="flex items-center gap-2">
              {!notification.read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Mark as read
                </button>
              )}
              <button
                onClick={() => onDismiss(notification.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss notification"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationCenter = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
  } = useNotifications();

  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-lg shadow-lg overflow-hidden z-[1000]"
    >
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close notifications"
          >
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={clearAll}
                className="text-xs text-destructive hover:text-destructive/80 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="Bell" size={48} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No notifications yet
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDismiss={dismissNotification}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
