import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ExpenseForm from './components/ExpenseForm';
import ExpenseTemplates from './components/ExpenseTemplates';
import BudgetWarning from './components/BudgetWarning';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import { getCurrentBudgets } from '../../utils/storageHelpers';

const AddEditExpense = () => {
  const location = useLocation();
  const editExpense = location?.state?.expense;
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [budgetData, setBudgetData] = useState(null);

  useEffect(() => {
    // Load budget data from API
    const fetchBudgets = async () => {
      try {
        const budgets = await getCurrentBudgets();

        // Transform budgets to category-based map
        const budgetMap = {};
        budgets.forEach(budget => {
          if (budget.category) {
            const categoryKey = budget.category.toLowerCase().replace(/\s+/g, '-');
            budgetMap[categoryKey] = {
              limit: budget.amount,
              current: 0 // Will be calculated when needed
            };
          }
        });

        setBudgetData(budgetMap);
      } catch (error) {
        console.error('Error loading budgets:', error);
        setBudgetData({});
      }
    };

    fetchBudgets();
  }, []);

  const handleTemplateSelect = (templateData) => {
    setSelectedTemplate(templateData);
    setShowTemplates(false);
  };

  const getCategoryBudget = (category) => {
    if (!budgetData || !category) return null;
    return budgetData?.[category];
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Quick Actions Bar */}
      {!editExpense && (
        <div className="bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">Quick Actions</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(true)}
                iconName="Template"
                iconPosition="left"
              >
                Templates
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                iconName="Camera"
                iconPosition="left"
              >
                Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Budget Warning Component */}
      {selectedTemplate?.category && (
        <div className="p-4">
          <BudgetWarning
            category={selectedTemplate?.category?.replace('-', ' ')}
            currentSpending={getCategoryBudget(selectedTemplate?.category)?.current || 0}
            budgetLimit={getCategoryBudget(selectedTemplate?.category)?.limit || 0}
            currency={selectedTemplate?.currency || 'USD'}
          />
        </div>
      )}
      {/* Main Form */}
      <ExpenseForm 
        initialData={selectedTemplate}
        key={selectedTemplate ? 'template' : 'normal'}
      />
      {/* Templates Modal */}
      {showTemplates && (
        <ExpenseTemplates
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}
      {/* Floating Help Button */}
      <div className="fixed bottom-20 lg:bottom-6 left-6 z-fab">
        <Button
          variant="secondary"
          size="icon"
          className="w-12 h-12 rounded-full shadow-lg"
          title="Help & Tips"
        >
          <Icon name="HelpCircle" size={20} />
        </Button>
      </div>
    </div>
  );
};

export default AddEditExpense;