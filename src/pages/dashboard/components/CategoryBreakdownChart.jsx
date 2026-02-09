import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { getCategoryInfo, getMonthlyExpenses } from '../../../utils/dataHelpers';
import { useCurrency } from '../../../hooks/useCurrency';

const CategoryBreakdownChart = ({ expenses = [], categories = [] }) => {
  const { convertExpenseAmount, formatAmount } = useCurrency();
  const [showPercentages, setShowPercentages] = useState(true);

  const categoryData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    // Filter to current month only
    const monthlyExpenses = getMonthlyExpenses(expenses);
    if (monthlyExpenses.length === 0) return [];

    // Group expenses by category and calculate totals
    const categoryTotals = monthlyExpenses.reduce((acc, expense) => {
      // Handle category - could be string or object from API
      const category = typeof expense.category === 'string'
        ? expense.category
        : expense.category?.name || 'Other';

      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += convertExpenseAmount(expense);
      return acc;
    }, {});

    // Convert to array with category info
    return Object.entries(categoryTotals)
      .map(([categoryName, value]) => {
        const categoryInfo = getCategoryInfo(categoryName, categories);
        return {
          name: categoryInfo.name,
          value: parseFloat(value.toFixed(2)),
          color: categoryInfo.color,
          icon: categoryInfo.icon
        };
      })
      .filter(cat => cat.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [expenses, categories]);

  const total = categoryData?.reduce((sum, item) => sum + item?.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload?.length) {
      const data = payload?.[0]?.payload;
      const percentage = ((data?.value / total) * 100)?.toFixed(1);
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data?.color }}
            />
            <p className="text-sm font-medium text-popover-foreground">{data?.name}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Amount: <span className="font-semibold text-foreground">{formatAmount(data?.value)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Percentage: <span className="font-semibold text-foreground">{percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (!showPercentages) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="600"
      >
        {`${(percent * 100)?.toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h3 className="text-lg font-semibold text-foreground mb-1">Category Breakdown</h3>
          <p className="text-sm text-muted-foreground">Spending distribution by category</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPercentages(!showPercentages)}
          iconName={showPercentages ? 'EyeOff' : 'Eye'}
          iconPosition="left"
          iconSize={16}
        >
          {showPercentages ? 'Hide' : 'Show'} %
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData?.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry?.color}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category List */}
        <div className="space-y-3">
          {categoryData?.sort((a, b) => b?.value - a?.value)?.map((category, index) => {
              const percentage = ((category?.value / total) * 100)?.toFixed(1);
              return (
                <div key={category?.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-150">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: category?.color }}
                    />
                    <div className="flex items-center space-x-2">
                      <Icon name={category?.icon} size={16} className="text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{category?.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatAmount(category?.value)}</p>
                    <p className="text-xs text-muted-foreground">{percentage}%</p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default CategoryBreakdownChart;