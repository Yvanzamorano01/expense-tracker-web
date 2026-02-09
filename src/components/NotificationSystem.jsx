import React from 'react';
import Icon from './AppIcon';

/**
 * NotificationSystem - Toast notification component
 * Displays notifications in the top-right corner of the screen
 */
const NotificationSystem = ({ notifications, onDismiss }) => {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[2000] space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            bg-card border-2 rounded-lg shadow-lg p-4
            animate-slide-in-right
            ${notification.type === 'error' ? 'border-error' : ''}
            ${notification.type === 'warning' ? 'border-warning' : ''}
            ${notification.type === 'success' ? 'border-success' : ''}
            ${notification.type === 'info' ? 'border-primary' : ''}
          `}
        >
          <div className="flex items-start space-x-3">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${notification.type === 'error' ? 'bg-error/10' : ''}
                ${notification.type === 'warning' ? 'bg-warning/10' : ''}
                ${notification.type === 'success' ? 'bg-success/10' : ''}
                ${notification.type === 'info' ? 'bg-primary/10' : ''}
              `}
            >
              <Icon
                name={
                  notification.type === 'error'
                    ? 'AlertCircle'
                    : notification.type === 'warning'
                    ? 'AlertTriangle'
                    : notification.type === 'success'
                    ? 'CheckCircle'
                    : 'Info'
                }
                size={18}
                className={`
                  ${notification.type === 'error' ? 'text-error' : ''}
                  ${notification.type === 'warning' ? 'text-warning' : ''}
                  ${notification.type === 'success' ? 'text-success' : ''}
                  ${notification.type === 'info' ? 'text-primary' : ''}
                `}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-muted-foreground">
                {notification.message}
              </p>
            </div>

            <button
              onClick={() => onDismiss(notification.id)}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSystem;
