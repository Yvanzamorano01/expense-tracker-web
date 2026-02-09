import React from 'react';
import Icon from '../../../components/AppIcon';
import { useCurrency } from '../../../hooks/useCurrency';

const BudgetOverview = ({ overallBudget, totalSpent }) => {
  const { formatAmount } = useCurrency();
  const remainingBudget = overallBudget - totalSpent;
  const spentPercentage = overallBudget > 0 ? (totalSpent / overallBudget) * 100 : 0;

  const getStatusColor = () => {
    if (spentPercentage >= 100) return 'text-error';
    if (spentPercentage >= 80) return 'text-warning';
    return 'text-success';
  };

  const getProgressColor = () => {
    if (spentPercentage >= 100) return 'bg-error';
    if (spentPercentage >= 80) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Monthly Budget Overview</h2>
        <div className="flex items-center space-x-2">
          <Icon name="Target" size={20} className="text-primary" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground mb-1">
            {formatAmount(overallBudget)}
          </div>
          <div className="text-sm text-muted-foreground">Total Budget</div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold mb-1 ${getStatusColor()}`}>
            {formatAmount(totalSpent)}
          </div>
          <div className="text-sm text-muted-foreground">Total Spent</div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold mb-1 ${remainingBudget >= 0 ? 'text-success' : 'text-error'}`}>
            {formatAmount(Math.abs(remainingBudget))}
          </div>
          <div className="text-sm text-muted-foreground">
            {remainingBudget >= 0 ? 'Remaining' : 'Over Budget'}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Budget Progress</span>
          <span className={`font-medium ${getStatusColor()}`}>
            {spentPercentage?.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(spentPercentage, 100)}%` }}
          />
        </div>
        {spentPercentage >= 80 && (
          <div className="flex items-center space-x-2 mt-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <Icon name="AlertTriangle" size={16} className="text-warning" />
            <span className="text-sm text-warning">
              {spentPercentage >= 100 
                ? 'Budget exceeded! Consider reviewing your expenses.' :'Approaching budget limit. Monitor spending carefully.'
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetOverview;