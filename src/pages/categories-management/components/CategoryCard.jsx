import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useCurrency } from '../../../hooks/useCurrency';

const CategoryCard = ({ category, onEdit, onDelete, onBudgetEdit }) => {
  const { formatAmount } = useCurrency();
  const [showActions, setShowActions] = useState(false);

  const getBudgetStatusColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getBudgetStatusText = (percentage) => {
    if (percentage >= 100) return 'Over Budget';
    if (percentage >= 80) return 'Near Limit';
    return 'On Track';
  };

  const budgetPercentage = category?.budget > 0 ? (category?.spent / category?.budget) * 100 : 0;

  return (
    <div 
      className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow duration-200 relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Category Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: category?.color }}
          >
            <Icon name={category?.icon} size={20} color="white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{category?.name}</h3>
            <p className="text-sm text-muted-foreground">{category?.transactionCount} transactions</p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className={`flex items-center space-x-1 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0 lg:opacity-0'} lg:group-hover:opacity-100`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(category)}
            className="h-8 w-8"
          >
            <Icon name="Edit2" size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(category)}
            className="h-8 w-8 text-red-600 hover:text-red-700"
          >
            <Icon name="Trash2" size={14} />
          </Button>
        </div>
      </div>
      {/* Spending Amount */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {formatAmount(category?.spent || 0)}
          </span>
          <span className="text-sm text-muted-foreground">
            of {formatAmount(category?.budget || 0)}
          </span>
        </div>
      </div>
      {/* Budget Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-foreground">Budget Progress</span>
          <span className={`text-xs px-2 py-1 rounded-full text-white ${getBudgetStatusColor(budgetPercentage)}`}>
            {getBudgetStatusText(budgetPercentage)}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getBudgetStatusColor(budgetPercentage)}`}
            style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {budgetPercentage?.toFixed(1)}% used
          </span>
          <span className="text-xs text-muted-foreground">
            {formatAmount((category?.budget || 0) - (category?.spent || 0))} remaining
          </span>
        </div>
      </div>
      {/* Quick Budget Edit */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onBudgetEdit(category)}
        className="w-full"
        iconName="Target"
        iconPosition="left"
      >
        Adjust Budget
      </Button>
      {/* Mobile Actions */}
      <div className="lg:hidden mt-3 flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(category)}
          className="flex-1"
          iconName="Edit2"
          iconPosition="left"
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(category)}
          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
          iconName="Trash2"
          iconPosition="left"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default CategoryCard;