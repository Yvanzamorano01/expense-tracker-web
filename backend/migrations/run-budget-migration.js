const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the database
const dbPath = path.join(__dirname, '..', 'database', 'expensetracker.db');

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('✓ Connected to SQLite database\n');
});

// Run migration
console.log('Running migration: Add original_currency to budgets table...\n');

db.serialize(() => {
  // Add column
  db.run(`ALTER TABLE budgets ADD COLUMN original_currency VARCHAR(3) DEFAULT 'USD' NOT NULL`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column')) {
        console.log('⚠ Column original_currency already exists, skipping column creation...');
      } else {
        console.error('❌ Error adding column:', err.message);
        db.close();
        process.exit(1);
      }
    } else {
      console.log('✓ Column original_currency added to budgets table');
    }

    // Update existing records to default to USD
    db.run(`UPDATE budgets SET original_currency = 'USD' WHERE original_currency IS NULL OR original_currency = ''`, function(err) {
      if (err) {
        console.error('❌ Error updating existing records:', err.message);
      } else {
        console.log(`✓ Updated ${this.changes} existing budget records to USD`);
      }

      // Verify migration
      db.all(`SELECT COUNT(*) as total, original_currency FROM budgets GROUP BY original_currency`, (err, rows) => {
        if (err) {
          console.error('❌ Error verifying migration:', err.message);
        } else {
          console.log('\n✓ Migration completed successfully!');
          console.log('\nBudget database summary:');
          if (rows.length === 0) {
            console.log('  - No budgets in database yet');
          } else {
            rows.forEach(row => {
              console.log(`  - ${row.original_currency}: ${row.total} budget(s)`);
            });
          }
        }

        // Close database
        db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err.message);
          } else {
            console.log('\n✓ Database connection closed');
          }
        });
      });
    });
  });
});
