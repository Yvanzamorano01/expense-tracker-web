import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';


const QuickActions = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      id: 'add-expense',
      title: 'Add Expense',
      description: 'Record a new expense',
      icon: 'Plus',
      color: 'primary',
      path: '/add-edit-expense'
    },
    {
      id: 'view-budget',
      title: 'View Budget',
      description: 'Check budget status',
      icon: 'Target',
      color: 'success',
      path: '/budget-management'
    },
    {
      id: 'categories',
      title: 'Categories',
      description: 'Manage expense categories',
      icon: 'Tags',
      color: 'warning',
      path: '/categories-management'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View detailed reports',
      icon: 'BarChart3',
      color: 'secondary',
      path: '/analytics-reports'
    }
  ];

  const colorClasses = {
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    success: 'bg-success hover:bg-success/90 text-success-foreground',
    warning: 'bg-warning hover:bg-warning/90 text-warning-foreground',
    secondary: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground'
  };

  const handleActionClick = (path) => {
    navigate(path);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Fast access to common tasks</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions?.map((action) => (
          <button
            key={action?.id}
            onClick={() => handleActionClick(action?.path)}
            className={`p-4 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md ${colorClasses?.[action?.color]}`}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Icon name={action?.icon} size={24} />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">{action?.title}</h4>
                <p className="text-xs opacity-90">{action?.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;