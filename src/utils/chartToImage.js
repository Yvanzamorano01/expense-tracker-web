/**
 * Convert SVG element to base64 PNG image using native browser APIs
 * More reliable than html2canvas for complex SVG elements like Recharts
 * @param {SVGElement} svgElement - The SVG element to convert
 * @returns {Promise<string>} - Base64 encoded PNG data URL
 */
export const chartElementToImage = async (svgElement) => {
  return new Promise((resolve, reject) => {
    try {
      if (!svgElement || svgElement.tagName !== 'svg') {
        throw new Error('Element must be an SVG element');
      }

      // Clone the SVG to avoid modifying the original
      const svgClone = svgElement.cloneNode(true);

      // Get dimensions from viewBox or explicit width/height
      let width = svgElement.width.baseVal.value;
      let height = svgElement.height.baseVal.value;

      if (!width || !height) {
        const viewBox = svgElement.viewBox.baseVal;
        if (viewBox.width && viewBox.height) {
          width = viewBox.width;
          height = viewBox.height;
        } else {
          const bbox = svgElement.getBBox();
          width = bbox.width;
          height = bbox.height;
        }
      }

      // Set explicit dimensions on clone
      svgClone.setAttribute('width', width);
      svgClone.setAttribute('height', height);

      // Serialize SVG to string
      const svgData = new XMLSerializer().serializeToString(svgClone);

      // Create blob from SVG data
      const svgBlob = new Blob([svgData], {
        type: 'image/svg+xml;charset=utf-8'
      });
      const url = URL.createObjectURL(svgBlob);

      // Create image from blob
      const img = new Image();

      img.onload = () => {
        try {
          // Create canvas with proper dimensions
          const canvas = document.createElement('canvas');
          canvas.width = width * 2; // 2x for better quality
          canvas.height = height * 2;

          const ctx = canvas.getContext('2d');

          // Scale up for quality
          ctx.scale(2, 2);

          // Draw white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          // Draw SVG image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png', 0.95);

          // Cleanup
          URL.revokeObjectURL(url);

          resolve(dataUrl);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to load SVG image: ${error}`));
      };

      img.src = url;

    } catch (error) {
      console.error('Error in chartElementToImage:', error);
      reject(error);
    }
  });
};

/**
 * Generate chart configuration data for reports
 * @param {Array} expenses - Filtered expenses array
 * @param {Array} categories - All categories
 * @param {string} type - Chart type: 'pie', 'bar', 'line', 'budget'
 * @param {Object} summary - Report summary data
 * @returns {Object} - Chart configuration object
 */
export const generateChartDataForReport = (expenses, categories, type, summary) => {
  try {
    switch (type) {
      case 'pie':
        return generatePieChartData(expenses, categories);

      case 'bar':
        return generateBarChartData(expenses, categories);

      case 'line':
        return generateLineChartData(expenses);

      case 'budget':
        return generateBudgetChartData(expenses, categories, summary);

      default:
        throw new Error(`Unknown chart type: ${type}`);
    }
  } catch (error) {
    console.error(`Error generating ${type} chart data:`, error);
    return null;
  }
};

/**
 * Generate Pie Chart data - Category distribution
 */
const generatePieChartData = (expenses, categories) => {
  // Calculate spending by category
  const categoryTotals = {};

  expenses.forEach(expense => {
    const amount = parseFloat(expense.amount) || 0;
    const categoryName = expense.category || 'Uncategorized';
    categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + amount;
  });

  // Convert to array and sort by amount
  const data = Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    }))
    .sort((a, b) => b.value - a.value);
    // Removed .slice(0, 10) to show ALL categories with spending

  if (data.length === 0) {
    return null;
  }

  return {
    type: 'pie',
    title: 'Expense Distribution by Category',
    data,
    width: 600,
    height: 400
  };
};

/**
 * Generate Bar Chart data - Category comparison
 */
const generateBarChartData = (expenses, categories) => {
  // Calculate spending by category
  const categoryTotals = {};

  expenses.forEach(expense => {
    const amount = parseFloat(expense.amount) || 0;
    const categoryName = expense.category || 'Uncategorized';
    categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + amount;
  });

  // Convert to array and sort by amount
  const data = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2))
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10); // Limit to top 10 categories

  if (data.length === 0) {
    return null;
  }

  return {
    type: 'bar',
    title: 'Top 10 Categories by Spending',
    data,
    width: 700,
    height: 400,
    xKey: 'category',
    yKey: 'amount'
  };
};

/**
 * Generate Line Chart data - Spending over time
 */
const generateLineChartData = (expenses) => {
  // Group expenses by date
  const dailyTotals = {};

  expenses.forEach(expense => {
    const amount = parseFloat(expense.amount) || 0;
    const date = expense.date ? new Date(expense.date).toISOString().split('T')[0] : null;

    if (date) {
      dailyTotals[date] = (dailyTotals[date] || 0) + amount;
    }
  });

  // Convert to array and sort by date
  const data = Object.entries(dailyTotals)
    .map(([date, amount]) => ({
      date,
      amount: parseFloat(amount.toFixed(2))
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (data.length === 0) {
    return null;
  }

  return {
    type: 'line',
    title: 'Spending Trend Over Time',
    data,
    width: 700,
    height: 400,
    xKey: 'date',
    yKey: 'amount'
  };
};

/**
 * Generate Budget Chart data - Budget vs Actual spending
 */
const generateBudgetChartData = (expenses, categories, summary) => {
  const data = [];

  // Calculate actual spending by category
  const categorySpending = {};
  expenses.forEach(expense => {
    const amount = parseFloat(expense.amount) || 0;
    const categoryName = expense.category || 'Uncategorized';
    categorySpending[categoryName] = (categorySpending[categoryName] || 0) + amount;
  });

  // Match with category budgets
  categories.forEach(category => {
    const budget = parseFloat(category.budget) || 0;
    const spent = categorySpending[category.name] || 0;

    // Only include categories with budgets
    if (budget > 0) {
      data.push({
        category: category.name,
        budget: parseFloat(budget.toFixed(2)),
        actual: parseFloat(spent.toFixed(2))
      });
    }
  });

  // Sort by budget amount
  data.sort((a, b) => b.budget - a.budget);

  if (data.length === 0) {
    return null;
  }

  return {
    type: 'budget',
    title: 'Budget vs Actual Spending',
    data,
    width: 700,
    height: 400
  };
};
