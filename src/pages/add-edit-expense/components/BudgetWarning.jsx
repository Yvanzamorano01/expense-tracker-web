import React from 'react';
import Icon from '../../../components/AppIcon';

const BudgetWarning = ({ category, currentSpending, budgetLimit, currency }) => {
  if (!budgetLimit || currentSpending < budgetLimit * 0.8) {
    return null;
  }

  const percentage = (currentSpending / budgetLimit) * 100;
  const isOverBudget = percentage >= 100;
  const isNearLimit = percentage >= 80 && percentage < 100;

  const getWarningConfig = () => {
    if (isOverBudget) {
      return {
        icon: 'AlertTriangle',
        iconColor: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/20',
        title: 'Budget Exceeded',
        message: `You've exceeded your ${category} budget by ${formatCurrency(currentSpending - budgetLimit, currency)}`
      };
    }
    
    if (isNearLimit) {
      return {
        icon: 'AlertCircle',
        iconColor: 'text-warning',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/20',
        title: 'Approaching Budget Limit',
        message: `You're at ${Math.round(percentage)}% of your ${category} budget`
      };
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    })?.format(amount);
  };

  const config = getWarningConfig();
  
  if (!config) return null;

  return (
    <div className={`p-4 rounded-lg border ${config?.bgColor} ${config?.borderColor} mb-4`}>
      <div className="flex items-start space-x-3">
        <div className={`w-8 h-8 rounded-full bg-background flex items-center justify-center flex-shrink-0`}>
          <Icon name={config?.icon} size={16} className={config?.iconColor} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground mb-1">
            {config?.title}
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            {config?.message}
          </p>
          
          {/* Budget Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Budget Progress</span>
              <span className="font-medium text-foreground">
                {formatCurrency(currentSpending, currency)} / {formatCurrency(budgetLimit, currency)}
              </span>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverBudget 
                    ? 'bg-destructive' 
                    : isNearLimit 
                    ? 'bg-warning' :'bg-success'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {Math.round(percentage)}% used
              </span>
              {budgetLimit - currentSpending > 0 && (
                <span className="text-success font-medium">
                  {formatCurrency(budgetLimit - currentSpending, currency)} remaining
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetWarning;