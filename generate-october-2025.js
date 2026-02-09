const axios = require('axios');

const API_URL = 'http://localhost:5000/api/expenses';
const YEAR = 2025;
const MONTH = 10; // October

// October 2025 expenses - Fall season, Back to routine
const expenses = [
  // Big Expenses
  { day: 5, category: 8, amount: 450, desc: 'Fall road trip to Vermont', method: 'Card' },
  { day: 18, category: 8, amount: 350, desc: 'Flight tickets to Chicago', method: 'Card' },
  { day: 25, category: 6, amount: 280, desc: 'Halloween costumes and decorations', method: 'Card' },

  // Food & Dining (Category 1)
  { day: 1, category: 1, amount: 45, desc: 'Grocery shopping Walmart', method: 'Card' },
  { day: 3, category: 1, amount: 28, desc: 'Lunch at Chipotle', method: 'Card' },
  { day: 6, category: 1, amount: 65, desc: 'Weekly groceries Costco', method: 'Card' },
  { day: 9, category: 1, amount: 35, desc: 'Dinner at Olive Garden', method: 'Card' },
  { day: 12, category: 1, amount: 18, desc: 'Coffee and pastries Starbucks', method: 'Cash' },
  { day: 15, category: 1, amount: 52, desc: 'Grocery shopping Target', method: 'Card' },
  { day: 20, category: 1, amount: 42, desc: 'Takeout Chinese food', method: 'Card' },
  { day: 24, category: 1, amount: 75, desc: 'Halloween party supplies', method: 'Card' },
  { day: 28, category: 1, amount: 38, desc: 'Pizza delivery', method: 'Card' },

  // Transportation (Category 2)
  { day: 2, category: 2, amount: 55, desc: 'Gas station fill up', method: 'Card' },
  { day: 10, category: 2, amount: 48, desc: 'Gas station', method: 'Card' },
  { day: 16, category: 2, amount: 35, desc: 'Uber rides', method: 'Digital Wallet' },
  { day: 22, category: 2, amount: 52, desc: 'Gas station fill up', method: 'Card' },
  { day: 29, category: 2, amount: 125, desc: 'Car oil change and inspection', method: 'Card' },

  // Shopping (Category 6)
  { day: 4, category: 6, amount: 89, desc: 'Fall clothing Target', method: 'Card' },
  { day: 14, category: 6, amount: 156, desc: 'Winter jacket Macys', method: 'Card' },
  { day: 21, category: 6, amount: 45, desc: 'Home decor items', method: 'Card' },

  // Entertainment (Category 4)
  { day: 7, category: 4, amount: 32, desc: 'Movie theater tickets', method: 'Card' },
  { day: 13, category: 4, amount: 65, desc: 'Concert tickets', method: 'Card' },
  { day: 27, category: 4, amount: 48, desc: 'Haunted house attraction', method: 'Cash' },

  // Utilities (Category 7)
  { day: 1, category: 7, amount: 145, desc: 'Electric bill', method: 'Card' },
  { day: 5, category: 7, amount: 85, desc: 'Internet bill Xfinity', method: 'Card' },
  { day: 15, category: 7, amount: 65, desc: 'Phone bill T-Mobile', method: 'Digital Wallet' },

  // Healthcare (Category 5)
  { day: 8, category: 5, amount: 35, desc: 'Pharmacy CVS', method: 'Card' },
  { day: 19, category: 5, amount: 150, desc: 'Annual checkup copay', method: 'Card' },

  // Personal Care (Category 11)
  { day: 11, category: 11, amount: 45, desc: 'Haircut salon', method: 'Cash' },
  { day: 23, category: 11, amount: 28, desc: 'Skincare products', method: 'Card' },

  // Bills & Subscriptions (Category 9)
  { day: 1, category: 9, amount: 15.99, desc: 'Netflix subscription', method: 'Card' },
  { day: 1, category: 9, amount: 10.99, desc: 'Spotify Premium', method: 'Card' },
  { day: 1, category: 9, amount: 14.99, desc: 'Amazon Prime monthly', method: 'Card' },
  { day: 15, category: 9, amount: 12.99, desc: 'Disney+ subscription', method: 'Card' }
];

async function createExpense(expense) {
  const date = new Date(YEAR, MONTH - 1, expense.day);
  const data = {
    amount: expense.amount,
    date: date.toISOString().split('T')[0],
    categoryId: expense.category,
    description: expense.desc,
    paymentMethod: expense.method,
    originalCurrency: 'USD',
    location: 'United States',
    isRecurring: false
  };

  try {
    await axios.post(API_URL, data);
    console.log(`✅ ${expense.desc} - $${expense.amount}`);
  } catch (error) {
    console.error(`❌ ${expense.desc}:`, error.response?.data?.message || error.message);
  }
}

async function generate() {
  console.log('🍂 Generating October 2025 expenses (USD)...\n');

  for (const expense of expenses) {
    await createExpense(expense);
    await new Promise(r => setTimeout(r, 50));
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  console.log(`\n✨ Done! ${expenses.length} expenses created`);
  console.log(`💰 Total: $${total.toFixed(2)}`);
}

generate().catch(console.error);
