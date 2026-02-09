import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import BottomNavigation from '../../components/ui/BottomNavigation';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import SummaryCard from './components/SummaryCard';
import ExpenseTrendChart from './components/ExpenseTrendChart';
import CategoryBreakdownChart from './components/CategoryBreakdownChart';
import RecentExpensesList from './components/RecentExpensesList';
import QuickActions from './components/QuickActions';
import FinancialInsights from './components/FinancialInsights';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { isDataCleared, calculateStats, getMonthlyExpenses } from '../../utils/dataHelpers';
import { loadExpenses, loadCategories, loadBudgets } from '../../utils/storageHelpers';
import { useCurrency } from '../../hooks/useCurrency';

const Dashboard = () => {
  const navigate = useNavigate();
  const { formatFromUSD, formatExpenseAmount, convertExpenseAmount, formatAmount, convertFromUSD } = useCurrency();
  const [hasData, setHasData] = useState(true);
  const [summaryData, setSummaryData] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set page title
    document.title = 'Dashboard - ExpenseTracker Pro';

    // Async function to load data
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load expenses, categories, and budgets from API
        const currentMonth = new Date().getMonth() + 1; // API uses 1-12
        const currentYear = new Date().getFullYear();

        const [savedExpenses, savedCategories, savedBudgets] = await Promise.all([
          loadExpenses(),
          loadCategories(),
          loadBudgets(currentMonth, currentYear)
        ]);

        console.log('📊 Dashboard loaded - Expenses:', savedExpenses?.length, 'Categories:', savedCategories?.length, 'Budgets:', savedBudgets?.length);

        // Create a map of budgets by categoryId
        const budgetMap = new Map();
        savedBudgets.forEach(budget => {
          if (budget.categoryId) {
            budgetMap.set(budget.categoryId.toString(), budget);
          }
        });

        // Merge budgets into categories
        const categoriesWithBudgets = savedCategories.map(cat => {
          const budget = budgetMap.get(cat.id.toString());
          return {
            ...cat,
            budget: budget ? parseFloat(budget.amount) : 0
          };
        });

        // Set data
        setExpenses(savedExpenses || []);
        setCategories(categoriesWithBudgets || []);

        // Check if we have data
        const hasExpenses = savedExpenses && savedExpenses.length > 0;
        setHasData(hasExpenses);

        if (hasExpenses) {
          // Filter expenses to current month only
          const monthlyExpenses = getMonthlyExpenses(savedExpenses);
          const stats = calculateStats(monthlyExpenses, convertExpenseAmount);

          // Calculate all-time stats for Total Expenses card
          const allTimeStats = calculateStats(savedExpenses, convertExpenseAmount);

          // Find highest category safely
          const categoryEntries = Object.entries(stats?.categoryBreakdown || {});
          const highestCategory = categoryEntries.length > 0
            ? categoryEntries.reduce((highest, [cat, data]) => {
                return (data?.total || 0) > (highest?.total || 0) ? { category: cat, ...data } : highest;
              }, null)
            : null;

          // Calculate budget status safely using categoriesWithBudgets
          // Note: Budget amounts are stored in USD, so we need to convert them to current currency
          const totalBudgetUSD = (categoriesWithBudgets && Array.isArray(categoriesWithBudgets) && categoriesWithBudgets.length > 0)
            ? categoriesWithBudgets.reduce((sum, cat) => sum + (parseFloat(cat?.budget) || 0), 0)
            : 0;
          const totalBudget = convertFromUSD(totalBudgetUSD);
          const budgetUsed = totalBudget > 0 ? ((stats?.monthlyTotal || 0) / totalBudget) * 100 : 0;

          console.log('💰 Budget calculation - Total Budget:', totalBudget, 'Monthly Total:', stats?.monthlyTotal, 'Budget Used:', budgetUsed.toFixed(1) + '%');

          // Build summary data with safe defaults
          setSummaryData([
            {
              title: 'Total Expenses',
              value: formatAmount(allTimeStats?.totalExpenses || 0),
              icon: 'DollarSign',
              trend: 'neutral',
              trendValue: `${allTimeStats?.expenseCount || 0} transactions`,
              color: 'primary'
            },
            {
              title: 'Monthly Total',
              value: formatAmount(stats?.monthlyTotal || 0),
              icon: 'TrendingUp',
              trend: 'neutral',
              trendValue: 'This month',
              color: 'success'
            },
            {
              title: 'Highest Expense',
              value: (stats?.highestExpense && stats.highestExpense.amount)
                ? formatExpenseAmount(stats.highestExpense)
                : formatFromUSD(0),
              icon: 'ArrowUp',
              trend: 'neutral',
              trendValue: typeof stats?.highestExpense?.category === 'string'
                ? stats.highestExpense.category
                : stats?.highestExpense?.category?.name || 'N/A',
              color: 'warning'
            },
            {
              title: 'Budget Status',
              value: `${Math.round(budgetUsed)}%`,
              icon: 'Target',
              trend: budgetUsed > 90 ? 'up' : 'down',
              trendValue: budgetUsed > 90 ? 'High usage' : 'On track',
              color: budgetUsed > 90 ? 'warning' : 'success'
            }
          ]);
        } else {
          // No expenses - set empty data
          setSummaryData([]);
        }
      } catch (err) {
        console.error('❌ Error loading dashboard data:', err);
        console.error('Error stack:', err?.stack);
        setError(err?.message || 'Failed to load dashboard data');
        setHasData(false);
        setSummaryData([]);
        setExpenses([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Listen for updates
    const handleUpdate = async () => {
      console.log('🔄 Dashboard - Reloading data due to update event');
      await loadDashboardData();
    };

    window.addEventListener('expensesUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('expensesUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleExportData = () => {
    // Mock export functionality
    const exportData = {
      summary: summaryData,
      exportDate: new Date()?.toISOString(),
      totalExpenses: 3942.15,
      period: 'October 2025'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-dashboard-${new Date()?.toISOString()?.split('T')?.[0]}.json`;
    link?.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  Welcome back! 👋
                </h1>
                <p className="text-muted-foreground">
                  Here's your financial overview for {new Date()?.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  iconName="Download"
                  iconPosition="left"
                  iconSize={16}
                >
                  Export Data
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/add-edit-expense')}
                  iconName="Plus"
                  iconPosition="left"
                  iconSize={16}
                  className="hidden sm:flex"
                >
                  Add Expense
                </Button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          ) : error ? (
            /* Error State */
            <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
              <Icon name="AlertCircle" size={48} className="text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Dashboard</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : !hasData ? (
            /* Empty State */
            <EmptyState
              icon="BarChart3"
              title="No Expenses Yet"
              description="Start tracking your expenses to see your financial overview here."
              actionLabel="Add Your First Expense"
              actionPath="/add-edit-expense"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {summaryData?.map((card, index) => (
                  <SummaryCard
                    key={index}
                    title={card?.title}
                    value={card?.value}
                    icon={card?.icon}
                    trend={card?.trend}
                    trendValue={card?.trendValue}
                    color={card?.color}
                  />
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <QuickActions />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                <ExpenseTrendChart expenses={expenses} />
                <CategoryBreakdownChart expenses={expenses} categories={categories} />
              </div>

              {/* Recent Expenses */}
              <div className="mb-8">
                <RecentExpensesList expenses={expenses} categories={categories} />
              </div>

              {/* Financial Insights */}
              {expenses.length > 0 && (
                <FinancialInsights expenses={expenses} categories={categories} />
              )}
            </>
          )}
        </div>
      </main>
      <BottomNavigation />
      <FloatingActionButton />
    </div>
  );
};

export default Dashboard;