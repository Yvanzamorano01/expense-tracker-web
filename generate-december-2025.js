const axios = require('axios');

const API_URL = 'http://localhost:5000/api/expenses';
const YEAR = 2025;
const MONTH = 12; // December

// December 2025 expenses - Christmas, New Year, Holiday season
const expenses = [
  // Big Expenses - Holiday Season!
  { day: 15, category: 6, amount: 350, desc: 'Christmas gifts for family', method: 'Card' },
  { day: 18, category: 6, amount: 280, desc: 'Christmas gifts for friends', method: 'Card' },
  { day: 20, category: 8, amount: 650, desc: 'Flight tickets for Christmas', method: 'Card' },
  { day: 24, category: 1, amount: 175, desc: 'Christmas Eve dinner groceries', method: 'Card' },
  { day: 30, category: 8, amount: 480, desc: 'New Year trip hotel booking', method: 'Card' },
  { day: 31, category: 4, amount: 150, desc: 'New Year Eve party tickets', method: 'Card' },

  // Food & Dining (Category 1)
  { day: 1, category: 1, amount: 62, desc: 'Weekly groceries Whole Foods', method: 'Card' },
  { day: 4, category: 1, amount: 35, desc: 'Lunch meeting downtown', method: 'Card' },
  { day: 7, category: 1, amount: 48, desc: 'Grocery shopping Target', method: 'Card' },
  { day: 10, category: 1, amount: 85, desc: 'Holiday office party contribution', method: 'Cash' },
  { day: 13, category: 1, amount: 42, desc: 'Brunch with friends', method: 'Card' },
  { day: 16, category: 1, amount: 55, desc: 'Weekly groceries', method: 'Card' },
  { day: 19, category: 1, amount: 38, desc: 'Hot chocolate and cookies cafe', method: 'Cash' },
  { day: 22, category: 1, amount: 95, desc: 'Christmas cookies ingredients', method: 'Card' },
  { day: 25, category: 1, amount: 28, desc: 'Christmas Day takeout', method: 'Card' },
  { day: 28, category: 1, amount: 45, desc: 'Post-holiday groceries', method: 'Card' },

  // Transportation (Category 2)
  { day: 2, category: 2, amount: 58, desc: 'Gas station fill up', method: 'Card' },
  { day: 9, category: 2, amount: 52, desc: 'Gas station', method: 'Card' },
  { day: 14, category: 2, amount: 45, desc: 'Uber for holiday shopping', method: 'Digital Wallet' },
  { day: 21, category: 2, amount: 38, desc: 'Uber to airport', method: 'Digital Wallet' },
  { day: 26, category: 2, amount: 55, desc: 'Gas station fill up', method: 'Card' },

  // Shopping (Category 6)
  { day: 3, category: 6, amount: 125, desc: 'Christmas tree and ornaments', method: 'Card' },
  { day: 6, category: 6, amount: 68, desc: 'Gift wrapping supplies', method: 'Card' },
  { day: 11, category: 6, amount: 95, desc: 'Winter coat sale', method: 'Card' },
  { day: 23, category: 6, amount: 45, desc: 'Last minute stocking stuffers', method: 'Cash' },
  { day: 27, category: 6, amount: 180, desc: 'After Christmas sales - clothes', method: 'Card' },

  // Entertainment (Category 4)
  { day: 5, category: 4, amount: 55, desc: 'Christmas market entry and food', method: 'Cash' },
  { day: 12, category: 4, amount: 42, desc: 'Holiday movie theater', method: 'Card' },
  { day: 17, category: 4, amount: 75, desc: 'Ice skating rink tickets', method: 'Card' },

  // Utilities (Category 7)
  { day: 1, category: 7, amount: 185, desc: 'Electric bill - winter heating', method: 'Card' },
  { day: 5, category: 7, amount: 85, desc: 'Internet bill Xfinity', method: 'Card' },
  { day: 15, category: 7, amount: 65, desc: 'Phone bill T-Mobile', method: 'Digital Wallet' },
  { day: 20, category: 7, amount: 110, desc: 'Gas heating bill', method: 'Card' },

  // Healthcare (Category 5)
  { day: 8, category: 5, amount: 32, desc: 'Pharmacy vitamins', method: 'Card' },
  { day: 29, category: 5, amount: 55, desc: 'Urgent care visit copay', method: 'Card' },

  // Personal Care (Category 11)
  { day: 10, category: 11, amount: 65, desc: 'Holiday haircut and styling', method: 'Card' },
  { day: 24, category: 11, amount: 40, desc: 'Spa gift card for self', method: 'Card' },

  // Bills & Subscriptions (Category 9)
  { day: 1, category: 9, amount: 15.99, desc: 'Netflix subscription', method: 'Card' },
  { day: 1, category: 9, amount: 10.99, desc: 'Spotify Premium', method: 'Card' },
  { day: 1, category: 9, amount: 14.99, desc: 'Amazon Prime monthly', method: 'Card' },
  { day: 15, category: 9, amount: 12.99, desc: 'Disney+ subscription', method: 'Card' },
  { day: 10, category: 9, amount: 9.99, desc: 'iCloud storage', method: 'Card' },
  { day: 20, category: 9, amount: 6.99, desc: 'Apple Music gift', method: 'Card' }
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
  console.log('🎄 Generating December 2025 expenses (USD)...\n');

  for (const expense of expenses) {
    await createExpense(expense);
    await new Promise(r => setTimeout(r, 50));
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  console.log(`\n✨ Done! ${expenses.length} expenses created`);
  console.log(`💰 Total: $${total.toFixed(2)}`);
}

generate().catch(console.error);
