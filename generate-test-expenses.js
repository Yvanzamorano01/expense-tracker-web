const axios = require('axios');

const API_URL = 'http://localhost:5000/api/expenses';
const TARGET_COUNT = 35; // 30-40 dépenses
const YEAR = 2025;
const MONTH = 12; // Décembre

// Templates de dépenses réalistes pour le Cameroun
const expenseTemplates = [
  // Food & Dining (ID: 1)
  {
    category: 1,
    descriptions: [
      'Petit déjeuner boulangerie',
      'Déjeuner restaurant',
      'Courses supermarché',
      'Poisson au marché',
      'Fruits et légumes',
      'Repas fast-food',
      'Poulet braisé',
      'Ndolé au maquis'
    ],
    amountRange: [500, 15000],
    methods: ['Cash', 'Card']
  },

  // Transportation (ID: 2)
  {
    category: 2,
    descriptions: [
      'Taxi urbain',
      'Essence voiture',
      'Moto-taxi',
      'Bus interurbain',
      'Stationnement',
      'Entretien voiture'
    ],
    amountRange: [200, 25000],
    methods: ['Cash', 'Digital Wallet']
  },

  // Shopping (ID: 6)
  {
    category: 6,
    descriptions: [
      'Vêtements marché',
      'Chaussures',
      'Accessoires téléphone',
      'Articles ménagers',
      'Vêtements boutique',
      'Électronique'
    ],
    amountRange: [2000, 50000],
    methods: ['Cash', 'Card']
  },

  // Entertainment (ID: 4)
  {
    category: 4,
    descriptions: [
      'Cinéma Canal Olympia',
      'Concert Live',
      'Restaurant sortie amis',
      'Jeux vidéo',
      'Sortie boîte de nuit',
      'Spectacle théâtre'
    ],
    amountRange: [2000, 20000],
    methods: ['Cash', 'Card']
  },

  // Utilities (ID: 7)
  {
    category: 7,
    descriptions: [
      'Facture électricité ENEO',
      'Recharge eau CAMWATER',
      'Crédit téléphone MTN',
      'Internet mobile Orange',
      'Forfait internet fibre',
      'Recharge Orange Money'
    ],
    amountRange: [1000, 30000],
    methods: ['Digital Wallet', 'Card']
  },

  // Healthcare (ID: 5)
  {
    category: 5,
    descriptions: [
      'Pharmacie médicaments',
      'Consultation médicale',
      'Analyses laboratoire',
      'Dentiste',
      'Lunettes optique'
    ],
    amountRange: [3000, 25000],
    methods: ['Cash', 'Card']
  },

  // Personal Care (ID: 11)
  {
    category: 11,
    descriptions: [
      'Coiffeur salon',
      'Salon de beauté',
      'Produits cosmétiques',
      'Barbier',
      'Manucure'
    ],
    amountRange: [1500, 10000],
    methods: ['Cash']
  },

  // Bills & Subscriptions (ID: 9)
  {
    category: 9,
    descriptions: [
      'Abonnement Netflix',
      'Canal+ Cameroun',
      'Spotify Premium',
      'Prime Video',
      'YouTube Premium',
      'iCloud Storage'
    ],
    amountRange: [2000, 8000],
    methods: ['Card', 'Digital Wallet']
  }
];

/**
 * Génère une dépense aléatoire pour un jour donné
 */
function generateRandomExpense(day) {
  // Sélectionner un template aléatoire
  const template = expenseTemplates[Math.floor(Math.random() * expenseTemplates.length)];

  // Générer montant aléatoire dans la plage
  const [min, max] = template.amountRange;
  const amount = Math.floor(Math.random() * (max - min + 1)) + min;

  // Sélectionner description et méthode aléatoires
  const description = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];
  const paymentMethod = template.methods[Math.floor(Math.random() * template.methods.length)];

  // Créer la date (décembre 2025)
  const date = new Date(YEAR, MONTH - 1, day);

  return {
    amount: amount,
    date: date.toISOString().split('T')[0], // Format: YYYY-MM-DD
    categoryId: template.category,
    description: description,
    paymentMethod: paymentMethod,
    originalCurrency: 'XAF',
    location: 'Cameroun',
    isRecurring: false
  };
}

/**
 * Crée une dépense via l'API backend
 */
async function createExpense(expense) {
  try {
    const response = await axios.post(API_URL, expense, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`✅ Créé: ${expense.description} - ${expense.amount} FCFA (${expense.date})`);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur: ${expense.description}`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fonction principale - génère et crée toutes les dépenses de test
 */
async function generateTestExpenses() {
  console.log('🚀 Génération de dépenses de test pour Décembre 2025...\n');

  const expenses = [];
  const daysInDecember = 31;

  // Générer 35 dépenses réparties sur le mois
  for (let i = 0; i < TARGET_COUNT; i++) {
    // Répartir aléatoirement sur les jours du mois
    const day = Math.floor(Math.random() * daysInDecember) + 1;
    const expense = generateRandomExpense(day);
    expenses.push(expense);
  }

  // Trier par date
  expenses.sort((a, b) => new Date(a.date) - new Date(b.date));

  console.log(`📊 ${expenses.length} dépenses générées, création en cours...\n`);

  // Créer les dépenses une par une
  let successCount = 0;
  let errorCount = 0;

  for (const expense of expenses) {
    try {
      await createExpense(expense);
      successCount++;
      // Petit délai pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      errorCount++;
    }
  }

  console.log(`\n✨ Terminé!`);
  console.log(`✅ ${successCount} dépenses créées avec succès`);
  if (errorCount > 0) {
    console.log(`❌ ${errorCount} erreurs`);
  }

  // Résumé par catégorie
  console.log(`\n📈 Résumé par catégorie:`);
  const categoryCounts = expenses.reduce((acc, exp) => {
    acc[exp.categoryId] = (acc[exp.categoryId] || 0) + 1;
    return acc;
  }, {});

  const categoryNames = {
    1: 'Food & Dining',
    2: 'Transportation',
    4: 'Entertainment',
    5: 'Healthcare',
    6: 'Shopping',
    7: 'Utilities',
    9: 'Bills & Subscriptions',
    11: 'Personal Care'
  };

  Object.entries(categoryCounts).forEach(([catId, count]) => {
    console.log(`   ${categoryNames[catId] || 'Category ' + catId}: ${count} dépenses`);
  });
}

// Lancer la génération
generateTestExpenses().catch(console.error);
