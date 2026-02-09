import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { resetDataClearedFlag } from '../../../utils/dataHelpers';
import { loadCategories, saveExpense, updateExpense, deleteExpense } from '../../../utils/storageHelpers';
import { useCurrency } from '../../../hooks/useCurrency';

const ExpenseForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editExpense = location?.state?.expense;
  const isEditing = Boolean(editExpense);
  const { currency, convertFromUSD, convertToUSD } = useCurrency();

  // CRITICAL DEBUG: Check currency value immediately after hook
  console.log('🚨 CRITICAL DEBUG - currency from useCurrency hook:', currency);
  console.log('🚨 CRITICAL DEBUG - typeof currency:', typeof currency);
  console.log('🚨 CRITICAL DEBUG - localStorage selectedCurrency:', localStorage.getItem('selectedCurrency'));

  // When editing, display amount in its original currency
  // If originalCurrency matches current currency, show as-is
  // Otherwise, convert from original to current currency
  const initialAmount = isEditing && editExpense?.amount
    ? (editExpense.originalCurrency === currency
        ? editExpense.amount  // Same currency, no conversion needed
        : convertFromUSD(editExpense.amount))  // Fallback for legacy data (stored as USD)
    : '';

  const [formData, setFormData] = useState({
    amount: initialAmount,
    currency: currency,  // Use current currency from settings
    category: editExpense?.category || '',
    date: editExpense?.date || new Date()?.toISOString()?.split('T')?.[0],
    paymentMethod: editExpense?.paymentMethod || 'Cash',
    description: editExpense?.description || '',
    location: editExpense?.location || '',
    isRecurring: editExpense?.isRecurring || false,
    recurringFrequency: editExpense?.recurringFrequency || 'monthly'
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categories, setCategories] = useState([]);

  // Load categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const savedCategories = await loadCategories();
        const formattedCategories = savedCategories.map(cat => ({
          value: cat.name, // Store the exact name
          label: cat.name,
          color: cat.color,
          id: cat.id // Keep ID for API calls
        }));
        setCategories(formattedCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'XAF', label: 'XAF - Central African Franc' },
    { value: 'GBP', label: 'GBP - British Pound' }
  ];

  const paymentMethods = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Card', label: 'Card' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Digital Wallet', label: 'Digital Wallet' },
    { value: 'Other', label: 'Other' }
  ];

  const recurringOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.amount || parseFloat(formData?.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }

    if (!formData?.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData?.date) {
      newErrors.date = 'Please select a date';
    }

    if (!formData?.paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // DEBUG: Log payment method value from form
      console.log('🔍 DEBUG ExpenseForm - formData.paymentMethod:', formData.paymentMethod);
      console.log('🔍 DEBUG ExpenseForm - typeof paymentMethod:', typeof formData.paymentMethod);
      console.log('🔍 DEBUG ExpenseForm - Full formData:', formData);

      // Find category ID by name
      const selectedCategory = categories.find(cat => cat.value === formData.category);

      // Remove currency field from formData to avoid conflicts
      const { currency: _unused, ...restFormData } = formData;

      // Store amount in original currency (no conversion to USD)
      const expenseData = {
        ...restFormData,
        amount: parseFloat(formData.amount),  // Save original amount
        originalCurrency: currency,  // Store user's current currency (from useCurrency hook)
        categoryId: selectedCategory?.id
      };

      console.log('🔍 DEBUG ExpenseForm - currency from hook:', currency);
      console.log('🔍 DEBUG ExpenseForm - expenseData before API call:', expenseData);
      console.log('💾 Storing expense - Amount:', formData.amount, 'Currency:', currency);

      if (isEditing) {
        // Update existing expense via API
        await updateExpense(editExpense?.id, expenseData);
      } else {
        // Create new expense via API
        await saveExpense(expenseData);
        // Reset the data cleared flag when adding a new expense
        resetDataClearedFlag();
      }

      // Trigger update event for Dashboard
      window.dispatchEvent(new Event('expensesUpdated'));

      // Navigate back
      navigate('/expenses-management', {
        state: {
          message: isEditing ? 'Expense updated successfully!' : 'Expense added successfully!'
        }
      });
    } catch (error) {
      console.error('Error saving expense:', error);
      // Show error only if there's an actual error
      alert('Failed to save expense: ' + (error.message || 'Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;

    setIsLoading(true);

    try {
      // Delete via API
      await deleteExpense(editExpense?.id);

      // Trigger update event for Dashboard
      window.dispatchEvent(new Event('expensesUpdated'));

      navigate('/expenses-management', {
        state: {
          message: 'Expense deleted successfully!'
        }
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const formatAmount = (amount, currency) => {
    if (!amount) return '';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    });
    
    return formatter?.format(parseFloat(amount));
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-10 w-10"
            >
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {isEditing ? 'Edit Expense' : 'Add New Expense'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isEditing ? 'Update expense details' : 'Enter your expense information'}
              </p>
            </div>
          </div>
          
          {isEditing && (
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-10 w-10"
            >
              <Icon name="Trash2" size={18} />
            </Button>
          )}
        </div>
      </div>
      {/* Form */}
      <div className="p-4 pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount and Currency */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Amount Details</h3>

            <div className="space-y-4">
              <div>
                <Input
                  label={`Amount (${currency})`}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData?.amount}
                  onChange={(e) => handleInputChange('amount', e?.target?.value)}
                  error={errors?.amount}
                  required
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter amount in {currency}. It will be stored in {currency} without conversion.
                </p>
              </div>
            </div>

            {formData?.amount && (
              <div className="mt-3 p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">Formatted Amount:</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatAmount(formData?.amount, currency)}
                </p>
              </div>
            )}
          </div>

          {/* Category and Payment Method */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Transaction Details</h3>
            
            <div className="space-y-4">
              <Select
                label="Category"
                options={categories}
                value={formData?.category}
                onChange={(value) => handleInputChange('category', value)}
                error={errors?.category}
                required
                searchable
              />
              
              <Select
                label="Payment Method"
                options={paymentMethods}
                value={formData?.paymentMethod}
                onChange={(value) => handleInputChange('paymentMethod', value)}
                error={errors?.paymentMethod}
                required
              />
              
              <Input
                label="Date"
                type="date"
                value={formData?.date}
                onChange={(e) => handleInputChange('date', e?.target?.value)}
                error={errors?.date}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Additional Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formData?.description}
                  onChange={(e) => handleInputChange('description', e?.target?.value)}
                  placeholder="Add notes about this expense..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData?.location}
                  onChange={(e) => handleInputChange('location', e?.target?.value)}
                  placeholder="Where was this expense made?"
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>

              {/* Recurring Expense */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData?.isRecurring}
                  onChange={(e) => handleInputChange('isRecurring', e?.target?.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-foreground">
                  Recurring Expense
                </label>
              </div>

              {formData?.isRecurring && (
                <Select
                  label="Frequency"
                  options={recurringOptions}
                  value={formData?.recurringFrequency}
                  onChange={(value) => handleInputChange('recurringFrequency', value)}
                />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              loading={isLoading}
              iconName="Save"
              iconPosition="left"
              className="flex-1"
            >
              {isEditing ? 'Update Expense' : 'Save Expense'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-modal">
          <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <Icon name="AlertTriangle" size={20} className="text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Delete Expense</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-sm text-foreground mb-6">
              Are you sure you want to delete this expense? This will permanently remove it from your records.
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleDelete}
                loading={isLoading}
                className="flex-1"
              >
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseForm;