import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import Button from '../../../components/ui/Button';
import { calculateTrendData } from '../../../utils/dataHelpers';

const ExpenseTrendChart = ({ expenses = [] }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');

  const chartData = useMemo(() => {
    return calculateTrendData(expenses, selectedPeriod);
  }, [expenses, selectedPeriod]);

  const periods = [
    { key: 'daily', label: 'Daily', icon: 'Calendar' },
    { key: 'weekly', label: 'Weekly', icon: 'CalendarDays' },
    { key: 'monthly', label: 'Monthly', icon: 'CalendarRange' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-popover-foreground">{label}</p>
          <p className="text-sm text-primary">
            Amount: <span className="font-semibold">${payload?.[0]?.value?.toFixed(2)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h3 className="text-lg font-semibold text-foreground mb-1">Expense Trends</h3>
          <p className="text-sm text-muted-foreground">Track your spending patterns over time</p>
        </div>
        <div className="flex items-center space-x-2">
          {periods?.map((period) => (
            <Button
              key={period?.key}
              variant={selectedPeriod === period?.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period?.key)}
              iconName={period?.icon}
              iconPosition="left"
              iconSize={16}
            >
              {period?.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="name" 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="var(--color-primary)" 
              strokeWidth={3}
              dot={{ fill: 'var(--color-primary)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'var(--color-primary)', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExpenseTrendChart;