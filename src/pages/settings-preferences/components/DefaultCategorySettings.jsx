import React, { useState, useEffect } from 'react';
import Select from '../../../components/ui/Select';
import PreferenceSection from './PreferenceSection';
import Icon from '../../../components/AppIcon';
import { loadCategories } from '../../../utils/storageHelpers';

const DefaultCategorySettings = () => {
  const [defaultCategory, setDefaultCategory] = useState('');
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState('Cash');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const paymentMethods = [
    { value: 'Cash', label: 'Cash', description: 'Physical currency' },
    { value: 'Card', label: 'Card', description: 'Credit/Debit card payments' },
    { value: 'Bank Transfer', label: 'Bank Transfer', description: 'Direct bank transfers' },
    { value: 'Digital Wallet', label: 'Digital Wallet', description: 'Mobile payment apps' },
    { value: 'Other', label: 'Other', description: 'Other payment methods' }
  ];

  // Load categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const savedCategories = await loadCategories();

        // Format categories for Select component
        const formattedCategories = savedCategories.map(cat => ({
          value: cat.name, // Use name as value
          label: cat.name,
          icon: cat.icon,
          color: cat.color,
          id: cat.id
        }));

        setCategories(formattedCategories);

        // Load saved defaults from localStorage
        const savedDefaults = localStorage.getItem('defaultSettings');
        if (savedDefaults) {
          const defaults = JSON.parse(savedDefaults);
          setDefaultCategory(defaults?.category || '');
          setDefaultPaymentMethod(defaults?.paymentMethod || 'Cash');
        } else if (formattedCategories.length > 0) {
          // Set first category as default if no saved defaults
          setDefaultCategory(formattedCategories[0].value);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const saveDefaults = () => {
    const defaults = {
      category: defaultCategory,
      paymentMethod: defaultPaymentMethod
    };
    localStorage.setItem('defaultSettings', JSON.stringify(defaults));
  };

  useEffect(() => {
    saveDefaults();
  }, [defaultCategory, defaultPaymentMethod]);

  const selectedCategoryData = categories?.find(cat => cat?.value === defaultCategory);

  return (
    <PreferenceSection
      title="Default Settings"
      description="Set default values for quick expense entry"
      icon="Settings2"
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <Select
              label="Default Expense Category"
              description="This category will be pre-selected when adding new expenses"
              options={categories?.map(cat => ({
                value: cat?.value,
                label: cat?.label,
                description: `Default to ${cat?.label} category`
              }))}
              value={defaultCategory}
              onChange={setDefaultCategory}
            />

            {selectedCategoryData && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: selectedCategoryData?.color }}
                  >
                    <Icon name={selectedCategoryData?.icon} size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedCategoryData?.label}</p>
                    <p className="text-xs text-muted-foreground">Selected as default category</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-6">
            <Select
              label="Default Payment Method"
              description="This payment method will be pre-selected for new expenses"
              options={paymentMethods}
              value={defaultPaymentMethod}
              onChange={setDefaultPaymentMethod}
            />
          </div>
        </div>
      )}
    </PreferenceSection>
  );
};

export default DefaultCategorySettings;