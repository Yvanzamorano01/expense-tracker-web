import React, { useState, useEffect } from 'react';
import Select from '../../../components/ui/Select';
import PreferenceSection from './PreferenceSection';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import {
  getExchangeRates,
  setExchangeRates,
  resetExchangeRates,
  getAvailableCurrencies
} from '../../../utils/currencyHelpers';

const CurrencySettings = () => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [exchangeRates, setExchangeRatesState] = useState(getExchangeRates());
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [editedRates, setEditedRates] = useState({});

  const currencyOptions = [
    { value: 'USD', label: 'US Dollar ($)', description: 'United States Dollar' },
    { value: 'EUR', label: 'Euro (€)', description: 'European Union Euro' },
    { value: 'XAF', label: 'Central African CFA Franc (FCFA)', description: 'Central African CFA Franc' },
    { value: 'GBP', label: 'British Pound (£)', description: 'British Pound Sterling' }
  ];

  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }
  }, []);

  const handleCurrencyChange = (value) => {
    setSelectedCurrency(value);
    localStorage.setItem('selectedCurrency', value);
  };

  const handleEditRates = () => {
    setEditedRates({ ...exchangeRates });
    setIsEditingRates(true);
  };

  const handleCancelEdit = () => {
    setEditedRates({});
    setIsEditingRates(false);
  };

  const handleSaveRates = () => {
    // Validate all rates before saving
    const invalidRates = Object.entries(editedRates).filter(([key, value]) => {
      // Skip lastUpdated field
      if (key === 'lastUpdated') return false;

      const num = parseFloat(value);
      return isNaN(num) || num <= 0;
    });

    if (invalidRates.length > 0) {
      alert('All exchange rates must be positive numbers. Please correct invalid values.');
      return;
    }

    // Convert string values to numbers before saving
    const numericRates = {};
    Object.entries(editedRates).forEach(([key, value]) => {
      if (key === 'lastUpdated') {
        numericRates[key] = value;
      } else {
        numericRates[key] = parseFloat(value);
      }
    });

    const success = setExchangeRates(numericRates);
    if (success) {
      setExchangeRatesState(getExchangeRates());
      setIsEditingRates(false);
      setEditedRates({});
    }
  };

  const handleResetRates = () => {
    resetExchangeRates();
    setExchangeRatesState(getExchangeRates());
    setIsEditingRates(false);
    setEditedRates({});
  };

  const handleRateChange = (currency, value) => {
    // Allow any input during editing (including empty strings)
    // Validation will happen on save
    setEditedRates(prev => ({
      ...prev,
      [currency]: value
    }));
  };

  const formatLastUpdated = () => {
    if (!exchangeRates.lastUpdated) return 'Never';
    const date = new Date(exchangeRates.lastUpdated);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatCurrencyExample = (currency) => {
    const examples = {
      USD: '$1,234.56',
      EUR: '€1.234,56',
      XAF: '1,234 FCFA',
      GBP: '£1,234.56'
    };
    return examples?.[currency] || '$1,234.56';
  };

  return (
    <PreferenceSection
      title="Currency Settings"
      description="Select your preferred currency for expense tracking and budget management"
      icon="DollarSign"
    >
      <div className="space-y-6">
        <Select
          label="Default Currency"
          description="This currency will be used for all new expenses and budget calculations"
          options={currencyOptions}
          value={selectedCurrency}
          onChange={handleCurrencyChange}
        />

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Preview Format:</span>
            <span className="text-lg font-semibold text-primary">
              {formatCurrencyExample(selectedCurrency)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Example of how amounts will be displayed in the application
          </p>
        </div>

        {/* Exchange Rates Section */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Exchange Rates</h3>
              <p className="text-sm text-muted-foreground">
                Manage currency conversion rates (Base: 1 USD)
              </p>
            </div>
            {!isEditingRates && (
              <Button variant="outline" size="sm" onClick={handleEditRates}>
                <Icon name="Edit2" size={16} className="mr-2" />
                Edit Rates
              </Button>
            )}
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="space-y-3">
              {getAvailableCurrencies().map(currency => (
                <div key={currency} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground min-w-[80px]">
                    {currency}
                  </span>
                  {isEditingRates ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editedRates[currency] || exchangeRates[currency]}
                      onChange={(e) => handleRateChange(currency, e.target.value)}
                      className="w-32"
                      disabled={currency === 'USD'}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {exchangeRates[currency]?.toFixed(4) || '1.0000'}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {isEditingRates && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveRates}
                  className="flex-1"
                >
                  <Icon name="Check" size={16} className="mr-2" />
                  Save Rates
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="flex-1"
                >
                  <Icon name="X" size={16} className="mr-2" />
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleResetRates}
                >
                  <Icon name="RotateCcw" size={16} className="mr-2" />
                  Reset
                </Button>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="text-foreground font-medium">{formatLastUpdated()}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 bg-primary/10 border border-primary/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-foreground">
                Expenses are stored in their original currency and converted to your selected currency for display.
                Update exchange rates manually to ensure accurate conversions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PreferenceSection>
  );
};

export default CurrencySettings;