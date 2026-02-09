-- Migration: Add original_currency column to expenses table
-- Date: 2025-12-16
-- Description: Store the original currency of each expense instead of converting everything to USD

-- Add original_currency column
ALTER TABLE expenses
ADD COLUMN original_currency VARCHAR(3) DEFAULT 'USD' NOT NULL;

-- Update existing records to have USD as their original currency
-- (since all existing expenses were stored in USD)
UPDATE expenses
SET original_currency = 'USD'
WHERE original_currency IS NULL OR original_currency = '';

-- Verify the column was added
SELECT COUNT(*) as total_expenses,
       original_currency,
       COUNT(*) as count_by_currency
FROM expenses
GROUP BY original_currency;
