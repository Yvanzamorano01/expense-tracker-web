const axios = require('axios');

const API_URL = 'http://localhost:5000/api/expenses';

async function deleteAllExpenses() {
  console.log('🗑️  Suppression de toutes les dépenses...\n');

  try {
    // Get all expenses
    const response = await axios.get(API_URL);
    const expenses = response.data.data.expenses;

    if (!expenses || expenses.length === 0) {
      console.log('✅ Aucune dépense à supprimer.');
      return;
    }

    console.log(`📊 ${expenses.length} dépenses trouvées. Suppression en cours...\n`);

    let deleted = 0;
    let errors = 0;

    for (const expense of expenses) {
      try {
        await axios.delete(`${API_URL}/${expense.expenseId}`);
        deleted++;
        process.stdout.write(`\r🗑️  Supprimé: ${deleted}/${expenses.length}`);
      } catch (error) {
        errors++;
      }
    }

    console.log('\n');
    console.log(`✅ ${deleted} dépenses supprimées`);
    if (errors > 0) {
      console.log(`❌ ${errors} erreurs`);
    }
    console.log('\n🎉 Base de données nettoyée!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n⚠️  Assurez-vous que le backend est démarré sur le port 5000');
  }
}

deleteAllExpenses();
