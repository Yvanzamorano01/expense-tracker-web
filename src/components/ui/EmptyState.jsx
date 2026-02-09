import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const EmptyState = ({
  icon = 'Inbox',
  title = 'No Data Yet',
  description = 'Start adding data to see it here.',
  actionLabel = 'Add Data',
  actionPath = '/add-edit-expense',
  iconSize = 64
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md text-center">
        <Icon name={icon} size={iconSize} className="text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6">
          {description}
        </p>
        {actionLabel && actionPath && (
          <Button
            onClick={() => navigate(actionPath)}
            iconName="Plus"
            iconPosition="left"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
