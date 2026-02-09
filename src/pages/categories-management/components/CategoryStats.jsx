import React from 'react';
import Icon from '../../../components/AppIcon';
import { useCurrency } from '../../../hooks/useCurrency';

const CategoryStats = ({ categories }) => {
  const { formatAmount } = useCurrency();

  const totalCategories = categories?.length;
  const totalSpent = categories?.reduce((sum, cat) => sum + cat?.spent, 0);
  const totalBudget = categories?.reduce((sum, cat) => sum + cat?.budget, 0);
  const categoriesOverBudget = categories?.filter(cat => cat?.budget > 0 && cat?.spent > cat?.budget)?.length;
  const averageSpending = totalCategories > 0 ? totalSpent / totalCategories : 0;

  const stats = [
    {
      label: 'Total Categories',
      value: totalCategories,
      icon: 'Tag',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Total Spent',
      value: formatAmount(totalSpent || 0),
      icon: 'DollarSign',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Total Budget',
      value: formatAmount(totalBudget || 0),
      icon: 'Target',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      label: 'Over Budget',
      value: categoriesOverBudget,
      icon: 'AlertTriangle',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats?.map((stat, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${stat?.bgColor} flex items-center justify-center`}>
              <Icon name={stat?.icon} size={20} className={stat?.color} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat?.label}</p>
              <p className="text-lg font-semibold text-foreground">{stat?.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryStats;