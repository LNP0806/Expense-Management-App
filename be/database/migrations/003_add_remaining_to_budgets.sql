-- Migration 003: Add remaining column to budgets table
-- This migration adds the remaining column to the budgets table.
-- Although remaining is usually a derived value, adding it as a column
-- allows caching computed remaining budget balances directly in the database.

ALTER TABLE budgets ADD COLUMN remaining NUMERIC(15, 2) DEFAULT 0.00;

-- Update existing records so that their default remaining value is set to their budget limit amount
UPDATE budgets SET remaining = amount;
