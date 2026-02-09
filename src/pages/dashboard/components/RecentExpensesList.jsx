import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { getCategoryInfo } from '../../../utils/dataHelpers';
import { useCurrency } from '../../../hooks/useCurrency';

const RecentExpensesList = ({ expenses = [], categories = [] }) => {
  const navigate = useNavigate();
  const { formatExpenseAmount } = useCurrency();

  const recentExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    console.log('🔍 DEBUG RecentExpensesList - Raw expenses:', expenses);

    // Sort by date (most recent first) and take top 5
    return [...expenses]
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 5)
      .map(expense => {
        console.log('🔍 DEBUG RecentExpensesList - Processing expense:', expense.id, 'location:', expense.location);

        // Handle category - could be string or object from API
        const categoryName = typeof expense.category === 'string'
          ? expense.category
          : expense.category?.name || 'Other';

        const categoryInfo = getCategoryInfo(categoryName, categories);

        const transformedExpense = {
          ...expense,
          categoryName: categoryName,
          categoryIcon: categoryInfo.icon,
          categoryColor: categoryInfo.color,
          date: new Date(expense.date || expense.createdAt)
        };

        console.log('🔍 DEBUG RecentExpensesList - Transformed expense:', transformedExpense.id, 'location:', transformedExpense.location);

        return transformedExpense;
      });
  }, [expenses, categories]);

  const formatDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date?.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date?.getFullYear() !== now?.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Extract hours and minutes directly to avoid timezone issues
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleEditExpense = (expense) => {
    navigate('/add-edit-expense', { state: { expense } });
  };

  const handleViewAllExpenses = () => {
    navigate('/expenses-management');
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Recent Expenses</h3>
          <p className="text-sm text-muted-foreground">Your latest spending activity</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewAllExpenses}
          iconName="ArrowRight"
          iconPosition="right"
          iconSize={16}
        >
          View All
        </Button>
      </div>
      <div className="space-y-4">
        {recentExpenses?.map((expense) => (
          <div 
            key={expense?.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors duration-150 group"
          >
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              {/* Category Icon */}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${expense?.categoryColor}20` }}
              >
                <Icon 
                  name={expense?.categoryIcon} 
                  size={20} 
                  style={{ color: expense?.categoryColor }}
                />
              </div>

              {/* Expense Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-foreground truncate">
                    {expense?.description}
                  </h4>
                  <span className="text-lg font-bold text-foreground ml-4">
                    {formatExpenseAmount(expense)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Icon name="Tag" size={12} />
                    <span>{expense?.categoryName || 'Other'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Icon name="CreditCard" size={12} />
                    <span>{expense?.paymentMethod || 'Cash'}</span>
                  </div>
                  {expense?.location && (
                    <div className="flex items-center space-x-1">
                      <Icon name="MapPin" size={12} />
                      <span className="truncate">{expense?.location}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Icon name="Clock" size={12} />
                    <span>{formatDate(expense?.date)} at {formatTime(expense?.date)}</span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditExpense(expense)}
                    iconName="Edit2"
                    iconSize={14}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {recentExpenses?.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Receipt" size={24} className="text-muted-foreground" />
          </div>
          <h4 className="text-sm font-medium text-foreground mb-2">No expenses yet</h4>
          <p className="text-sm text-muted-foreground mb-4">Start tracking your expenses to see them here</p>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/add-edit-expense')}
            iconName="Plus"
            iconPosition="left"
            iconSize={16}
          >
            Add First Expense
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecentExpensesList;