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
import { isDataCleared, loadExpenses, loadCategories, getCategoryStats, saveCategories, isSameMonth } from '../../utils/dataHelpers';

const BudgetManagement = () => {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState('USD');
  const [activeTab, setActiveTab] = useState('overview');

  // State for real data
  const [hasData, setHasData] = useState(true);
  const [overallBudget, setOverallBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [categories, setCategories] = useState([]);

  // Load data on mount
  useEffect(() => {
    const dataCleared = isDataCleared();
    setHasData(!dataCleared);

    if (!dataCleared) {
      const savedExpenses = loadExpenses();
      const savedCategories = loadCategories();
      const categoryStats = getCategoryStats(savedCategories, savedExpenses);

      setCategories(categoryStats);

      // Calculate overall budget and total spent
      const budget = categoryStats.reduce((sum, cat) => sum + (cat.budget || 0), 0);
      const spent = categoryStats.reduce((sum, cat) => sum + (cat.spent || 0), 0);

      setOverallBudget(budget);
      setTotalSpent(spent);

      // Generate budget history for last 6 months
      const history = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString('en-US', { month: 'short' });

        // Calculate spent for that month
        const monthExpenses = savedExpenses.filter(exp => isSameMonth(exp.date, date));
        const monthSpent = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

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
    } else {
      setCategories([]);
      setOverallBudget(0);
      setTotalSpent(0);
      setBudgetHistory([]);
    }
  }, []);

  // Budget history and alerts (simplified for now)
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

  const handleBudgetUpdate = (categoryId, updates) => {
    const updatedCategories = categories.map(cat =>
      cat?.id === categoryId
        ? { ...cat, ...updates }
        : cat
    );
    setCategories(updatedCategories);

    // Save to localStorage
    saveCategories(updatedCategories);

    // Recalculate totals
    const budget = updatedCategories.reduce((sum, cat) => sum + (cat.budget || 0), 0);
    setOverallBudget(budget);
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
  };

  const handleTemplateCreate = (templateData) => {
    // Create template logic would go here
    console.log('Creating template:', templateData);
  };

  const handleTemplateDelete = (templateId) => {
    // Delete template logic would go here
    console.log('Deleting template:', templateId);
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
                        ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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

          {/* Tab Content or Empty State */}
          {!hasData ? (
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