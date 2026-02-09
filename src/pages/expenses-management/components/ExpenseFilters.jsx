import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const ExpenseFilters = ({
  filters,
  onFiltersChange,
  onClearFilters,
  resultCount,
  isLoading,
  categories = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Build category options dynamically from actual categories
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(cat => ({
      value: cat.name,
      label: cat.name
    }))
  ];

  // Use actual payment method values from the backend
  const paymentMethodOptions = [
    { value: '', label: 'All Payment Methods' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Card', label: 'Card' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Digital Wallet', label: 'Digital Wallet' },
    { value: 'Other', label: 'Other' }
  ];

  const sortOptions = [
    { value: 'date-desc', label: 'Date (Newest First)' },
    { value: 'date-asc', label: 'Date (Oldest First)' },
    { value: 'amount-desc', label: 'Amount (High to Low)' },
    { value: 'amount-asc', label: 'Amount (Low to High)' },
    { value: 'category-asc', label: 'Category (A-Z)' },
    { value: 'category-desc', label: 'Category (Z-A)' }
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = () => {
    return filters?.search || 
           filters?.category || 
           filters?.paymentMethod || 
           filters?.dateFrom || 
           filters?.dateTo || 
           filters?.amountMin || 
           filters?.amountMax;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
          iconPosition="right"
          fullWidth
        >
          Filters & Search
        </Button>
      </div>
      {/* Filter Content */}
      <div className={`space-y-4 ${!isExpanded ? 'hidden lg:block' : ''}`}>
        {/* Search and Sort Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Input
              type="search"
              placeholder="Search expenses by description, amount, or category..."
              value={filters?.search}
              onChange={(e) => handleFilterChange('search', e?.target?.value)}
              className="w-full"
            />
          </div>
          <div>
            <Select
              options={sortOptions}
              value={filters?.sortBy}
              onChange={(value) => handleFilterChange('sortBy', value)}
              placeholder="Sort by..."
            />
          </div>
        </div>

        {/* Category and Payment Method Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Select
            options={categoryOptions}
            value={filters?.category}
            onChange={(value) => handleFilterChange('category', value)}
            placeholder="Select category"
          />
          <Select
            options={paymentMethodOptions}
            value={filters?.paymentMethod}
            onChange={(value) => handleFilterChange('paymentMethod', value)}
            placeholder="Select payment method"
          />
        </div>

        {/* Date Range Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Input
            type="date"
            label="From Date"
            value={filters?.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e?.target?.value)}
          />
          <Input
            type="date"
            label="To Date"
            value={filters?.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e?.target?.value)}
          />
        </div>

        {/* Amount Range Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Input
            type="number"
            label="Min Amount"
            placeholder="0.00"
            value={filters?.amountMin}
            onChange={(e) => handleFilterChange('amountMin', e?.target?.value)}
            min="0"
            step="0.01"
          />
          <Input
            type="number"
            label="Max Amount"
            placeholder="1000.00"
            value={filters?.amountMax}
            onChange={(e) => handleFilterChange('amountMax', e?.target?.value)}
            min="0"
            step="0.01"
          />
        </div>

        {/* Results and Clear Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-border">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Icon name="Search" size={16} />
            <span>
              {isLoading ? 'Searching...' : `${resultCount} expense${resultCount !== 1 ? 's' : ''} found`}
            </span>
          </div>
          
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              iconName="X"
              iconPosition="left"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseFilters;