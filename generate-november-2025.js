const axios = require('axios');

const API_URL = 'http://localhost:5000/api/expenses';
const YEAR = 2025;
const MONTH = 11; // November

// November 2025 expenses - Thanksgiving, Black Friday
const expenses = [
  // Big Expenses
  { day: 26, category: 8, amount: 500, desc: 'Thanksgiving flight to family', method: 'Card' },
  { day: 28, category: 6, amount: 420, desc: 'Black Friday TV deal Best Buy', method: 'Card' },
  { day: 28, category: 6, amount: 189, desc: 'Black Friday laptop accessories', method: 'Card' },
  { day: 27, category: 1, amount: 185, desc: 'Thanksgiving dinner groceries', method: 'Card' },

  // Food & Dining (Category 1)
  { day: 2, category: 1, amount: 58, desc: 'Weekly groceries Kroger', method: 'Card' },
  { day: 5, category: 1, amount: 32, desc: 'Lunch at Panera Bread', method: 'Card' },
  { day: 8, category: 1, amount: 48, desc: 'Grocery shopping Trader Joes', method: 'Card' },
  { day: 11, category: 1, amount: 25, desc: 'Coffee shop working session', method: 'Card' },
  { day: 14, category: 1, amount: 72, desc: 'Date night dinner', method: 'Card' },
  { day: 17, category: 1, amount: 55, desc: 'Weekly groceries', method: 'Card' },
  { day: 20, category: 1, amount: 38, desc: 'Takeout Thai food', method: 'Card' },
  { day: 24, category: 1, amount: 45, desc: 'Pre-Thanksgiving groceries', method: 'Card' },
  { day: 30, category: 1, amount: 35, desc: 'Leftovers meal prep containers', method: 'Card' },

  // Transportation (Category 2)
  { day: 3, category: 2, amount: 52, desc: 'Gas station fill up', method: 'Card' },
  { day: 12, category: 2, amount: 58, desc: 'Gas station', method: 'Card' },
  { day: 19, category: 2, amount: 42, desc: 'Uber to airport', method: 'Digital Wallet' },
  { day: 25, category: 2, amount: 35, desc: 'Rental car gas', method: 'Card' },

  // Shopping (Category 6)
  { day: 6, category: 6, amount: 95, desc: 'Winter boots Nordstrom', method: 'Card' },
  { day: 15, category: 6, amount: 65, desc: 'Kitchen gadgets Williams Sonoma', method: 'Card' },
  { day: 29, category: 6, amount: 78, desc: 'Cyber Monday headphones deal', method: 'Card' },

  // Entertainment (Category 4)
  { day: 1, category: 4, amount: 45, desc: 'Football game snacks and drinks', method: 'Cash' },
  { day: 9, category: 4, amount: 28, desc: 'Streaming movie rental', method: 'Card' },
  { day: 22, category: 4, amount: 85, desc: 'Comedy show tickets', method: 'Card' },

  // Utilities (Category 7)
  { day: 1, category: 7, amount: 165, desc: 'Electric bill - heating starts', method: 'Card' },
  { day: 5, category: 7, amount: 85, desc: 'Internet bill Xfinity', method: 'Card' },
  { day: 15, category: 7, amount: 65, desc: 'Phone bill T-Mobile', method: 'Digital Wallet' },
  { day: 20, category: 7, amount: 95, desc: 'Gas heating bill', method: 'Card' },

  // Healthcare (Category 5)
  { day: 4, category: 5, amount: 28, desc: 'Pharmacy cold medicine', method: 'Card' },
  { day: 18, category: 5, amount: 45, desc: 'Flu shot copay', method: 'Card' },

  // Personal Care (Category 11)
  { day: 7, category: 11, amount: 55, desc: 'Haircut and styling', method: 'Card' },
  { day: 21, category: 11, amount: 35, desc: 'Grooming products', method: 'Card' },

  // Bills & Subscriptions (Category 9)
  { day: 1, category: 9, amount: 15.99, desc: 'Netflix subscription', method: 'Card' },
  { day: 1, category: 9, amount: 10.99, desc: 'Spotify Premium', method: 'Card' },
  { day: 1, category: 9, amount: 14.99, desc: 'Amazon Prime monthly', method: 'Card' },
  { day: 15, category: 9, amount: 12.99, desc: 'Disney+ subscription', method: 'Card' },
  { day: 10, category: 9, amount: 9.99, desc: 'iCloud storage', method: 'Card' }
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
  console.log('🦃 Generating November 2025 expenses (USD)...\n');

  for (const expense of expenses) {
    await createExpense(expense);
    await new Promise(r => setTimeout(r, 50));
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  console.log(`\n✨ Done! ${expenses.length} expenses created`);
  console.log(`💰 Total: $${total.toFixed(2)}`);
}

generate().catch(console.error);
