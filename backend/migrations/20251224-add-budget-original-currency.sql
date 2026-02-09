-- Migration: Add original_currency column to budgets table
-- Date: 2025-12-24
-- Description: Store the original currency of each budget for accurate conversion

-- Add original_currency column
ALTER TABLE budgets
ADD COLUMN original_currency VARCHAR(3) DEFAULT 'USD' NOT NULL;

-- Update existing records to have USD as their original currency
-- (assumption: all existing budgets were created in USD context)
UPDATE budgets
SET original_currency = 'USD'
WHERE original_currency IS NULL OR original_currency = '';

-- Verify the column was added
SELECT COUNT(*) as total_budgets,
       original_currency,
       COUNT(*) as count_by_currency
FROM budgets
GROUP BY original_currency;
