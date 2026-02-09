import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import ExpenseCard from './ExpenseCard';

const ExpenseList = ({
  expenses,
  categories = [],
  onEdit,
  onDelete,
  selectedExpenses,
  onSelectionChange,
  showBulkActions,
  isLoading
}) => {
  const [displayedExpenses, setDisplayedExpenses] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const itemsPerPage = 20;

  // Initialize displayed expenses
  useEffect(() => {
    if (expenses?.length > 0) {
      setDisplayedExpenses(expenses?.slice(0, itemsPerPage));
      setHasMore(expenses?.length > itemsPerPage);
    } else {
      setDisplayedExpenses([]);
      setHasMore(false);
    }
  }, [expenses]);

  // Load more expenses
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    
    setTimeout(() => {
      const currentLength = displayedExpenses?.length;
      const nextBatch = expenses?.slice(currentLength, currentLength + itemsPerPage);
      
      setDisplayedExpenses(prev => [...prev, ...nextBatch]);
      setHasMore(currentLength + nextBatch?.length < expenses?.length);
      setLoadingMore(false);
    }, 500);
  }, [displayedExpenses?.length, expenses, hasMore, loadingMore]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement?.scrollTop
        >= document.documentElement?.offsetHeight - 1000
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const handleExpenseSelect = (expenseId, isSelected) => {
    const newSelection = isSelected 
      ? [...selectedExpenses, expenseId]
      : selectedExpenses?.filter(id => id !== expenseId);
    
    onSelectionChange(newSelection);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)]?.map((_, index) => (
          <div key={index} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-muted rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (displayedExpenses?.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <Icon name="Receipt" size={32} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No expenses found
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {expenses?.length === 0 
            ? "You haven't added any expenses yet. Start tracking your spending by adding your first expense." :"No expenses match your current filters. Try adjusting your search criteria."
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.href = '/add-edit-expense'}
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Icon name="Plus" size={16} className="mr-2" />
            Add Your First Expense
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedExpenses?.map((expense) => (
        <ExpenseCard
          key={expense?.id}
          expense={expense}
          categories={categories}
          isSelected={selectedExpenses?.includes(expense?.id)}
          onSelect={handleExpenseSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          showBulkActions={showBulkActions}
        />
      ))}
      {/* Load More Indicator */}
      {loadingMore && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Loading more expenses...</span>
          </div>
        </div>
      )}
      {/* End of List Indicator */}
      {!hasMore && displayedExpenses?.length > itemsPerPage && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          <Icon name="CheckCircle" size={16} className="inline mr-2" />
          You've reached the end of your expenses
        </div>
      )}
    </div>
  );
};

export default ExpenseList;