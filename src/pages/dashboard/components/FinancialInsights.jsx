import React, { useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import { generateFinancialInsights } from '../../../utils/insightsHelpers';
import { useCurrency } from '../../../hooks/useCurrency';

const FinancialInsights = ({ expenses, categories }) => {
  const { formatFromUSD } = useCurrency();

  // Calculate all insights
  const insights = useMemo(() => {
    if (!expenses || expenses.length === 0 || !categories) {
      return null;
    }
    return generateFinancialInsights(expenses, categories);
  }, [expenses, categories]);

  // If no insights data available
  if (!insights || !insights.recommendations || insights.recommendations.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Financial Insights</h3>
            <p className="text-sm text-muted-foreground">Track more expenses to get personalized insights</p>
          </div>
          <Icon name="Lightbulb" size={24} className="text-warning" />
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
          <Icon name="BarChart3" size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Keep tracking your expenses to unlock personalized insights and spending recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Financial Insights</h3>
          <p className="text-sm text-muted-foreground">Smart recommendations based on your spending</p>
        </div>
        <Icon name="Lightbulb" size={24} className="text-warning" />
      </div>

      {/* Insights Grid */}
      <div className="space-y-6">
        {/* Month Comparison */}
        {insights.monthComparison && Math.abs(insights.monthComparison.percentageChange) > 0 && (
          <div className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: insights.monthComparison.isIncrease ? '#FEE2E2' : '#D1FAE5'
              }}
            >
              <Icon
                name={insights.monthComparison.isIncrease ? 'TrendingUp' : 'TrendingDown'}
                size={20}
                className={insights.monthComparison.isIncrease ? 'text-error' : 'text-success'}
              />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-1">Monthly Trend</h4>
              <p className="text-sm text-muted-foreground">
                You spent <span className="font-semibold text-foreground">
                  {formatFromUSD(Math.abs(insights.monthComparison.difference))}
                </span> {insights.monthComparison.isIncrease ? 'more' : 'less'} than last month
                <span className={`ml-1 font-semibold ${insights.monthComparison.isIncrease ? 'text-error' : 'text-success'}`}>
                  ({Math.abs(insights.monthComparison.percentageChange).toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Top Spending Categories */}
        {insights.topCategories && insights.topCategories.length > 0 && (
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Top Spending Categories</h4>
            <div className="space-y-3">
              {insights.topCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${category.color}20`,
                        color: category.color
                      }}
                    >
                      <Icon name={category.icon} size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {category.percentage.toFixed(1)}% of total spending
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {formatFromUSD(category.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Alerts */}
        {insights.budgetAlerts && (insights.budgetAlerts.exceeded.length > 0 || insights.budgetAlerts.approaching.length > 0) && (
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Budget Alerts</h4>
            <div className="space-y-2">
              {insights.budgetAlerts.exceeded.map((alert, index) => (
                <div key={`exceeded-${index}`} className="flex items-center space-x-2 p-2 bg-error/10 rounded-md">
                  <Icon name="AlertCircle" size={16} className="text-error flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{alert.category}</span> budget exceeded:
                    <span className="font-semibold ml-1">{formatFromUSD(alert.spent)}</span> / {formatFromUSD(alert.budget)}
                  </p>
                </div>
              ))}
              {insights.budgetAlerts.approaching.map((alert, index) => (
                <div key={`approaching-${index}`} className="flex items-center space-x-2 p-2 bg-warning/10 rounded-md">
                  <Icon name="AlertTriangle" size={16} className="text-warning flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{alert.category}</span> at {alert.percentage.toFixed(0)}% of budget
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Savings Opportunities */}
        {insights.savingsOpportunities && insights.savingsOpportunities.length > 0 && (
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Savings Opportunities</h4>
            <div className="space-y-2">
              {insights.savingsOpportunities.map((opp, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Icon name="Lightbulb" size={16} className="text-warning mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{opp.category}</span> spending increased by{' '}
                    <span className="font-semibold text-warning">
                      {formatFromUSD(opp.increase)}
                    </span> ({opp.percentageIncrease.toFixed(1)}%) from last month
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Average */}
        {insights.dailyAverage && insights.dailyAverage.average > 0 && (
          <div className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
              <Icon name="Calendar" size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-1">Daily Average</h4>
              <p className="text-sm text-muted-foreground">
                You spend an average of <span className="font-semibold text-foreground">
                  {formatFromUSD(insights.dailyAverage.average)}
                </span> per day this month
                ({insights.dailyAverage.daysWithExpenses} days with expenses)
              </p>
            </div>
          </div>
        )}

        {/* Smart Recommendations */}
        {insights.recommendations && insights.recommendations.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="font-medium text-foreground mb-3 flex items-center">
              <Icon name="Sparkles" size={18} className="mr-2 text-primary" />
              Smart Recommendations
            </h4>
            <div className="space-y-2">
              {insights.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${
                    rec.type === 'error' ? 'bg-error/5 border-error/20' :
                    rec.type === 'warning' ? 'bg-warning/5 border-warning/20' :
                    rec.type === 'success' ? 'bg-success/5 border-success/20' :
                    'bg-primary/5 border-primary/20'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${rec.color}20` }}
                  >
                    <Icon name={rec.icon} size={16} style={{ color: rec.color }} />
                  </div>
                  <p className="text-sm text-foreground flex-1 pt-1">{rec.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialInsights;
