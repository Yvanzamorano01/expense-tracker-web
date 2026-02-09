import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { useCurrency } from '../../../hooks/useCurrency';

const DeleteConfirmModal = ({
  category,
  categories,
  reassignCategory,
  setReassignCategory,
  onConfirm,
  onCancel,
  isOpen
}) => {
  const { formatAmount } = useCurrency();

  if (!isOpen || !category) return null;

  const hasTransactions = category?.transactionCount > 0;
  const otherCategories = categories?.filter(cat => cat?.id !== category?.id);

  const reassignOptions = otherCategories?.map(cat => ({
    value: cat?.id,
    label: cat?.name,
    description: `${cat?.transactionCount} transactions`
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Icon name="AlertTriangle" size={24} color="#DC2626" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Delete Category
              </h2>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone
              </p>
            </div>
          </div>

          {/* Category Info */}
          <div className="flex items-center space-x-3 mb-4 p-3 bg-muted rounded-lg">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: category?.color }}
            >
              <Icon name={category?.icon} size={20} color="white" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{category?.name}</h3>
              <p className="text-sm text-muted-foreground">
                {category?.transactionCount} transactions • {formatAmount(category?.spent || 0)} spent
              </p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="mb-4">
            <p className="text-sm text-foreground mb-2">
              {hasTransactions 
                ? `This category has ${category?.transactionCount} transaction${category?.transactionCount !== 1 ? 's' : ''}. What would you like to do with them?`
                : 'Are you sure you want to delete this category?'
              }
            </p>
          </div>

          {/* Reassignment Options */}
          {hasTransactions && (
            <div className="mb-6">
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="radio"
                    name="reassign"
                    value="reassign"
                    checked={reassignCategory !== null}
                    onChange={() => setReassignCategory(otherCategories?.[0]?.id || '')}
                    className="text-primary"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Reassign to another category</p>
                    <p className="text-sm text-muted-foreground">Move all transactions to a different category</p>
                  </div>
                </label>

                {reassignCategory !== null && (
                  <div className="ml-6">
                    <Select
                      placeholder="Select category"
                      options={reassignOptions}
                      value={reassignCategory}
                      onChange={setReassignCategory}
                    />
                  </div>
                )}

                <label className="flex items-center space-x-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="radio"
                    name="reassign"
                    value="delete"
                    checked={reassignCategory === null}
                    onChange={() => setReassignCategory(null)}
                    className="text-primary"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Delete all transactions</p>
                    <p className="text-sm text-red-600">⚠️ This will permanently delete all transaction data</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="flex-1"
            >
              Delete Category
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;