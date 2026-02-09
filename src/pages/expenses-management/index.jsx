import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import BottomNavigation from '../../components/ui/BottomNavigation';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import ExpenseFilters from './components/ExpenseFilters';
import ExpenseList from './components/ExpenseList';
import BulkActions from './components/BulkActions';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import EmptyState from '../../components/ui/EmptyState';
import { isDataCleared } from '../../utils/dataHelpers';
import { loadExpenses, loadCategories, deleteExpense } from '../../utils/storageHelpers';

const ExpensesManagement = () => {
  const navigate = useNavigate();

  // Check if data was cleared
  const hasData = !isDataCleared();

  // State management - load real expenses from API
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    sortBy: 'date-desc'
  });
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    expense: null,
    isLoading: false
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load expenses from API on mount
  useEffect(() => {
    const loadExpensesData = async () => {
      try {
        console.log('💰 Expenses Management - Loading data...');

        const [savedExpenses, savedCategories] = await Promise.all([
          loadExpenses(),
          loadCategories()
        ]);

        console.log('💰 Expenses Management loaded - Expenses:', savedExpenses?.length, 'Categories:', savedCategories?.length);

        setExpenses(savedExpenses || []);
        setCategories(savedCategories || []);
      } catch (error) {
        console.error('❌ Error loading expenses:', error);
        console.error('Error stack:', error?.stack);
        // Set empty arrays instead of crashing
        setExpenses([]);
        setCategories([]);
      }
    };

    loadExpensesData();

    // Listen for storage changes (when expenses are added/updated/deleted)
    const handleStorageChange = (e) => {
      if (e?.key === 'expenses' || e?.key === 'dataCleared') {
        console.log('🔄 Expenses Management - Storage change detected');
        loadExpensesData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab updates
    const handleCustomUpdate = () => {
      console.log('🔄 Expenses Management - Update event received');
      loadExpensesData();
    };
    window.addEventListener('expensesUpdated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('expensesUpdated', handleCustomUpdate);
    };
  }, []);

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    // Safety check: ensure expenses is an array
    if (!expenses || !Array.isArray(expenses)) {
      console.warn('⚠️ Expenses is not an array:', expenses);
      return [];
    }

    let filtered = [...expenses];

    // Search filter
    if (filters?.search) {
      const searchTerm = filters?.search?.toLowerCase();
      filtered = filtered?.filter(expense => {
        if (!expense) return false;
        try {
          const desc = (expense.description || '').toString().toLowerCase();
          const cat = (expense.category || '').toString().toLowerCase();
          const amt = (expense.amount?.toString() || '');
          return desc.includes(searchTerm) ||
                 amt.includes(searchTerm) ||
                 cat.includes(searchTerm);
        } catch (e) {
          console.error('Error filtering expense:', e, expense);
          return false;
        }
      });
    }

    // Category filter
    if (filters?.category) {
      filtered = filtered?.filter(expense => expense?.category === filters?.category);
    }

    // Payment method filter
    if (filters?.paymentMethod) {
      filtered = filtered?.filter(expense => expense?.paymentMethod === filters?.paymentMethod);
    }

    // Date range filter
    if (filters?.dateFrom) {
      filtered = filtered?.filter(expense => expense?.date >= filters?.dateFrom);
    }
    if (filters?.dateTo) {
      filtered = filtered?.filter(expense => expense?.date <= filters?.dateTo);
    }

    // Amount range filter
    if (filters?.amountMin) {
      filtered = filtered?.filter(expense => expense?.amount >= parseFloat(filters?.amountMin));
    }
    if (filters?.amountMax) {
      filtered = filtered?.filter(expense => expense?.amount <= parseFloat(filters?.amountMax));
    }

    // Sort
    if (filtered && filtered.length > 0) {
      filtered.sort((a, b) => {
        // Ensure both a and b exist
        if (!a || !b) return 0;

        switch (filters?.sortBy) {
          case 'date-desc':
            return new Date(b.date || 0) - new Date(a.date || 0);
          case 'date-asc':
            return new Date(a.date || 0) - new Date(b.date || 0);
          case 'amount-desc':
            return (b?.amount || 0) - (a?.amount || 0);
          case 'amount-asc':
            return (a?.amount || 0) - (b?.amount || 0);
          case 'category-asc':
            return (a?.category || '').localeCompare(b?.category || '');
          case 'category-desc':
            return (b?.category || '').localeCompare(a?.category || '');
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [expenses, filters]);

  // Handle filter changes with debounce for search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const handleFiltersChange = (newFilters) => {
    if (newFilters?.search !== filters?.search) {
      setIsLoading(true);
    }
    setFilters(newFilters);
    setSelectedExpenses([]); // Clear selection when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
      paymentMethod: '',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
      sortBy: 'date-desc'
    });
    setSelectedExpenses([]);
  };

  const handleEditExpense = (expense) => {
    navigate('/add-edit-expense', { state: { expense } });
  };

  const handleDeleteExpense = (expense) => {
    setDeleteModal({
      isOpen: true,
      expense,
      isLoading: false
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      if (deleteModal?.expense) {
        // Delete single expense via API
        await deleteExpense(deleteModal.expense.id);
      } else if (selectedExpenses?.length > 0) {
        // Delete multiple expenses via API
        await Promise.all(
          selectedExpenses.map(id => deleteExpense(id))
        );
      }

      // Reload expenses
      const savedExpenses = await loadExpenses();
      setExpenses(savedExpenses);

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('expensesUpdated'));

      setDeleteModal({ isOpen: false, expense: null, isLoading: false });
      setSelectedExpenses([]);
    } catch (error) {
      console.error('Error deleting expense(s):', error);
      alert('Failed to delete expense(s). Please try again.');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleBulkDelete = () => {
    setDeleteModal({
      isOpen: true,
      expense: null,
      isLoading: false
    });
  };

  const handleBulkEdit = () => {
    // Navigate to bulk edit page or show bulk edit modal
    console.log('Bulk edit expenses:', selectedExpenses);
  };

  const handleSelectAll = () => {
    setSelectedExpenses(filteredExpenses?.map(expense => expense?.id));
  };

  const handleDeselectAll = () => {
    setSelectedExpenses([]);
  };

  const toggleBulkActions = () => {
    setShowBulkActions(!showBulkActions);
    setSelectedExpenses([]);
  };

  const isAllSelected = selectedExpenses?.length === filteredExpenses?.length && filteredExpenses?.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                Expenses Management
              </h1>
              <p className="text-muted-foreground">
                Track, filter, and manage all your expenses in one place
              </p>
            </div>
            
            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
              <Button
                variant="outline"
                onClick={toggleBulkActions}
                iconName={showBulkActions ? "X" : "CheckSquare"}
                iconPosition="left"
              >
                {showBulkActions ? 'Cancel' : 'Select Multiple'}
              </Button>
              <Button
                onClick={() => navigate('/add-edit-expense')}
                iconName="Plus"
                iconPosition="left"
                className="hidden lg:inline-flex"
              >
                Add Expense
              </Button>
            </div>
          </div>

          {/* Filters */}
          <ExpenseFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            resultCount={filteredExpenses?.length}
            isLoading={isLoading}
            categories={categories}
          />

          {/* Bulk Actions */}
          {showBulkActions && (
            <BulkActions
              selectedCount={selectedExpenses?.length}
              totalCount={filteredExpenses?.length}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onBulkDelete={handleBulkDelete}
              onBulkEdit={handleBulkEdit}
              isAllSelected={isAllSelected}
            />
          )}

          {/* Expenses List or Empty State */}
          {!hasData ? (
            <EmptyState
              icon="Receipt"
              title="No Expenses Yet"
              description="Start tracking your expenses by adding your first transaction."
              actionLabel="Add Your First Expense"
              actionPath="/add-edit-expense"
            />
          ) : (
            <ExpenseList
              expenses={filteredExpenses}
              categories={categories}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              selectedExpenses={selectedExpenses}
              onSelectionChange={setSelectedExpenses}
              showBulkActions={showBulkActions}
              isLoading={isLoading}
            />
          )}
        </div>
      </main>
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal?.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, expense: null, isLoading: false })}
        onConfirm={handleConfirmDelete}
        expense={deleteModal?.expense}
        selectedCount={selectedExpenses?.length}
        isLoading={deleteModal?.isLoading}
      />
      <FloatingActionButton />
      <BottomNavigation />
    </div>
  );
};

export default ExpensesManagement;