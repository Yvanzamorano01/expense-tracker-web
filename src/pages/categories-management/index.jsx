import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import BottomNavigation from '../../components/ui/BottomNavigation';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import CategoryCard from './components/CategoryCard';
import CategoryForm from './components/CategoryForm';
import BudgetEditModal from './components/BudgetEditModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import CategoryStats from './components/CategoryStats';
import EmptyState from '../../components/ui/EmptyState';
import { loadExpenses, loadCategories, loadBudgets, saveBudget } from '../../utils/storageHelpers';
import { categoryService } from '../../services';
import { useCurrency } from '../../hooks/useCurrency';

const CategoriesManagement = () => {
  const { convertExpenseAmount, convertBudgetAmount } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [reassignCategory, setReassignCategory] = useState('');

  // State for real data
  const [hasData, setHasData] = useState(true);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load categories with stats on mount
  useEffect(() => {
    const loadCategoriesData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current month and year for budget loading
        const currentMonth = new Date().getMonth() + 1; // API uses 1-12
        const currentYear = new Date().getFullYear();

        // Load categories, expenses, and budgets from API
        const [savedCategories, savedExpenses, savedBudgets] = await Promise.all([
          loadCategories(),
          loadExpenses(),
          loadBudgets(currentMonth, currentYear)
        ]);

        console.log('📂 Categories loaded:', savedCategories?.length, 'Budgets:', savedBudgets?.length);

        // Check if we have data
        const hasCategories = savedCategories && savedCategories.length > 0;
        setHasData(hasCategories);

        if (hasCategories) {
          // Create a map of budgets by categoryId
          const budgetMap = new Map();
          savedBudgets.forEach(budget => {
            if (budget.categoryId) {
              budgetMap.set(budget.categoryId.toString(), budget);
            }
          });

          // Calculate stats for each category
          const categoriesWithStats = savedCategories.map(category => {
            // Find expenses for this category (filter by current month)
            const jsMonth = currentMonth - 1; // JavaScript uses 0-11

            const categoryExpenses = savedExpenses.filter(exp => {
              const expDate = new Date(exp.date);
              return parseInt(exp.categoryId) === parseInt(category.id) &&
                     expDate.getMonth() === jsMonth &&
                     expDate.getFullYear() === currentYear;
            });

            const spent = categoryExpenses.reduce((sum, exp) => {
              const convertedAmount = convertExpenseAmount(exp);
              return sum + convertedAmount;
            }, 0);
            const transactionCount = categoryExpenses.length;

            // Get budget for this category
            const categoryBudget = budgetMap.get(category.id.toString());

            // Convert budget amount from its original currency
            const convertedBudgetAmount = categoryBudget
              ? convertBudgetAmount({
                  amount: categoryBudget.amount,
                  originalCurrency: categoryBudget.originalCurrency || 'USD'
                })
              : 0;

            return {
              ...category,
              budget: parseFloat(convertedBudgetAmount.toFixed(2)),
              budgetId: categoryBudget ? categoryBudget.id : null, // Store budgetId for updates
              originalBudget: categoryBudget ? parseFloat(categoryBudget.amount) : 0,
              originalCurrency: categoryBudget ? categoryBudget.originalCurrency : 'USD',
              spent: parseFloat(spent.toFixed(2)),
              transactionCount
            };
          });

          setCategories(categoriesWithStats);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error('❌ Error loading categories:', err);
        setError(err?.message || 'Failed to load categories');
        setHasData(false);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategoriesData();
  }, []);

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    return categories?.filter(category =>
      category?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase())
    );
  }, [categories, searchTerm]);

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = (category) => {
    setSelectedCategory(category);
    setReassignCategory(category?.transactionCount > 0 ? categories?.find(c => c?.id !== category?.id)?.id || '' : null);
    setShowDeleteModal(true);
  };

  const handleBudgetEdit = (category) => {
    setSelectedCategory(category);
    setShowBudgetModal(true);
  };

  const handleSaveCategory = async (categoryData) => {
    try {
      setLoading(true);

      if (selectedCategory) {
        // Filter out budget-related and stats fields before sending to API
        const { budget, budgetId, spent, transactionCount, ...categoryDataOnly } = categoryData;

        // Update existing category via API (only name, color, icon)
        await categoryService.update(parseInt(selectedCategory.id), categoryDataOnly);

        // If budget has changed, save it via budgets API
        let finalBudgetId = budgetId;
        if (categoryData.budget !== selectedCategory.budget) {
          console.log('💰 Budget changed, saving via budgets API...');

          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();

          const savedBudget = await saveBudget({
            amount: categoryData.budget,
            categoryId: parseInt(selectedCategory.id),
            month: currentMonth,
            year: currentYear
          }, selectedCategory.budgetId);

          finalBudgetId = savedBudget.id;
          console.log('✅ Budget saved:', savedBudget);
        }

        // Update local state with all fields including budget and budgetId
        const updatedCategories = categories.map(cat =>
          cat?.id === selectedCategory?.id
            ? { ...cat, ...categoryData, budgetId: finalBudgetId }
            : cat
        );
        setCategories(updatedCategories);

        alert('Category updated successfully!');
      } else {
        // Create new category via API
        const newCategory = await categoryService.create(categoryData);

        // Add to local state with stats
        const categoryWithStats = {
          id: newCategory.categoryId?.toString() || newCategory.id?.toString(),
          name: newCategory.name,
          color: newCategory.color,
          icon: newCategory.icon,
          budget: categoryData.budget || 0,
          spent: 0,
          transactionCount: 0,
          isDefault: false
        };

        setCategories([...categories, categoryWithStats]);
        alert('Category created successfully!');
      }

      setShowCategoryForm(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category: ' + (error.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async (categoryId, newBudget) => {
    try {
      setLoading(true);

      // Get current month and year
      const currentMonth = new Date().getMonth() + 1; // API uses 1-12
      const currentYear = new Date().getFullYear();

      // Find the category to get its budgetId (if exists)
      const category = categories.find(cat => cat?.id === categoryId);

      if (!category) {
        throw new Error('Category not found');
      }

      console.log('💰 Saving budget for category:', category.name, 'Amount:', newBudget, 'Existing budgetId:', category.budgetId);

      // Get current selected currency
      const currentCurrency = localStorage.getItem('selectedCurrency') || 'USD';

      // Save budget via budgets API (create or update)
      const savedBudget = await saveBudget({
        amount: newBudget,
        categoryId: parseInt(categoryId),
        month: currentMonth,
        year: currentYear,
        originalCurrency: currentCurrency // Save budget in current currency
      }, category.budgetId); // Pass existing budgetId for updates

      console.log('✅ Budget saved:', savedBudget);

      // Convert back for display
      const convertedAmount = convertBudgetAmount({
        amount: savedBudget.amount,
        originalCurrency: savedBudget.originalCurrency
      });

      // Update local state
      const updatedCategories = categories.map(cat =>
        cat?.id === categoryId
          ? {
              ...cat,
              budget: parseFloat(convertedAmount.toFixed(2)),
              originalBudget: parseFloat(savedBudget.amount),
              originalCurrency: savedBudget.originalCurrency,
              budgetId: savedBudget.id // Store budgetId for future updates
            }
          : cat
      );

      setCategories(updatedCategories);
      setShowBudgetModal(false);
      setSelectedCategory(null);

      alert('Budget updated successfully!');
    } catch (error) {
      console.error('❌ Error updating budget:', error);
      alert('Failed to update budget: ' + (error.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;

    // Prevent deletion of default/system categories
    if (selectedCategory?.isDefault) {
      alert('Cannot delete default category. This category is required by the system.');
      setShowDeleteModal(false);
      setSelectedCategory(null);
      setReassignCategory(null);
      return;
    }

    try {
      setLoading(true);

      // Check if category has transactions
      if (selectedCategory?.transactionCount > 0) {
        if (!reassignCategory) {
          alert('Please select a category to reassign transactions to');
          setLoading(false);
          return;
        }

        // Note: Reassigning transactions would require a backend endpoint
        console.log(`TODO: Reassign ${selectedCategory?.transactionCount} transactions to category ${reassignCategory}`);
        alert('Warning: Transaction reassignment not yet implemented. Deleting category anyway.');
      }

      // Delete category via API
      await categoryService.delete(parseInt(selectedCategory.id));

      // Update local state
      const updatedCategories = categories.filter(cat => cat?.id !== selectedCategory?.id);
      setCategories(updatedCategories);

      alert('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category: ' + (error.message || 'Please try again'));
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setSelectedCategory(null);
      setReassignCategory('');
    }
  };

  const handleCancelModal = () => {
    setShowCategoryForm(false);
    setShowBudgetModal(false);
    setShowDeleteModal(false);
    setSelectedCategory(null);
    setReassignCategory('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Categories Management - ExpenseTracker Pro</title>
        <meta name="description" content="Manage your expense categories, set budgets, and track spending patterns with comprehensive category organization tools." />
      </Helmet>
      <Header />
      <main className="pt-16 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Categories Management</h1>
                <p className="text-muted-foreground">
                  Organize your expenses with custom categories and budget tracking
                </p>
              </div>
              <Button
                onClick={handleAddCategory}
                iconName="Plus"
                iconPosition="left"
                className="sm:w-auto"
              >
                Add Category
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading categories...</p>
            </div>
          ) : error ? (
            /* Error State */
            <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
              <Icon name="AlertCircle" size={48} className="text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Categories</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : !hasData ? (
            /* Empty State */
            <EmptyState
              icon="FolderOpen"
              title="No Categories Yet"
              description="Start organizing your expenses by creating custom categories and setting budgets."
              actionLabel="Add Your First Expense"
              actionPath="/add-edit-expense"
            />
          ) : (
            <>
              {/* Category Statistics */}
              <CategoryStats categories={categories} />

              {/* Search and Filters */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="search"
                      placeholder="Search categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e?.target?.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Categories Grid */}
              {filteredCategories?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredCategories?.map((category) => (
                    <CategoryCard
                      key={category?.id}
                      category={category}
                      onEdit={handleEditCategory}
                      onDelete={handleDeleteCategory}
                      onBudgetEdit={handleBudgetEdit}
                    />
                  ))}
                </div>
              ) : (
                /* Empty State for Search */
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="Search" size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {searchTerm ? 'No categories found' : 'No categories yet'}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm
                      ? `No categories match "${searchTerm}". Try a different search term.`
                      : 'Create your first category to start organizing your expenses.'
                    }
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={handleAddCategory}
                      iconName="Plus"
                      iconPosition="left"
                    >
                      Add Your First Category
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      {/* Modals */}
      <CategoryForm
        category={selectedCategory}
        onSave={handleSaveCategory}
        onCancel={handleCancelModal}
        isOpen={showCategoryForm}
      />
      <BudgetEditModal
        category={selectedCategory}
        onSave={handleSaveBudget}
        onCancel={handleCancelModal}
        isOpen={showBudgetModal}
      />
      <DeleteConfirmModal
        category={selectedCategory}
        categories={categories}
        reassignCategory={reassignCategory}
        setReassignCategory={setReassignCategory}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelModal}
        isOpen={showDeleteModal}
      />
      <BottomNavigation />
      <FloatingActionButton />
    </div>
  );
};

export default CategoriesManagement;