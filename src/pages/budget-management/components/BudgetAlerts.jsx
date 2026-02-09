import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const BudgetAlerts = ({ alerts, onAlertUpdate, onAlertDismiss }) => {
  const [alertSettings, setAlertSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: false,
    monthlyReports: true
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('budgetAlertSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setAlertSettings(parsed);
      } catch (error) {
        console.error('Error loading budget alert settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('budgetAlertSettings', JSON.stringify(alertSettings));
  }, [alertSettings]);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'exceeded':
        return 'AlertCircle';
      case 'warning':
        return 'AlertTriangle';
      case 'info':
        return 'Info';
      default:
        return 'Bell';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'exceeded':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      case 'info':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getAlertBg = (type) => {
    switch (type) {
      case 'exceeded':
        return 'bg-error/10 border-error/20';
      case 'warning':
        return 'bg-warning/10 border-warning/20';
      case 'info':
        return 'bg-primary/10 border-primary/20';
      default:
        return 'bg-muted/50 border-border';
    }
  };

  const handleSettingChange = (setting, value) => {
    setAlertSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const alertDate = new Date(date);
    const diffInMinutes = Math.floor((now - alertDate) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Budget Alerts</h3>
        <div className="flex items-center space-x-2">
          <Icon name="Bell" size={20} className="text-primary" />
          <span className="text-sm text-muted-foreground">
            {alerts?.filter(alert => !alert?.dismissed)?.length} active
          </span>
        </div>
      </div>
      {/* Active Alerts */}
      <div className="space-y-3 mb-6">
        {alerts?.filter(alert => !alert?.dismissed)?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="CheckCircle" size={48} className="text-success mx-auto mb-3" />
            <p className="text-muted-foreground">No active alerts</p>
            <p className="text-sm text-muted-foreground">Your budgets are on track!</p>
          </div>
        ) : (
          alerts?.filter(alert => !alert?.dismissed)?.map((alert) => (
              <div
                key={alert?.id}
                className={`p-4 rounded-lg border ${getAlertBg(alert?.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Icon 
                      name={getAlertIcon(alert?.type)} 
                      size={20} 
                      className={getAlertColor(alert?.type)} 
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">
                        {alert?.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert?.message}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{alert?.category}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(alert?.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAlertDismiss(alert?.id)}
                    className="h-8 w-8 ml-2"
                  >
                    <Icon name="X" size={16} />
                  </Button>
                </div>
                
                {alert?.actions && alert?.actions?.length > 0 && (
                  <div className="flex space-x-2 mt-3 pt-3 border-t border-border/50">
                    {alert?.actions?.map((action, index) => (
                      <Button
                        key={index}
                        variant={index === 0 ? "default" : "outline"}
                        size="sm"
                        onClick={() => action?.onClick()}
                      >
                        {action?.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))
        )}
      </div>
      {/* Alert Settings */}
      <div className="pt-6 border-t border-border">
        <h4 className="font-medium text-foreground mb-4">Notification Settings</h4>
        <div className="space-y-3">
          <Checkbox
            label="Email notifications for budget alerts"
            description="Receive email alerts when budgets reach thresholds"
            checked={alertSettings?.emailNotifications}
            onChange={(e) => handleSettingChange('emailNotifications', e?.target?.checked)}
          />
          
          <Checkbox
            label="Push notifications"
            description="Get instant notifications on your device"
            checked={alertSettings?.pushNotifications}
            onChange={(e) => handleSettingChange('pushNotifications', e?.target?.checked)}
          />
          
          <Checkbox
            label="Weekly budget reports"
            description="Receive weekly spending summaries"
            checked={alertSettings?.weeklyReports}
            onChange={(e) => handleSettingChange('weeklyReports', e?.target?.checked)}
          />
          
          <Checkbox
            label="Monthly budget reports"
            description="Get detailed monthly budget analysis"
            checked={alertSettings?.monthlyReports}
            onChange={(e) => handleSettingChange('monthlyReports', e?.target?.checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default BudgetAlerts;