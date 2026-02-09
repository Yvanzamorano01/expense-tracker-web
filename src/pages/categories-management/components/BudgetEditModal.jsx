import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useCurrency } from '../../../hooks/useCurrency';

const BudgetEditModal = ({ category, onSave, onCancel, isOpen }) => {
  const { formatAmount } = useCurrency();

  const [budget, setBudget] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (category && isOpen) {
      setBudget(category?.budget?.toString() || '');
      setError('');
    }
  }, [category, isOpen]);

  const handleBudgetChange = (e) => {
    setBudget(e?.target?.value);
    if (error) setError('');
  };

  const validateBudget = () => {
    if (!budget?.trim()) {
      setError('Budget amount is required');
      return false;
    }
    
    const budgetValue = parseFloat(budget);
    if (isNaN(budgetValue) || budgetValue < 0) {
      setError('Budget must be a valid positive number');
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (validateBudget()) {
      onSave(category?.id, parseFloat(budget));
    }
  };

  if (!isOpen || !category) return null;

  const budgetPercentage = category?.budget > 0 ? (category?.spent / category?.budget) * 100 : 0;
  const newBudgetValue = parseFloat(budget) || 0;
  const newPercentage = newBudgetValue > 0 ? (category?.spent / newBudgetValue) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Adjust Budget
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-8 w-8"
            >
              <Icon name="X" size={16} />
            </Button>
          </div>

          {/* Category Info */}
          <div className="flex items-center space-x-3 mb-6 p-3 bg-muted rounded-lg">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: category?.color }}
            >
              <Icon name={category?.icon} size={20} color="white" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{category?.name}</h3>
              <p className="text-sm text-muted-foreground">
                Current spending: {formatAmount(category?.spent || 0)}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Monthly Budget"
              type="number"
              placeholder="Enter budget amount"
              value={budget}
              onChange={handleBudgetChange}
              error={error}
              min="0"
              step="0.01"
              required
            />

            {/* Current vs New Budget Comparison */}
            {budget && !error && (
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-foreground">Budget Comparison</h4>
                
                {/* Current Budget */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Current Budget</span>
                    <span className="text-foreground">{formatAmount(category?.budget || 0)}</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        budgetPercentage >= 100 ? 'bg-red-500' : 
                        budgetPercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {budgetPercentage?.toFixed(1)}% used
                  </p>
                </div>

                {/* New Budget */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">New Budget</span>
                    <span className="text-foreground">{formatAmount(newBudgetValue || 0)}</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        newPercentage >= 100 ? 'bg-red-500' : 
                        newPercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(newPercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {newPercentage?.toFixed(1)}% would be used
                  </p>
                </div>

                {/* Budget Impact */}
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-foreground">
                    Remaining budget: {formatAmount((newBudgetValue || 0) - (category?.spent || 0))}
                  </p>
                  {newPercentage >= 100 && (
                    <p className="text-sm text-red-600 mt-1">
                      ⚠️ This budget is already exceeded by current spending
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
              >
                Update Budget
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BudgetEditModal;