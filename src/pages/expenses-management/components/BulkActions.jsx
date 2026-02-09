import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BulkActions = ({ 
  selectedCount, 
  totalCount, 
  onSelectAll, 
  onDeselectAll, 
  onBulkDelete, 
  onBulkEdit,
  isAllSelected 
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Selection Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Icon name="CheckSquare" size={20} className="text-primary" />
            <span className="text-sm font-medium text-foreground">
              {selectedCount} of {totalCount} expense{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isAllSelected ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectAll}
                iconName="CheckSquare"
                iconPosition="left"
              >
                Select All
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeselectAll}
                iconName="Square"
                iconPosition="left"
              >
                Deselect All
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkEdit}
            iconName="Edit2"
            iconPosition="left"
          >
            Edit Selected
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDelete}
            iconName="Trash2"
            iconPosition="left"
          >
            Delete Selected
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;