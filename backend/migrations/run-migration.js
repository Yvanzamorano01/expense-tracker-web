const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Path to the database
const dbPath = path.join(__dirname, '..', 'database', 'expensetracker.db');

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('✓ Connected to SQLite database');
});

// Run migration
console.log('Running migration: Add original_currency column...\n');

db.serialize(() => {
  // Add column
  db.run(`ALTER TABLE expenses ADD COLUMN original_currency VARCHAR(3) DEFAULT 'USD' NOT NULL`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column')) {
        console.log('⚠ Column original_currency already exists, skipping...');
      } else {
        console.error('Error adding column:', err.message);
        db.close();
        process.exit(1);
      }
    } else {
      console.log('✓ Column original_currency added successfully');
    }

    // Update existing records
    db.run(`UPDATE expenses SET original_currency = 'USD' WHERE original_currency IS NULL OR original_currency = ''`, function(err) {
      if (err) {
        console.error('Error updating existing records:', err.message);
      } else {
        console.log(`✓ Updated ${this.changes} existing expense records to USD`);
      }

      // Verify migration
      db.all(`SELECT COUNT(*) as total, original_currency FROM expenses GROUP BY original_currency`, (err, rows) => {
        if (err) {
          console.error('Error verifying migration:', err.message);
        } else {
          console.log('\n✓ Migration completed successfully!');
          console.log('\nDatabase summary:');
          rows.forEach(row => {
            console.log(`  - ${row.original_currency}: ${row.total} expenses`);
          });
        }

        // Close database
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          }
          console.log('\n✓ Database connection closed');
        });
      });
    });
  });
});
