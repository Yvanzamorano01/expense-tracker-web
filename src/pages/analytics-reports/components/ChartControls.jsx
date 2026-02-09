import React from 'react';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';


const ChartControls = ({
  selectedPeriod,
  onPeriodChange,
  selectedCategory,
  onCategoryChange,
  selectedChartType,
  onChartTypeChange,
  onExportChart,
  categories,
  customDateRange,
  onCustomDateChange
}) => {
  const periodOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'lastmonth', label: 'Last Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const chartTypeOptions = [
    { value: 'pie', label: 'Pie Chart' },
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'area', label: 'Area Chart' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories?.map(cat => ({ value: cat?.id, label: cat?.name }))
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="min-w-0 flex-1">
            <Select
              label="Time Period"
              options={periodOptions}
              value={selectedPeriod}
              onChange={onPeriodChange}
              className="w-full"
            />
          </div>

          {/* Custom date range inputs - show only when custom period selected */}
          {selectedPeriod === 'custom' && (
            <>
              <div className="min-w-0 flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
                <input
                  type="date"
                  value={customDateRange?.startDate || ''}
                  onChange={(e) => onCustomDateChange({ ...customDateRange, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="min-w-0 flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
                <input
                  type="date"
                  value={customDateRange?.endDate || ''}
                  onChange={(e) => onCustomDateChange({ ...customDateRange, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </>
          )}

          <div className="min-w-0 flex-1">
            <Select
              label="Category Filter"
              options={categoryOptions}
              value={selectedCategory}
              onChange={onCategoryChange}
              className="w-full"
            />
          </div>
          
          <div className="min-w-0 flex-1">
            <Select
              label="Chart Type"
              options={chartTypeOptions}
              value={selectedChartType}
              onChange={onChartTypeChange}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onExportChart}
            iconName="Download"
            iconPosition="left"
            className="whitespace-nowrap"
          >
            Export Chart
          </Button>
          
          <Button
            variant="ghost"
            iconName="RefreshCw"
            iconPosition="left"
            className="whitespace-nowrap"
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChartControls;