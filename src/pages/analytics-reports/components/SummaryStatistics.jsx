import React from 'react';
import Icon from '../../../components/AppIcon';
import { useCurrency } from '../../../hooks/useCurrency';

const SummaryStatistics = ({ statistics }) => {
  const { formatAmount } = useCurrency();
  const StatCard = ({ title, value, change, trend, icon, color = "text-foreground" }) => {
    const getTrendColor = (trend) => {
      if (trend === 'up') return 'text-error';
      if (trend === 'down') return 'text-success';
      return 'text-muted-foreground';
    };

    const getTrendIcon = (trend) => {
      if (trend === 'up') return 'TrendingUp';
      if (trend === 'down') return 'TrendingDown';
      return 'Minus';
    };

    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg bg-muted ${color}`}>
              <Icon name={icon} size={20} />
            </div>
            <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
          </div>
          {change && (
            <div className={`flex items-center space-x-1 ${getTrendColor(trend)}`}>
              <Icon name={getTrendIcon(trend)} size={16} />
              <span className="text-sm font-medium">{change}</span>
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Summary Statistics</h2>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date()?.toLocaleDateString()}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Expenses"
          value={formatAmount(statistics?.totalExpenses || 0)}
          change={`${statistics?.totalExpensesChange}%`}
          trend={statistics?.totalExpensesTrend}
          icon="DollarSign"
          color="text-primary"
        />
        
        <StatCard
          title="Average Daily"
          value={formatAmount(statistics?.averageDaily || 0)}
          change={`${statistics?.averageDailyChange}%`}
          trend={statistics?.averageDailyTrend}
          icon="Calendar"
          color="text-accent"
        />
        
        <StatCard
          title="Highest Category"
          value={statistics?.highestCategory?.name}
          change={formatAmount(statistics?.highestCategory?.spent || 0)}
          trend="neutral"
          icon="Tag"
          color="text-warning"
        />
        
        <StatCard
          title="Budget Variance"
          value={`${statistics?.budgetVariance}%`}
          change={statistics?.budgetVarianceChange > 0 ? `+${statistics?.budgetVarianceChange}%` : `${statistics?.budgetVarianceChange}%`}
          trend={statistics?.budgetVariance > 0 ? 'up' : 'down'}
          icon="Target"
          color="text-secondary"
        />
      </div>
      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Rankings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Categories</h3>
          <div className="space-y-3">
            {statistics?.categoryRankings?.map((category, index) => (
              <div key={category?.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category?.color }}
                    />
                    <span className="text-sm font-medium text-foreground">{category?.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">
                    {formatAmount(category?.amount || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {category?.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Comparison</h3>
          <div className="space-y-3">
            {statistics?.monthlyComparison?.map((month) => (
              <div key={month?.month} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-foreground w-16">{month?.month}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 max-w-32">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(month?.amount / statistics?.maxMonthlyAmount) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">
                    {formatAmount(month?.amount || 0)}
                  </div>
                  <div className={`text-xs flex items-center space-x-1 ${
                    month?.change > 0 ? 'text-error' : month?.change < 0 ? 'text-success' : 'text-muted-foreground'
                  }`}>
                    <Icon
                      name={month?.change > 0 ? 'TrendingUp' : month?.change < 0 ? 'TrendingDown' : 'Minus'}
                      size={12}
                    />
                    <span>{month?.change !== undefined && month?.change !== null ? Math.abs(month.change).toFixed(0) : '0'}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryStatistics;