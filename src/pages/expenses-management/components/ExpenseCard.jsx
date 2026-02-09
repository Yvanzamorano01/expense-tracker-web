import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { getCategoryInfo } from '../../../utils/dataHelpers';
import { useCurrency } from '../../../hooks/useCurrency';

const ExpenseCard = ({
  expense,
  categories = [],
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  showBulkActions = false
}) => {
  // Get category info using the utility function
  const categoryInfo = getCategoryInfo(expense?.category, categories);
  const { formatExpenseAmount } = useCurrency();

  const getPaymentMethodIcon = (method) => {
    const iconMap = {
      'cash': 'Banknote',
      'credit-card': 'CreditCard',
      'debit-card': 'CreditCard',
      'bank-transfer': 'Building2',
      'digital-wallet': 'Smartphone',
      'check': 'FileText'
    };
    return iconMap?.[method] || 'CreditCard';
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPaymentMethod = (method) => {
    return method?.split('-')?.map(word => 
      word?.charAt(0)?.toUpperCase() + word?.slice(1)
    )?.join(' ');
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
      isSelected ? 'ring-2 ring-primary border-primary' : ''
    }`}>
      <div className="flex items-start justify-between">
        {/* Left Section - Category Icon and Details */}
        <div className="flex items-start space-x-3 flex-1">
          {/* Bulk Selection Checkbox */}
          {showBulkActions && (
            <div className="flex items-center pt-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(expense?.id, e?.target?.checked)}
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-2"
              />
            </div>
          )}

          {/* Category Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: `${categoryInfo.color}20`,
              color: categoryInfo.color
            }}
          >
            <Icon name={categoryInfo.icon} size={20} />
          </div>

          {/* Expense Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-foreground truncate">
                {formatExpenseAmount(expense)}
              </h3>
              <span className="text-sm text-muted-foreground ml-2">
                {formatDate(expense?.date)}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {expense?.description}
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Icon name={categoryInfo.icon} size={12} style={{ color: categoryInfo.color }} />
                <span>{categoryInfo.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name={getPaymentMethodIcon(expense?.paymentMethod)} size={12} />
                <span>{formatPaymentMethod(expense?.paymentMethod)}</span>
              </div>
              {expense?.location && (
                <div className="flex items-center space-x-1">
                  <Icon name="MapPin" size={12} />
                  <span className="truncate max-w-[120px]">{expense.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Action Buttons */}
        <div className="flex items-center space-x-2 ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(expense)}
            className="h-8 w-8"
          >
            <Icon name="Edit2" size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(expense)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Icon name="Trash2" size={16} />
          </Button>
        </div>
      </div>
      {/* Mobile Action Buttons */}
      <div className="lg:hidden mt-3 pt-3 border-t border-border">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(expense)}
            iconName="Edit2"
            iconPosition="left"
            className="flex-1"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(expense)}
            iconName="Trash2"
            iconPosition="left"
            className="flex-1 text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCard;