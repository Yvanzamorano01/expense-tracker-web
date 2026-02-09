import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import PreferenceSection from './PreferenceSection';
import Icon from '../../../components/AppIcon';
import { loadExpenses, loadCategories, loadCategoriesWithBudgets, deleteExpense } from '../../../utils/storageHelpers';
import { expenseService, categoryService } from '../../../services';

const DataManagement = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExportData = async (format) => {
    setIsExporting(true);

    try {
      // Load real data from API
      const [expenses, categories] = await Promise.all([
        loadExpenses(),
        loadCategoriesWithBudgets()  // Load with budgets merged
      ]);

      console.log('💾 Exporting data - Expenses:', expenses?.length, 'Categories:', categories?.length);

      // Calculate total expenses
      const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

      // Prepare export data
      const exportData = {
        expenses: expenses.map(exp => ({
          id: exp.id,
          amount: parseFloat(exp.amount),
          category: exp.category,
          description: exp.description || '',
          date: exp.date,
          paymentMethod: exp.paymentMethod || 'Cash',
          location: exp.location || '',
          isRecurring: exp.isRecurring || false,
          recurringFrequency: exp.recurringFrequency || null
        })),
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          budget: parseFloat(cat.budget || 0),
          isDefault: cat.isDefault || false
        })),
        exportDate: new Date()?.toISOString(),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        version: '1.0.0'
      };

      if (format === 'json') {
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `expense-backup-${new Date()?.toISOString()?.split('T')?.[0]}.json`;
        link?.click();
        URL.revokeObjectURL(url);
        alert('Data exported successfully as JSON!');
      } else if (format === 'csv') {
        const csvContent = [
          'Date,Category,Description,Amount,Payment Method,Location',
          ...exportData?.expenses?.map(expense =>
            `${expense?.date},${expense?.category},"${expense?.description || ''}",${expense?.amount},${expense?.paymentMethod},"${expense?.location || ''}"`
          )
        ]?.join('\n');

        const dataBlob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `expenses-${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
        link?.click();
        URL.revokeObjectURL(url);
        alert('Data exported successfully as CSV!');
      }
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      alert('Failed to export data: ' + (error.message || 'Please try again'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e?.target?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            // Parse imported data
            const importedData = JSON.parse(e?.target?.result);
            console.log('📥 Importing data:', importedData);

            // Validate data structure
            if (!importedData?.expenses || !Array.isArray(importedData.expenses)) {
              throw new Error('Invalid data format: expenses array not found');
            }

            // Import categories first (if they don't exist)
            let importedCategoriesCount = 0;
            if (importedData?.categories && Array.isArray(importedData.categories)) {
              const existingCategories = await loadCategoriesWithBudgets();
              const existingCategoryNames = existingCategories.map(cat =>
                cat.name.trim().toLowerCase()
              );

              for (const category of importedData.categories) {
                const normalizedName = category.name.trim().toLowerCase();
                // Only create if category doesn't exist
                if (!existingCategoryNames.includes(normalizedName)) {
                  try {
                    await categoryService.create({
                      name: category.name,
                      color: category.color || '#6B7280',
                      icon: category.icon || 'Tag',
                      budget: parseFloat(category.budget || 0)
                    });
                    importedCategoriesCount++;
                  } catch (error) {
                    console.error(`Error importing category ${category.name}:`, error);
                  }
                }
              }
            }

            // Import expenses
            let importedExpensesCount = 0;
            const allCategories = await loadCategoriesWithBudgets();

            for (const expense of importedData.expenses) {
              try {
                // Find matching category
                const category = allCategories.find(cat =>
                  cat.name.toLowerCase() === expense.category.toLowerCase()
                );

                if (category) {
                  await expenseService.create({
                    amount: parseFloat(expense.amount),
                    date: expense.date,
                    categoryId: parseInt(category.id),
                    description: expense.description || '',
                    paymentMethod: expense.paymentMethod || 'Cash',
                    location: expense.location || '',
                    isRecurring: expense.isRecurring || false,
                    recurringFrequency: expense.recurringFrequency || null
                  });
                  importedExpensesCount++;
                }
              } catch (error) {
                console.error('Error importing expense:', error);
              }
            }

            alert(`Data imported successfully!\n${importedExpensesCount} expenses and ${importedCategoriesCount} new categories imported.`);

            // Reload page to show updated data
            window.location.reload();
          } catch (error) {
            console.error('❌ Error importing data:', error);
            alert('Error importing data: ' + (error.message || 'Please check the file format.'));
          }
        };
        reader?.readAsText(file);
      }
    };
    input?.click();
  };

  const handleClearAllData = async () => {
    setIsClearing(true);

    try {
      // Load all data from API
      const [expenses, categories] = await Promise.all([
        loadExpenses(),
        loadCategoriesWithBudgets()
      ]);

      console.log('🗑️ Clearing data - Expenses:', expenses?.length, 'Categories:', categories?.length);

      // Delete all expenses
      let deletedExpenses = 0;
      for (const expense of expenses) {
        try {
          await deleteExpense(expense.id);
          deletedExpenses++;
        } catch (error) {
          console.error(`Error deleting expense ${expense.id}:`, error);
        }
      }

      // Delete custom categories (non-default only)
      let deletedCategories = 0;
      const customCategories = categories.filter(cat => !cat.isDefault);
      for (const category of customCategories) {
        try {
          await categoryService.delete(parseInt(category.id));
          deletedCategories++;
        } catch (error) {
          console.error(`Error deleting category ${category.id}:`, error);
        }
      }

      // Clear localStorage data except preferences
      const keysToKeep = ['selectedCurrency', 'selectedTheme', 'dateFormat', 'notificationSettings', 'defaultSettings'];
      const allKeys = Object.keys(localStorage);

      allKeys?.forEach(key => {
        if (!keysToKeep?.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      // Set a flag to indicate data was cleared
      localStorage.setItem('dataCleared', 'true');

      setIsClearing(false);
      setShowClearConfirm(false);
      alert(`All data cleared successfully!\n${deletedExpenses} expenses and ${deletedCategories} custom categories deleted.\nDefault categories preserved.`);

      // Reload the page to show empty state
      window.location.reload();
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      alert('Failed to clear data: ' + (error.message || 'Please try again'));
      setIsClearing(false);
      setShowClearConfirm(false);
    }
  };

  return (
    <PreferenceSection
      title="Data Management"
      description="Backup, restore, and manage your expense data"
      icon="Database"
    >
      <div className="space-y-6">
        {/* Export Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Export Data</h4>
          <p className="text-sm text-muted-foreground">
            Download your expense data for backup or analysis
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => handleExportData('json')}
              loading={isExporting}
              iconName="Download"
              iconPosition="left"
              className="flex-1"
            >
              Export as JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData('csv')}
              loading={isExporting}
              iconName="FileText"
              iconPosition="left"
              className="flex-1"
            >
              Export as CSV
            </Button>
          </div>
        </div>

        {/* Import Section */}
        <div className="border-t border-border pt-6 space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Import Data</h4>
          <p className="text-sm text-muted-foreground">
            Restore data from a previous backup or import from other sources
          </p>
          
          <Button
            variant="outline"
            onClick={handleImportData}
            iconName="Upload"
            iconPosition="left"
          >
            Import Data File
          </Button>
        </div>

        {/* Clear Data Section */}
        <div className="border-t border-border pt-6 space-y-4">
          <h4 className="text-sm font-semibold text-error">Clear All Data</h4>
          <p className="text-sm text-muted-foreground">
            Permanently delete all expenses, categories, and budgets. This action cannot be undone.
          </p>
          
          {!showClearConfirm ? (
            <Button
              variant="destructive"
              onClick={() => setShowClearConfirm(true)}
              iconName="Trash2"
              iconPosition="left"
            >
              Clear All Data
            </Button>
          ) : (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4 space-y-4">
              <div className="flex items-start space-x-3">
                <Icon name="AlertTriangle" size={20} className="text-error flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-error">Are you absolutely sure?</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will permanently delete all your expense data, categories, and budgets. 
                    Your preferences will be preserved.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="destructive"
                  onClick={handleClearAllData}
                  loading={isClearing}
                  size="sm"
                >
                  Yes, Delete Everything
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowClearConfirm(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PreferenceSection>
  );
};

export default DataManagement;