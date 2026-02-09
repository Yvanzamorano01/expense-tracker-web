import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

import Button from '../../../components/ui/Button';
import { useCurrency } from '../../../hooks/useCurrency';

const BudgetHistory = ({ historyData, currency }) => {
  const { formatAmount } = useCurrency();
  const [viewType, setViewType] = useState('bar'); // 'bar' or 'line'
  const [timeRange, setTimeRange] = useState('6months'); // '3months', '6months', '1year'

  const getFilteredData = () => {
    const months = timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12;
    return historyData?.slice(-months);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-popover-foreground mb-2">{label}</p>
          {payload?.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry?.color }}
              />
              <span className="text-muted-foreground">{entry?.dataKey}:</span>
              <span className="font-medium text-popover-foreground">
                {formatAmount(entry?.value || 0)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const filteredData = getFilteredData();

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <h3 className="text-lg font-semibold text-foreground">Budget History</h3>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              variant={timeRange === '3months' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('3months')}
              className="rounded-none border-0"
            >
              3M
            </Button>
            <Button
              variant={timeRange === '6months' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('6months')}
              className="rounded-none border-0"
            >
              6M
            </Button>
            <Button
              variant={timeRange === '1year' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('1year')}
              className="rounded-none border-0"
            >
              1Y
            </Button>
          </div>
          
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              variant={viewType === 'bar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('bar')}
              className="rounded-none border-0"
              iconName="BarChart3"
              iconSize={16}
            >
              Bar
            </Button>
            <Button
              variant={viewType === 'line' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('line')}
              className="rounded-none border-0"
              iconName="TrendingUp"
              iconSize={16}
            >
              Line
            </Button>
          </div>
        </div>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === 'bar' ? (
            <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => formatAmount(value || 0)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="budget"
                fill="#3B82F6"
                name="Budget"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="spent"
                fill="#10B981"
                name="Spent"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => formatAmount(value || 0)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="budget"
                stroke="#3B82F6"
                strokeWidth={3}
                name="Budget"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2, fill: '#3B82F6' }}
                connectNulls={true}
              />
              <Line
                type="monotone"
                dataKey="spent"
                stroke="#10B981"
                strokeWidth={3}
                name="Spent"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 2, fill: '#10B981' }}
                connectNulls={true}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground mb-1">
            {formatAmount(filteredData?.reduce((sum, month) => sum + month?.budget, 0) / filteredData?.length || 0)}
          </div>
          <div className="text-sm text-muted-foreground">Avg Monthly Budget</div>
        </div>

        <div className="text-center">
          <div className="text-lg font-semibold text-foreground mb-1">
            {formatAmount(filteredData?.reduce((sum, month) => sum + month?.spent, 0) / filteredData?.length || 0)}
          </div>
          <div className="text-sm text-muted-foreground">Avg Monthly Spending</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-success mb-1">
            {((filteredData?.filter(month => month?.spent <= month?.budget)?.length / filteredData?.length) * 100)?.toFixed(0)}%
          </div>
          <div className="text-sm text-muted-foreground">Months On Budget</div>
        </div>
      </div>
    </div>
  );
};

export default BudgetHistory;