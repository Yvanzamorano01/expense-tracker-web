import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useCurrency } from '../../../hooks/useCurrency';

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  expense,
  selectedCount = 0,
  isLoading = false
}) => {
  if (!isOpen) return null;

  const { formatExpenseAmount } = useCurrency();

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCategoryName = (category) => {
    // Handle category - could be string or object from API
    let categoryName = '';
    if (typeof category === 'string') {
      categoryName = category;
    } else if (typeof category === 'object' && category !== null) {
      categoryName = category.name || 'Other';
    } else {
      return 'Other';
    }

    // Format the category name (split by dash and capitalize)
    return categoryName?.split('-')?.map(word =>
      word?.charAt(0)?.toUpperCase() + word?.slice(1)
    )?.join(' ');
  };

  const isBulkDelete = selectedCount > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-modal">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
              <Icon name="AlertTriangle" size={20} className="text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {isBulkDelete ? 'Delete Multiple Expenses' : 'Delete Expense'}
              </h2>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <Icon name="X" size={16} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isBulkDelete ? (
            <div className="space-y-4">
              <p className="text-foreground">
                Are you sure you want to delete <span className="font-semibold">{selectedCount}</span> selected expense{selectedCount !== 1 ? 's' : ''}?
              </p>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Icon name="Info" size={16} />
                  <span>All selected expenses will be permanently removed from your records.</span>
                </div>
              </div>
            </div>
          ) : expense ? (
            <div className="space-y-4">
              <p className="text-foreground">
                Are you sure you want to delete this expense? This action cannot be undone.
              </p>
              
              {/* Expense Details */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-semibold text-foreground">
                    {formatExpenseAmount(expense)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <span className="text-foreground">
                    {formatCategoryName(expense?.category)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <span className="text-foreground">
                    {formatDate(expense?.date)}
                  </span>
                </div>
                {expense?.description && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Description:</span>
                    <p className="text-foreground text-sm">
                      {expense?.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            loading={isLoading}
            iconName="Trash2"
            iconPosition="left"
          >
            {isBulkDelete ? `Delete ${selectedCount} Expense${selectedCount !== 1 ? 's' : ''}` : 'Delete Expense'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;