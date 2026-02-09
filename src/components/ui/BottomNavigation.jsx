import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Expenses', path: '/expenses-management', icon: 'Receipt' },
    { label: 'Budget', path: '/budget-management', icon: 'Target' },
    { label: 'Analytics', path: '/analytics-reports', icon: 'BarChart3' },
    { label: 'More', path: '/settings-preferences', icon: 'MoreHorizontal' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActivePath = (path) => {
    if (path === '/settings-preferences') {
      // More tab is active for settings and categories
      return location?.pathname === '/settings-preferences' || location?.pathname === '/categories-management';
    }
    return location?.pathname === path;
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-navigation">
      <div className="flex items-center justify-around h-16 px-2">
        {navigationItems?.map((item) => (
          <button
            key={item?.path}
            onClick={() => handleNavigation(item?.path)}
            className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-colors duration-150 ${
              isActivePath(item?.path)
                ? 'text-primary' :'text-muted-foreground'
            }`}
          >
            <Icon 
              name={item?.icon} 
              size={20} 
              className={`mb-1 ${isActivePath(item?.path) ? 'text-primary' : 'text-muted-foreground'}`}
            />
            <span className="text-xs font-medium truncate">
              {item?.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;