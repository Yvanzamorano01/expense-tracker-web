import React, { useEffect, useState } from 'react';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';

/**
 * NotificationToast Component
 * Displays slide-in toast notifications
 */

const NotificationToast = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 10);

    // Start slide out animation before removal
    const leaveTimeout = setTimeout(() => {
      setIsLeaving(true);
    }, toast.duration - 300);

    return () => clearTimeout(leaveTimeout);
  }, [toast.duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  // Icon and color based on notification type
  const getTypeConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: 'CheckCircle2',
          bgColor: 'bg-success/10',
          borderColor: 'border-success',
          iconColor: 'text-success',
          textColor: 'text-success',
        };
      case 'warning':
        return {
          icon: 'AlertTriangle',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning',
          iconColor: 'text-warning',
          textColor: 'text-warning',
        };
      case 'error':
        return {
          icon: 'XCircle',
          bgColor: 'bg-error/10',
          borderColor: 'border-error',
          iconColor: 'text-error',
          textColor: 'text-error',
        };
      case 'exceeded':
        return {
          icon: 'TrendingUp',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive',
          iconColor: 'text-destructive',
          textColor: 'text-destructive',
        };
      case 'info':
      default:
        return {
          icon: 'Info',
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary',
          iconColor: 'text-primary',
          textColor: 'text-primary',
        };
    }
  };

  const config = getTypeConfig(toast.type);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 ease-out min-w-[320px] max-w-md',
        config.bgColor,
        config.borderColor,
        'bg-card',
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
      role="alert"
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 mt-0.5', config.iconColor)}>
        <Icon name={config.icon} size={20} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('font-semibold text-sm mb-1', config.textColor)}>
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {toast.message}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Close notification"
      >
        <Icon name="X" size={18} />
      </button>
    </div>
  );
};

/**
 * NotificationToastContainer Component
 * Container for all toast notifications
 */
export const NotificationToastContainer = ({ toasts, onRemoveToast }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="fixed top-20 right-4 z-[1000] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <NotificationToast toast={toast} onRemove={onRemoveToast} />
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
