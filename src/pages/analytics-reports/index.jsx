import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import BottomNavigation from '../../components/ui/BottomNavigation';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import ChartControls from './components/ChartControls';
import InteractiveChart from './components/InteractiveChart';
import SummaryStatistics from './components/SummaryStatistics';
import ReportGenerator from './components/ReportGenerator';
import SpendingInsights from './components/SpendingInsights';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { loadExpenses, loadCategories, loadCategoriesWithBudgets } from '../../utils/storageHelpers';
import { calculateStats, getMonthlyExpenses, isSameMonth } from '../../utils/dataHelpers';
import { generateKeyInsights, detectSpendingPatterns } from '../../utils/insightEngine';
import { predictNextPeriodSpending, identifySavingsOpportunity } from '../../utils/predictionEngine';
import { generateReportData, exportToPDF, exportToCSV, exportToJSON } from '../../utils/reportGenerator';
import HeadlessChartRenderer from '../../components/HeadlessChartRenderer';
import { chartElementToImage, generateChartDataForReport } from '../../utils/chartToImage';
import { useCurrency } from '../../hooks/useCurrency';

const AnalyticsReports = () => {
  const { convertExpenseAmount, formatAmount } = useCurrency();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedChartType, setSelectedChartType] = useState('pie');
  const [activeTab, setActiveTab] = useState('overview');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // State for real data
  const [hasData, setHasData] = useState(true);
  const [expenses, setExpenses] = useState([]); // Filtered expenses for current view
  const [allExpenses, setAllExpenses] = useState([]); // All expenses (for monthly comparison)
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data on mount
  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load from API via storageHelpers (loadCategoriesWithBudgets includes budget data)
        const [savedExpenses, savedCategories] = await Promise.all([
          loadExpenses(),
          loadCategoriesWithBudgets()
        ]);

        console.log('📊 Analytics data loaded - Expenses:', savedExpenses?.length, 'Categories:', savedCategories?.length);

        const hasExpenses = savedExpenses && savedExpenses.length > 0;
        setHasData(hasExpenses);

        if (hasExpenses) {
          // Store all expenses for monthly comparison
          setAllExpenses(savedExpenses);

          // Apply time period filter
          let filteredExpenses = filterByPeriod(savedExpenses, selectedPeriod);

          // Apply category filter if not "all"
          if (selectedCategory !== 'all') {
            filteredExpenses = filteredExpenses.filter(expense => expense.category === selectedCategory);
          }

          // Calculate category stats with filtered expenses
          const categoriesWithStats = savedCategories.map(category => {
            const categoryExpenses = filteredExpenses.filter(exp =>
              parseInt(exp.categoryId) === parseInt(category.id)
            );
            const spent = categoryExpenses.reduce((sum, exp) => {
              const convertedAmount = convertExpenseAmount(exp);
              return sum + convertedAmount;
            }, 0);

            return {
              ...category,
              spent: parseFloat(spent.toFixed(2)),
              transactionCount: categoryExpenses.length
            };
          });

          setExpenses(filteredExpenses);
          setCategories(categoriesWithStats);
          setStats(calculateStats(filteredExpenses, convertExpenseAmount));
        } else {
          setAllExpenses([]);
          setExpenses([]);
          setCategories([]);
          setStats(null);
        }
      } catch (err) {
        console.error('❌ Error loading analytics data:', err);
        setError(err?.message || 'Failed to load analytics data');
        setHasData(false);
        setAllExpenses([]);
        setExpenses([]);
        setCategories([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [selectedPeriod, selectedCategory, customDateRange]);

  // Filter expenses by time period
  const filterByPeriod = (expenses, period) => {
    const now = new Date();

    switch (period) {
      case 'week': {
        // Current calendar week (Monday = start, Sunday = end)
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday should be 6 days from Monday

        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - daysFromMonday);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Sunday
        weekEnd.setHours(23, 59, 59, 999);

        return expenses.filter(exp => {
          const expDate = new Date(exp.date);
          return expDate >= weekStart && expDate <= weekEnd;
        });
      }

      case 'month': {
        // Current month only
        return getMonthlyExpenses(expenses);
      }

      case 'lastmonth': {
        // Previous calendar month
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return getMonthlyExpenses(expenses, lastMonth);
      }

      case 'quarter': {
        // Last 3 months
        const quarterAgo = new Date(now);
        quarterAgo.setMonth(now.getMonth() - 3);
        return expenses.filter(exp => new Date(exp.date) >= quarterAgo);
      }

      case 'year': {
        // Last 12 months
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        return expenses.filter(exp => new Date(exp.date) >= yearAgo);
      }

      case 'custom': {
        // Custom date range
        if (!customDateRange.startDate || !customDateRange.endDate) {
          return expenses; // If no dates selected, return all
        }
        const start = new Date(customDateRange.startDate);
        const end = new Date(customDateRange.endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date
        return expenses.filter(exp => {
          const expDate = new Date(exp.date);
          return expDate >= start && expDate <= end;
        });
      }

      case 'all': {
        // All time - return all expenses without filtering
        return expenses;
      }

      default:
        return expenses;
    }
  };

  // Calculate monthly comparison data
  const calculateMonthlyComparison = (allExpenses) => {
    const monthlyData = [];

    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      // Get expenses for this month
      const monthExpenses = allExpenses.filter(exp => isSameMonth(exp.date, date));
      const total = monthExpenses.reduce((sum, exp) => {
        const convertedAmount = convertExpenseAmount(exp);
        return sum + convertedAmount;
      }, 0);

      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        amount: parseFloat(total.toFixed(2)),
        year: date.getFullYear()
      });
    }

    // Calculate percentage changes
    for (let i = 0; i < monthlyData.length; i++) {
      if (i === monthlyData.length - 1) {
        // Last month (oldest) has no previous month to compare
        monthlyData[i].change = 0;
      } else {
        const current = monthlyData[i].amount;
        const previous = monthlyData[i + 1].amount;

        if (previous > 0) {
          const change = ((current - previous) / previous) * 100;
          monthlyData[i].change = parseFloat(change.toFixed(1));
        } else if (current > 0) {
          // If previous was 0 but current has value, that's 100% increase
          monthlyData[i].change = 100;
        } else {
          // Both are 0
          monthlyData[i].change = 0;
        }
      }
    }

    // Reverse to show oldest to newest
    return monthlyData.reverse();
  };

  // Generate chart data from real expenses
  const getChartData = () => {
    if (!hasData || !stats || expenses.length === 0) return [];

    if (selectedChartType === 'pie') {
      // Category breakdown for pie chart
      return categories
        .filter(cat => cat.spent > 0)
        .map(cat => ({
          name: cat.name,
          value: cat.spent,
          color: cat.color
        }));
    } else {
      // Bar/Line/Area charts - adapt to selected period
      const now = new Date();
      const data = [];

      switch (selectedPeriod) {
        case 'week': {
          // Show Monday through Sunday of current week
          const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

          // Calculate start of week (Monday)
          const dayOfWeek = now.getDay();
          const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - daysFromMonday);
          weekStart.setHours(0, 0, 0, 0);

          // Generate data for each day of the week
          for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);

            const dayExpenses = expenses.filter(expense => {
              const expenseDate = new Date(expense.date);
              return expenseDate >= date && expenseDate < nextDay;
            });

            const dayTotal = dayExpenses.reduce((sum, expense) => {
              const convertedAmount = convertExpenseAmount(expense);
              return sum + convertedAmount;
            }, 0);

            data.push({
              name: dayNames[i],
              value: parseFloat(dayTotal.toFixed(2))
            });
          }
          return data;
        }

        case 'month': {
          // Show calendar weeks of current month (Week 1 = days 1-7, Week 2 = days 8-14, etc.)
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const daysInMonth = lastDayOfMonth.getDate();
          const numberOfWeeks = Math.ceil(daysInMonth / 7);

          for (let weekNum = 1; weekNum <= numberOfWeeks; weekNum++) {
            const weekStartDay = (weekNum - 1) * 7 + 1;
            const weekEndDay = Math.min(weekNum * 7, daysInMonth);

            const weekStart = new Date(now.getFullYear(), now.getMonth(), weekStartDay);
            const weekEnd = new Date(now.getFullYear(), now.getMonth(), weekEndDay);
            weekEnd.setHours(23, 59, 59, 999);

            const weekExpenses = expenses.filter(expense => {
              const expenseDate = new Date(expense.date);
              return expenseDate >= weekStart && expenseDate <= weekEnd;
            });

            const weekTotal = weekExpenses.reduce((sum, expense) => {
              const convertedAmount = convertExpenseAmount(expense);
              return sum + convertedAmount;
            }, 0);

            data.push({
              name: `Week ${weekNum}`,
              value: parseFloat(weekTotal.toFixed(2))
            });
          }
          return data;
        }

        case 'lastmonth': {
          // Show calendar weeks of previous month (Week 1 = days 1-7, Week 2 = days 8-14, etc.)
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const firstDayOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
          const lastDayOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
          const daysInMonth = lastDayOfMonth.getDate();
          const numberOfWeeks = Math.ceil(daysInMonth / 7);

          for (let weekNum = 1; weekNum <= numberOfWeeks; weekNum++) {
            const weekStartDay = (weekNum - 1) * 7 + 1;
            const weekEndDay = Math.min(weekNum * 7, daysInMonth);

            const weekStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), weekStartDay);
            const weekEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), weekEndDay);
            weekEnd.setHours(23, 59, 59, 999);

            const weekExpenses = expenses.filter(expense => {
              const expenseDate = new Date(expense.date);
              return expenseDate >= weekStart && expenseDate <= weekEnd;
            });

            const weekTotal = weekExpenses.reduce((sum, expense) => {
              const convertedAmount = convertExpenseAmount(expense);
              return sum + convertedAmount;
            }, 0);

            data.push({
              name: `Week ${weekNum}`,
              value: parseFloat(weekTotal.toFixed(2))
            });
          }
          return data;
        }

        case 'quarter': {
          // Show last 3 months
          for (let i = 2; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(now.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const monthExpenses = expenses.filter(expense => {
              const expenseDate = new Date(expense.date);
              return expenseDate >= monthStart && expenseDate <= monthEnd;
            });

            const monthTotal = monthExpenses.reduce((sum, expense) => {
              const convertedAmount = convertExpenseAmount(expense);
              return sum + convertedAmount;
            }, 0);

            data.push({
              name: date.toLocaleDateString('en-US', { month: 'short' }),
              value: parseFloat(monthTotal.toFixed(2))
            });
          }
          return data;
        }

        case 'year': {
          // Show last 12 months
          for (let i = 11; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(now.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const monthExpenses = expenses.filter(expense => {
              const expenseDate = new Date(expense.date);
              return expenseDate >= monthStart && expenseDate <= monthEnd;
            });

            const monthTotal = monthExpenses.reduce((sum, expense) => {
              const convertedAmount = convertExpenseAmount(expense);
              return sum + convertedAmount;
            }, 0);

            data.push({
              name: date.toLocaleDateString('en-US', { month: 'short' }),
              value: parseFloat(monthTotal.toFixed(2))
            });
          }
          return data;
        }

        case 'custom': {
          // Show custom range - group by day if range < 31 days, otherwise by month
          if (!customDateRange.startDate || !customDateRange.endDate) {
            return []; // No dates selected
          }

          const start = new Date(customDateRange.startDate);
          const end = new Date(customDateRange.endDate);
          const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

          if (daysDiff <= 31) {
            // Show daily breakdown for ranges up to 31 days
            for (let i = 0; i <= daysDiff; i++) {
              const date = new Date(start);
              date.setDate(start.getDate() + i);
              const nextDay = new Date(date);
              nextDay.setDate(date.getDate() + 1);

              const dayExpenses = expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate >= date && expenseDate < nextDay;
              });

              const dayTotal = dayExpenses.reduce((sum, expense) => {
                const convertedAmount = convertExpenseAmount(expense);
                return sum + convertedAmount;
              }, 0);

              data.push({
                name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: parseFloat(dayTotal.toFixed(2))
              });
            }
          } else {
            // Show monthly breakdown for longer ranges
            const months = Math.ceil(daysDiff / 30);
            for (let i = 0; i < months; i++) {
              const monthDate = new Date(start);
              monthDate.setMonth(start.getMonth() + i);
              const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
              const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

              const monthExpenses = expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate >= monthStart && expenseDate <= monthEnd;
              });

              const monthTotal = monthExpenses.reduce((sum, expense) => {
              const convertedAmount = convertExpenseAmount(expense);
              return sum + convertedAmount;
            }, 0);

              data.push({
                name: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                value: parseFloat(monthTotal.toFixed(2))
              });
            }
          }
          return data;
        }

        case 'all': {
          // Show all time - monthly breakdown from first expense to now
          if (expenses.length === 0) return [];

          // Find date range
          const expenseDates = expenses.map(e => new Date(e.date));
          const oldestDate = new Date(Math.min(...expenseDates));
          const newestDate = new Date(Math.max(...expenseDates));

          // Calculate number of months between oldest and newest expense
          const monthsDiff = (newestDate.getFullYear() - oldestDate.getFullYear()) * 12
                            + (newestDate.getMonth() - oldestDate.getMonth()) + 1;

          // Build monthly data
          for (let i = 0; i < monthsDiff; i++) {
            const monthDate = new Date(oldestDate);
            monthDate.setMonth(oldestDate.getMonth() + i);
            const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
            monthEnd.setHours(23, 59, 59, 999);

            const monthExpenses = expenses.filter(expense => {
              const expenseDate = new Date(expense.date);
              return expenseDate >= monthStart && expenseDate <= monthEnd;
            });

            const monthTotal = monthExpenses.reduce((sum, expense) => {
              const convertedAmount = convertExpenseAmount(expense);
              return sum + convertedAmount;
            }, 0);

            // Show year in label if spanning multiple years
            const showYear = monthsDiff > 12;
            data.push({
              name: monthDate.toLocaleDateString('en-US', {
                month: 'short',
                year: showYear ? '2-digit' : undefined
              }),
              value: parseFloat(monthTotal.toFixed(2))
            });
          }
          return data;
        }

        default:
          // Fallback to 4 weeks if period not recognized
          for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (i * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);

            const weekExpenses = expenses.filter(expense => {
              const expenseDate = new Date(expense.date);
              return expenseDate >= weekStart && expenseDate < weekEnd;
            });

            const weekTotal = weekExpenses.reduce((sum, expense) => {
              const convertedAmount = convertExpenseAmount(expense);
              return sum + convertedAmount;
            }, 0);

            data.push({
              name: `Week ${4 - i}`,
              value: parseFloat(weekTotal.toFixed(2))
            });
          }
          return data;
      }
    }
  };

  // Calculate summary statistics from real data
  const summaryStatistics = (hasData && stats) ? {
    totalExpenses: stats.totalExpenses || 0,
    totalExpensesChange: 0,
    totalExpensesTrend: 'neutral',
    averageDaily: (() => {
      // Calculate actual average per day based on period
      if (selectedPeriod === 'week') {
        // For week view, calculate based on actual days passed in the current week
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysPassedInWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Sunday counts as day 7
        return stats.totalExpenses / daysPassedInWeek;
      }
      const daysInPeriod = selectedPeriod === 'month' ? 30 :
                           selectedPeriod === 'quarter' ? 90 :
                           selectedPeriod === 'year' ? 365 : 30;
      return stats.totalExpenses / daysInPeriod;
    })(),
    averageDailyChange: 0,
    averageDailyTrend: 'neutral',
    highestCategory: categories.length > 0 ? categories.reduce((highest, cat) =>
      cat.spent > (highest?.spent || 0) ? cat : highest
    , categories[0]) : null,
    budgetVariance: 0,
    budgetVarianceChange: 0,
    categoryRankings: categories
      .filter(cat => cat.spent > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5)
      .map((cat, index) => ({
        id: cat.id,
        name: cat.name,
        amount: cat.spent,
        percentage: Math.round((cat.spent / stats.totalExpenses) * 100),
        color: cat.color
      })),
    monthlyComparison: calculateMonthlyComparison(allExpenses),
    maxMonthlyAmount: stats.monthlyTotal || 0
  } : null;

  // Generate intelligent spending insights using insight engine
  const spendingInsights = (hasData && stats && expenses.length > 0) ? (() => {
    // Calculate patterns and budget variance first
    const patterns = detectSpendingPatterns(allExpenses, selectedPeriod, convertExpenseAmount);
    const budgetVariance = categories
      .filter(cat => cat.budget > 0)  // Show all categories with budgets
      .map(cat => ({
        category: cat.name,
        budget: cat.budget,
        actual: cat.spent || 0,  // Use 0 if no spending
        variance: (cat.spent || 0) - cat.budget,
        percentage: cat.budget > 0
          ? Math.round((((cat.spent || 0) - cat.budget) / cat.budget) * 100)
          : 0,
        color: cat.color
      }))
      .sort((a, b) => b.variance - a.variance);  // Sort by variance (highest overspending first)

    // Generate predictions using calculated data
    const prediction = predictNextPeriodSpending(
      allExpenses,
      categories,
      selectedPeriod,
      patterns,
      convertExpenseAmount
    );

    const savings = identifySavingsOpportunity(
      allExpenses,
      categories,
      selectedPeriod,
      budgetVariance,
      convertExpenseAmount,
      formatAmount
    );

    return {
      keyInsights: generateKeyInsights(allExpenses, categories, selectedPeriod, convertExpenseAmount, formatAmount),
      spendingPatterns: patterns,
      budgetVariance: budgetVariance,
      predictions: {
        nextMonth: {
          estimated: prediction.estimated,
          confidence: prediction.confidence,
          trend: prediction.trend,
          periodLabel: prediction.periodLabel
        },
        savingsOpportunity: {
          amount: savings.amount,
          category: savings.category,
          reason: savings.reason
        }
      }
    };
  })() : null;

  const handleExportChart = () => {
    // Mock export functionality
    console.log('Exporting chart...');
  };

  /**
   * Generate chart images for PDF export
   */
  const generateChartImagesForPDF = async (filteredExpenses, categories, reportData) => {
    const chartImages = [];
    const chartTypes = ['pie', 'bar', 'line', 'budget'];

    console.log('🎨 Starting chart generation for PDF...');

    // Create off-screen container for rendering charts
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.zIndex = '-9999';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);

    try {
      for (const chartType of chartTypes) {
        console.log(`📊 Generating ${chartType} chart...`);

        // Generate chart configuration
        const chartConfig = generateChartDataForReport(
          filteredExpenses,
          categories,
          chartType,
          reportData.summary
        );

        // Skip if no data for this chart
        if (!chartConfig || !chartConfig.data || chartConfig.data.length === 0) {
          console.log(`⚠️ No data for ${chartType} chart, skipping`);
          continue;
        }

        console.log(`✓ Chart config generated for ${chartType}:`, chartConfig.data.length, 'data points');

        // Create div for this chart
        const chartDiv = document.createElement('div');
        container.appendChild(chartDiv);

        // Render chart component
        const root = ReactDOM.createRoot(chartDiv);
        root.render(
          <HeadlessChartRenderer
            type={chartConfig.type}
            data={chartConfig.data}
            title={chartConfig.title}
            width={chartConfig.width}
            height={chartConfig.height}
          />
        );

        // Wait for chart to render
        console.log(`⏳ Waiting for ${chartType} chart to render...`);
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Chercher le SVG dans les descendants
        const svgElement = chartDiv.querySelector('svg');
        console.log(`🔍 SVG element found for ${chartType}:`, !!svgElement);

        if (svgElement) {
          try {
            console.log(`📸 Capturing ${chartType} chart as image...`);

            // Add timeout of 5 seconds for capture
            const capturePromise = chartElementToImage(svgElement);
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Capture timeout after 5 seconds')), 5000)
            );

            const dataUrl = await Promise.race([capturePromise, timeoutPromise]);

            console.log(`✓ ${chartType} chart captured successfully, size:`, dataUrl.length);
            chartImages.push({
              type: chartType,
              title: chartConfig.title,
              dataUrl
            });
          } catch (error) {
            console.error(`❌ Failed to capture ${chartType} chart:`, error);
            console.error('Error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack,
              chartType: chartType,
              svgElement: svgElement ? 'exists' : 'null'
            });
          }
        } else {
          console.error(`❌ No SVG element found for ${chartType} chart`);
        }

        // Cleanup
        root.unmount();
      }
    } finally {
      // Remove container from DOM
      document.body.removeChild(container);
    }

    console.log(`✅ Chart generation complete. Generated ${chartImages.length} charts`);
    return chartImages;
  };

  const handleGenerateReport = async (config) => {
    try {
      // Load all expenses and categories (not filtered by page state) from API
      const [allExpenses, allCategories] = await Promise.all([
        loadExpenses(),
        loadCategoriesWithBudgets()  // ← Charge avec budgets fusionnés
      ]);

      // Generate report data based on config
      const reportData = generateReportData(config, allExpenses, allCategories);

      // Generate chart images if includeCharts is enabled and format is PDF
      let chartImages = [];
      if (config.includeCharts && config.format === 'pdf') {
        // Get filtered expenses from report data
        const filteredExpenses = reportData.transactions || [];
        chartImages = await generateChartImagesForPDF(filteredExpenses, allCategories, reportData);
      }

      // Export based on selected format
      switch (config.format) {
        case 'pdf':
          await exportToPDF(reportData, config, chartImages);
          break;
        case 'csv':
          exportToCSV(reportData, config);
          break;
        case 'json':
          exportToJSON(reportData, config);
          break;
        default:
          throw new Error(`Unsupported format: ${config.format}`);
      }

      // Incrémenter les statistiques
      const currentTotal = parseInt(localStorage.getItem('totalReportsGenerated') || '0');
      localStorage.setItem('totalReportsGenerated', (currentTotal + 1).toString());
      localStorage.setItem('lastReportDate', new Date().toISOString());
      localStorage.setItem('preferredFormat', config.format);

      return Promise.resolve();
    } catch (error) {
      console.error('Report generation failed:', error);
      throw error;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'BarChart3' },
    { id: 'insights', label: 'Insights', icon: 'Brain' },
    { id: 'reports', label: 'Reports', icon: 'FileText' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Analytics & Reports - ExpenseTracker Pro</title>
        <meta name="description" content="Comprehensive financial insights and analytics for your expense tracking" />
      </Helmet>
      <Header />
      <main className="pt-16 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Icon name="BarChart3" size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
                <p className="text-muted-foreground">Comprehensive financial insights and data analysis</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-border">
              <nav className="flex space-x-8">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab?.id
                        ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                    }`}
                  >
                    <Icon name={tab?.icon} size={16} />
                    <span>{tab?.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading analytics data...</p>
            </div>
          ) : error ? (
            /* Error State */
            <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
              <Icon name="AlertCircle" size={48} className="text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Analytics</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : !hasData ? (
            /* Empty State */
            <EmptyState
              icon="TrendingUp"
              title="No Analytics Data Yet"
              description="Start tracking your expenses to see detailed analytics, reports, and spending insights."
              actionLabel="Add Your First Expense"
              actionPath="/add-edit-expense"
            />
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Chart Controls */}
                  <ChartControls
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    selectedChartType={selectedChartType}
                    onChartTypeChange={setSelectedChartType}
                    onExportChart={handleExportChart}
                    categories={categories}
                    customDateRange={customDateRange}
                    onCustomDateChange={setCustomDateRange}
                  />

                  {/* Interactive Chart */}
                  <InteractiveChart
                    type={selectedChartType}
                    data={getChartData()}
                    title={`Expense ${selectedChartType === 'pie' ? 'Distribution' : 'Trends'} - ${selectedPeriod}`}
                  />

                  {/* Summary Statistics */}
                  <SummaryStatistics statistics={summaryStatistics} />
                </div>
              )}

              {activeTab === 'insights' && (
                <SpendingInsights insights={spendingInsights} />
              )}

              {activeTab === 'reports' && (
                <ReportGenerator
                  categories={categories}
                  onGenerateReport={handleGenerateReport}
                />
              )}
            </>
          )}
        </div>
      </main>
      <BottomNavigation />
      <FloatingActionButton />
    </div>
  );
};

export default AnalyticsReports;