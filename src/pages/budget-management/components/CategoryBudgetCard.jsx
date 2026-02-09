import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useCurrency } from '../../../hooks/useCurrency';

const CategoryBudgetCard = ({ category, onBudgetUpdate, currency }) => {
  const { formatAmount } = useCurrency();
  const [isEditing, setIsEditing] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(category?.budget);
  const [alertThreshold, setAlertThreshold] = useState(category?.alertThreshold || 80);

  const spentPercentage = category?.budget > 0 ? (category?.spent / category?.budget) * 100 : 0;

  const getStatusColor = () => {
    if (spentPercentage >= 100) return 'text-error';
    if (spentPercentage >= alertThreshold) return 'text-warning';
    return 'text-success';
  };

  const getProgressColor = () => {
    if (spentPercentage >= 100) return 'bg-error';
    if (spentPercentage >= alertThreshold) return 'bg-warning';
    return 'bg-success';
  };

  const handleSave = () => {
    onBudgetUpdate(category?.id, {
      budget: parseFloat(budgetAmount) || 0,
      alertThreshold: parseInt(alertThreshold) || 80
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setBudgetAmount(category?.budget);
    setAlertThreshold(category?.alertThreshold || 80);
    setIsEditing(false);
  };

  const remaining = category?.budget - category?.spent;

  return (
    <div className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: category?.color + '20' }}
          >
            <Icon name={category?.icon} size={20} style={{ color: category?.color }} />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{category?.name}</h3>
            <p className="text-sm text-muted-foreground">{category?.expenseCount} expenses</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(!isEditing)}
          className="h-8 w-8"
        >
          <Icon name={isEditing ? "X" : "Edit"} size={16} />
        </Button>
      </div>
      {isEditing ? (
        <div className="space-y-4">
          <Input
            label="Budget Amount"
            type="number"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e?.target?.value)}
            placeholder="Enter budget amount"
          />
          <Input
            label="Alert Threshold (%)"
            type="number"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(e?.target?.value)}
            placeholder="Alert when spending reaches"
            min="1"
            max="100"
          />
          <div className="flex space-x-2">
            <Button variant="default" onClick={handleSave} className="flex-1">
              Save
            </Button>
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Budget</span>
            <span className="font-medium text-foreground">{formatAmount(category?.budget || 0)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Spent</span>
            <span className={`font-medium ${getStatusColor()}`}>
              {formatAmount(category?.spent || 0)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Remaining</span>
            <span className={`font-medium ${remaining >= 0 ? 'text-success' : 'text-error'}`}>
              {formatAmount(Math.abs(remaining) || 0)}
              {remaining < 0 && ' over'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className={`font-medium ${getStatusColor()}`}>
                {spentPercentage?.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
          </div>

          {spentPercentage >= alertThreshold && (
            <div className="flex items-center space-x-2 p-2 bg-warning/10 border border-warning/20 rounded-lg">
              <Icon name="AlertTriangle" size={14} className="text-warning" />
              <span className="text-xs text-warning">
                {spentPercentage >= 100 ? 'Budget exceeded' : 'Alert threshold reached'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryBudgetCard;