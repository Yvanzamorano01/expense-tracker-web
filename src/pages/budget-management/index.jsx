import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import BottomNavigation from '../../components/ui/BottomNavigation';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import BudgetOverview from './components/BudgetOverview';
import CategoryBudgetCard from './components/CategoryBudgetCard';
import BudgetHistory from './components/BudgetHistory';
import BudgetAlerts from './components/BudgetAlerts';
import BudgetTemplates from './components/BudgetTemplates';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { loadExpenses, loadCategories, loadBudgets, saveBudget } from '../../utils/storageHelpers';
import { useNotifications } from '../../contexts/NotificationContext';
import { useCurrency } from '../../hooks/useCurrency';

const BudgetManagement = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { formatAmount, convertExpenseAmount, convertBudgetAmount } = useCurrency();
  const [currency, setCurrency] = useState('USD');
  const [activeTab, setActiveTab] = useState('overview');

  // State for real data
  const [hasData, setHasData] = useState(true);
  const [overallBudget, setOverallBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data on mount
  useEffect(() => {
    const loadBudgetData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current month and year
        const currentMonth = new Date().getMonth() + 1; // API uses 1-12
        const currentYear = new Date().getFullYear();

        // Load categories, expenses, and budgets from API
        const [savedCategories, savedExpenses, savedBudgets] = await Promise.all([
          loadCategories(),
          loadExpenses(),
          loadBudgets(currentMonth, currentYear)
        ]);

        console.log('💰 Budget data loaded - Categories:', savedCategories?.length, 'Expenses:', savedExpenses?.length, 'Budgets:', savedBudgets?.length);

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

          // Calculate stats for each category (current month)
          const categoriesWithStats = savedCategories.map(category => {
            const categoryExpenses = savedExpenses.filter(exp => {
              const expDate = new Date(exp.date);
              return parseInt(exp.categoryId) === parseInt(category.id) &&
                     expDate.getMonth() === currentMonth - 1 && // JavaScript uses 0-11
                     expDate.getFullYear() === currentYear;
            });

            const spent = categoryExpenses.reduce((sum, exp) => {
              const convertedAmount = convertExpenseAmount(exp);
              return sum + convertedAmount;
            }, 0);

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
              transactionCount: categoryExpenses.length
            };
          });

          setCategories(categoriesWithStats);

          // Calculate overall budget
          const budget = categoriesWithStats.reduce((sum, cat) => sum + (parseFloat(cat.budget) || 0), 0);

          // Calculate total spent (including ALL expenses, not just categorized ones)
          const monthlyExpenses = savedExpenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === currentMonth - 1 &&
                   expDate.getFullYear() === currentYear;
          });
          const spent = monthlyExpenses.reduce((sum, exp) => {
            const convertedAmount = convertExpenseAmount(exp);
            return sum + convertedAmount;
          }, 0);

          setOverallBudget(budget);
          setTotalSpent(spent);

          // Generate budget history for last 12 months
          const history = [];
          for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.toLocaleDateString('en-US', { month: 'short' });

            // Calculate spent for that month
            const monthExpenses = savedExpenses.filter(exp => {
              const expDate = new Date(exp.date);
              return expDate.getMonth() === date.getMonth() &&
                     expDate.getFullYear() === date.getFullYear();
            });
            const monthSpent = monthExpenses.reduce((sum, exp) => {
              const convertedAmount = convertExpenseAmount(exp);
              return sum + convertedAmount;
            }, 0);

            // Use current overall budget as historical budget (simplified)
            const monthBudget = budget > 0 ? budget : 3500;

            history.push({
              month,
              budget: parseFloat(monthBudget.toFixed(2)),
              spent: parseFloat(monthSpent.toFixed(2)),
              year: date.getFullYear()
            });
          }

          setBudgetHistory(history);

          // Generate alerts for overspending
          const generatedAlerts = categoriesWithStats
            .filter(cat => cat.budget > 0 && cat.spent > cat.budget * 0.8)
            .map(cat => {
              const percentage = ((cat.spent / cat.budget) * 100);
              const isExceeded = cat.spent > cat.budget;

              return {
                id: `alert-${cat.id}-${new Date().getMonth()}-${new Date().getFullYear()}`,
                type: isExceeded ? 'exceeded' : 'warning',
                title: isExceeded
                  ? `${cat.name} Budget Exceeded!`
                  : `${cat.name} Budget Warning`,
                message: isExceeded
                  ? `You've spent ${formatAmount(cat.spent)} of your ${formatAmount(cat.budget)} budget (${percentage.toFixed(1)}%). Consider reviewing your spending.`
                  : `You've used ${percentage.toFixed(1)}% of your ${formatAmount(cat.budget)} budget. You're approaching your limit.`,
                category: cat.name,
                timestamp: new Date().toISOString(),
                dismissed: false,
                budget: cat.budget,
                spent: cat.spent,
                percentage: percentage.toFixed(1)
              };
            });

          setAlerts(generatedAlerts);

          // Trigger notifications for budget alerts
          generatedAlerts.forEach(alert => {
            addNotification({
              type: alert.type,
              title: alert.title,
              message: alert.message,
              showToast: true,
              duration: alert.type === 'exceeded' ? 8000 : 6000, // Longer duration for exceeded budgets
            });
          });
        } else {
          setCategories([]);
          setOverallBudget(0);
          setTotalSpent(0);
          setBudgetHistory([]);
          setAlerts([]);
        }
      } catch (err) {
        console.error('❌ Error loading budget data:', err);
        setError(err?.message || 'Failed to load budget data');
        setHasData(false);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadBudgetData();
  }, []);

  // Budget history and alerts
  const [budgetHistory, setBudgetHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [budgetTemplates] = useState(hasData ? [
    {
      id: 1,
      name: "Conservative Budget",
      description: "A careful spending plan with high savings allocation and minimal discretionary spending",
      timestamp: "2025-09-15T10:30:00Z",
      categories: [
        { id: 1, name: "Food & Dining", budget: 600, color: "#10B981" },
        { id: 2, name: "Transportation", budget: 300, color: "#3B82F6" },
        { id: 3, name: "Shopping", budget: 200, color: "#8B5CF6" },
        { id: 4, name: "Entertainment", budget: 150, color: "#F59E0B" },
        { id: 5, name: "Bills & Utilities", budget: 1200, color: "#EF4444" },
        { id: 6, name: "Healthcare", budget: 250, color: "#06B6D4" }
      ]
    },
    {
      id: 2,
      name: "Balanced Lifestyle",
      description: "Moderate spending across all categories with room for entertainment and personal growth",
      timestamp: "2025-10-01T14:20:00Z",
      categories: [
        { id: 1, name: "Food & Dining", budget: 800, color: "#10B981" },
        { id: 2, name: "Transportation", budget: 400, color: "#3B82F6" },
        { id: 3, name: "Shopping", budget: 500, color: "#8B5CF6" },
        { id: 4, name: "Entertainment", budget: 300, color: "#F59E0B" },
        { id: 5, name: "Bills & Utilities", budget: 1200, color: "#EF4444" },
        { id: 6, name: "Education", budget: 400, color: "#84CC16" }
      ]
    }
  ] : []);

  const handleBudgetUpdate = async (categoryId, updates) => {
    try {
      setLoading(true);

      // Get current month and year
      const currentMonth = new Date().getMonth() + 1; // API uses 1-12
      const currentYear = new Date().getFullYear();

      // Find the category to get its budgetId
      const category = categories.find(cat => cat?.id === categoryId);

      if (!category) {
        throw new Error('Category not found');
      }

      // Get current selected currency
      const currentCurrency = localStorage.getItem('selectedCurrency') || 'USD';

      // Save budget via budgets API (create or update)
      const savedBudget = await saveBudget({
        amount: updates.budget,
        categoryId: parseInt(categoryId),
        month: currentMonth,
        year: currentYear,
        originalCurrency: currentCurrency // Save budget in current currency
      }, category.budgetId); // Pass existing budgetId for updates

      console.log('✅ Budget saved:', savedBudget);

      // Convert the saved budget back for display
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
              budgetId: savedBudget.id, // Update budgetId in case it was created
              ...updates
            }
          : cat
      );
      setCategories(updatedCategories);

      // Recalculate totals
      const budget = updatedCategories.reduce((sum, cat) => sum + (parseFloat(cat.budget) || 0), 0);
      setOverallBudget(budget);

      // Show success notification
      addNotification({
        type: 'success',
        title: 'Budget Updated',
        message: `Budget for ${category.name} has been updated to ${formatAmount(updates.budget)}`,
        showToast: true,
        duration: 4000,
      });
    } catch (error) {
      console.error('❌ Error updating budget:', error);
      addNotification({
        type: 'error',
        title: 'Budget Update Failed',
        message: error.message || 'Failed to update budget. Please try again.',
        showToast: true,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAlertDismiss = (alertId) => {
    setAlerts(prev => prev?.map(alert =>
      alert?.id === alertId
        ? { ...alert, dismissed: true }
        : alert
    ));
  };

  const handleTemplateApply = (template) => {
    // Apply template logic would go here
    console.log('Applying template:', template);
    alert('Template application not yet implemented');
  };

  const handleTemplateCreate = (templateData) => {
    // Create template logic would go here
    console.log('Creating template:', templateData);
    alert('Template creation not yet implemented');
  };

  const handleTemplateDelete = (templateId) => {
    // Delete template logic would go here
    console.log('Deleting template:', templateId);
    alert('Template deletion not yet implemented');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
    { id: 'categories', label: 'Categories', icon: 'Tags' },
    { id: 'history', label: 'History', icon: 'TrendingUp' },
    { id: 'alerts', label: 'Alerts', icon: 'Bell' },
    { id: 'templates', label: 'Templates', icon: 'FileText' }
  ];

  useEffect(() => {
    document.title = 'Budget Management - ExpenseTracker Pro';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Budget Management</h1>
              <p className="text-muted-foreground">
                Plan, track, and optimize your monthly spending across all categories
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Button
                variant="outline"
                onClick={() => navigate('/analytics-reports')}
                iconName="BarChart3"
                iconPosition="left"
                iconSize={16}
              >
                View Reports
              </Button>
              <Button
                variant="default"
                onClick={() => navigate('/add-edit-expense')}
                iconName="Plus"
                iconPosition="left"
                iconSize={16}
              >
                Add Expense
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-border">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-150 ${
                      activeTab === tab?.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    <Icon name={tab?.icon} size={16} />
                    <span>{tab?.label}</span>
                    {tab?.id === 'alerts' && alerts?.filter(alert => !alert?.dismissed)?.length > 0 && (
                      <span className="bg-error text-error-foreground text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                        {alerts?.filter(alert => !alert?.dismissed)?.length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading budget data...</p>
            </div>
          ) : error ? (
            /* Error State */
            <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
              <Icon name="AlertCircle" size={48} className="text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Budget Data</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : !hasData ? (
            <EmptyState
              icon="Target"
              title="No Budget Data Yet"
              description="Start tracking your expenses to create and manage budgets for different categories."
              actionLabel="Add Your First Expense"
              actionPath="/add-edit-expense"
            />
          ) : (
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <>
                  <BudgetOverview
                    overallBudget={overallBudget}
                    totalSpent={totalSpent}
                    currency={currency}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {categories?.slice(0, 6)?.map((category) => (
                      <CategoryBudgetCard
                        key={category?.id}
                        category={category}
                        onBudgetUpdate={handleBudgetUpdate}
                        currency={currency}
                      />
                    ))}
                  </div>

                  {categories?.length > 6 && (
                    <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('categories')}
                        iconName="ArrowRight"
                        iconPosition="right"
                        iconSize={16}
                      >
                        View All Categories ({categories?.length})
                      </Button>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'categories' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {categories?.map((category) => (
                    <CategoryBudgetCard
                      key={category?.id}
                      category={category}
                      onBudgetUpdate={handleBudgetUpdate}
                      currency={currency}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'history' && (
                <BudgetHistory
                  historyData={budgetHistory}
                  currency={currency}
                />
              )}

              {activeTab === 'alerts' && (
                <BudgetAlerts
                  alerts={alerts}
                  onAlertUpdate={() => {}}
                  onAlertDismiss={handleAlertDismiss}
                />
              )}

              {activeTab === 'templates' && (
                <BudgetTemplates
                  templates={budgetTemplates}
                  onTemplateApply={handleTemplateApply}
                  onTemplateCreate={handleTemplateCreate}
                  onTemplateDelete={handleTemplateDelete}
                />
              )}
            </div>
          )}
        </div>
      </main>
      <BottomNavigation />
      <FloatingActionButton />
    </div>
  );
};

export default BudgetManagement;
