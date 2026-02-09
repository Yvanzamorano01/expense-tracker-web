import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { useCurrency } from '../../../hooks/useCurrency';

const SpendingInsights = ({ insights }) => {
  const { formatAmount } = useCurrency();
  const [showAll, setShowAll] = useState(false);

  // Calculate insights to display
  const allKeyInsights = insights?.keyInsights || [];
  const displayedInsights = showAll ? allKeyInsights : allKeyInsights.slice(0, 4);
  const hasMoreInsights = allKeyInsights.length > 4;
  const InsightCard = ({ type, title, description, badge, recommendation, icon, priority = 'medium' }) => {
    const getTypeStyles = (type) => {
      switch (type) {
        case 'warning':
          return {
            border: 'border-red-200 dark:border-red-800',
            bg: 'bg-card',
            iconBg: 'bg-transparent',
            iconColor: 'text-red-600 dark:text-red-400',
            badgeBg: 'bg-transparent',
            badgeText: 'text-red-600 dark:text-red-400'
          };
        case 'success':
          return {
            border: 'border-green-200 dark:border-green-800',
            bg: 'bg-card',
            iconBg: 'bg-transparent',
            iconColor: 'text-green-600 dark:text-green-400',
            badgeBg: 'bg-transparent',
            badgeText: 'text-green-600 dark:text-green-400'
          };
        case 'info':
          return {
            border: 'border-blue-200 dark:border-blue-800',
            bg: 'bg-card',
            iconBg: 'bg-transparent',
            iconColor: 'text-blue-600 dark:text-blue-400',
            badgeBg: 'bg-transparent',
            badgeText: 'text-blue-600 dark:text-blue-400'
          };
        default:
          return {
            border: 'border-border',
            bg: 'bg-card',
            iconBg: 'bg-transparent',
            iconColor: 'text-foreground',
            badgeBg: 'bg-transparent',
            badgeText: 'text-foreground'
          };
      }
    };

    const styles = getTypeStyles(type);

    return (
      <div className={`border-2 ${styles.border} ${styles.bg} rounded-xl p-5`}>
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${styles.iconBg}`}>
              <Icon name={icon} size={24} className={styles.iconColor} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title and Badge */}
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-base font-semibold text-foreground pr-2">{title}</h4>
              {badge && (
                <span className={`px-2.5 py-1 rounded-md text-sm font-semibold ${styles.badgeBg} ${styles.badgeText} whitespace-nowrap`}>
                  {badge}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{description}</p>

            {/* Recommendation */}
            {recommendation && (
              <div className="flex items-start space-x-2 pt-2 border-t border-border/50">
                <Icon name="Lightbulb" size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">{recommendation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const PatternCard = ({ pattern }) => (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center space-x-3 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10">
          <Icon name="TrendingUp" size={16} className="text-accent" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">{pattern?.title}</h4>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Frequency:</span>
          <span className="text-sm font-medium text-foreground">{pattern?.frequency}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Average Amount:</span>
          <span className="text-sm font-medium text-foreground">{formatAmount(pattern?.averageAmount || 0)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Next Predicted:</span>
          <span className="text-sm font-medium text-foreground">{pattern?.nextPredicted}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Spending Insights</h2>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Icon name="Brain" size={16} />
          <span>AI-Powered Analysis</span>
        </div>
      </div>
      {/* Key Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Key Insights</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayedInsights.map((insight, index) => (
            <InsightCard key={index} {...insight} />
          ))}
        </div>

        {/* Show All / Show Less Button */}
        {hasMoreInsights && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors border border-border hover:border-primary/50 rounded-lg bg-card"
            >
              <span>
                {showAll ? 'Show Less' : `Show All (${allKeyInsights.length})`}
              </span>
              <Icon
                name={showAll ? 'ChevronUp' : 'ChevronDown'}
                size={16}
                className="transition-transform"
              />
            </button>
          </div>
        )}
      </div>
      {/* Spending Patterns */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Spending Patterns</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights?.spendingPatterns?.map((pattern, index) => (
            <PatternCard key={index} pattern={pattern} />
          ))}
        </div>
      </div>
      {/* Budget Variance Analysis */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Budget Variance Analysis</h3>
        <div className="space-y-4">
          {insights?.budgetVariance?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="Target" size={48} className="mx-auto mb-3 opacity-50" />
              <p className="font-medium">No budgets set yet</p>
              <p className="text-sm mt-2">
                Visit Budget Management to set category budgets and track your spending.
              </p>
            </div>
          ) : (
            insights?.budgetVariance?.map((variance, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: variance?.color }}
                  />
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{variance?.category}</h4>
                    <p className="text-xs text-muted-foreground">
                      Budget: {formatAmount(variance?.budget || 0)} | Actual: {formatAmount(variance?.actual || 0)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    variance?.variance > 0 ? 'text-error' : 'text-success'
                  }`}>
                    {variance?.variance > 0 ? '+' : ''}{formatAmount(Math.abs(variance?.variance) || 0)}
                  </div>
                  <div className={`text-xs ${
                    variance?.percentage > 0 ? 'text-error' : 'text-success'
                  }`}>
                    {variance?.percentage > 0 ? '+' : ''}{variance?.percentage}%
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Predictive Insights */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <span
            className="cursor-help"
            title="Uses 3-month spending trends, recurring patterns, and budget data to estimate future expenses."
          >
            <Icon name="HelpCircle" size={20} className="text-primary hover:text-primary/80 transition-colors" />
          </span>
          <h3 className="text-lg font-medium text-foreground">Predictive Insights</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              {insights?.predictions?.nextMonth?.periodLabel || 'Next Month'} Prediction
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estimated Spending:</span>
                <div className="flex items-center space-x-2">
                  {/* Trend Icon */}
                  {insights?.predictions?.nextMonth?.trend === 'up' && (
                    <Icon name="TrendingUp" size={14} className="text-error" />
                  )}
                  {insights?.predictions?.nextMonth?.trend === 'down' && (
                    <Icon name="TrendingDown" size={14} className="text-success" />
                  )}
                  {insights?.predictions?.nextMonth?.trend === 'stable' && (
                    <Icon name="Minus" size={14} className="text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {formatAmount(insights?.predictions?.nextMonth?.estimated || 0)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Confidence:</span>
                <span className={`text-sm font-medium ${
                  (insights?.predictions?.nextMonth?.confidence || 0) < 40
                    ? 'text-error'
                    : (insights?.predictions?.nextMonth?.confidence || 0) >= 70
                    ? 'text-success'
                    : 'text-warning'
                }`}>
                  {insights?.predictions?.nextMonth?.confidence}%
                </span>
              </div>
              {/* Confidence explanation */}
              {(insights?.predictions?.nextMonth?.confidence || 0) < 50 && (
                <p className="text-xs text-muted-foreground italic mt-2">
                  Low confidence due to limited historical data
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Savings Opportunity</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Potential Savings:</span>
                <span className="text-sm font-medium text-success">
                  {formatAmount(insights?.predictions?.savingsOpportunity?.amount || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Top Category:</span>
                <span className="text-sm font-medium text-foreground">
                  {insights?.predictions?.savingsOpportunity?.category}
                </span>
              </div>
              {/* Savings reason/explanation */}
              {insights?.predictions?.savingsOpportunity?.reason && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insights?.predictions?.savingsOpportunity?.reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingInsights;