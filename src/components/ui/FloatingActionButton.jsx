import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const FloatingActionButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Show FAB on relevant screens
  const showOnPaths = ['/dashboard', '/expenses-management'];
  const shouldShow = showOnPaths?.includes(location?.pathname);

  const handleClick = () => {
    navigate('/add-edit-expense');
  };

  if (!shouldShow) return null;

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ease-out z-fab group"
      aria-label="Add new expense"
    >
      <div className="flex items-center justify-center w-full h-full">
        <Icon 
          name="Plus" 
          size={24} 
          className="transition-transform duration-150 group-hover:scale-110" 
        />
      </div>
    </button>
  );
};

export default FloatingActionButton;