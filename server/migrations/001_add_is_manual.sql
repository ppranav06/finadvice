-- Add is_manual column to transactions table
-- Run this in your Supabase SQL Editor

-- Add the column (defaults to false for existing transactions)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false;

-- Update existing transactions to mark them as not manual (bank imported)
UPDATE public.transactions SET is_manual = false WHERE is_manual IS NULL;

-- Success message
SELECT 'Migration complete: is_manual column added to transactions table' as status;
