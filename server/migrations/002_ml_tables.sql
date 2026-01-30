-- ML Tables Migration
-- Run this in your Supabase SQL Editor

-- ============================================
-- Table: recurring_transactions
-- Stores detected recurring transaction patterns
-- ============================================
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    pattern_hash VARCHAR(64) NOT NULL,  -- Hash of narration pattern + amount range
    avg_amount DECIMAL(15, 2) NOT NULL,
    frequency_days INTEGER NOT NULL,  -- Interval between occurrences
    last_occurrence TIMESTAMPTZ NOT NULL,
    next_expected TIMESTAMPTZ NOT NULL,
    narration_pattern TEXT NOT NULL,  -- The detected pattern (e.g., "Rent Payment - *")
    category VARCHAR(50),
    confidence DECIMAL(3, 2) NOT NULL DEFAULT 0.0,  -- 0.00 to 1.00
    transaction_count INTEGER NOT NULL DEFAULT 0,  -- How many times this pattern was seen
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, pattern_hash)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_recurring_user_id ON public.recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next_expected ON public.recurring_transactions(next_expected);

-- ============================================
-- Table: balance_snapshots
-- Stores historical balance data for accounts
-- ============================================
CREATE TABLE IF NOT EXISTS public.balance_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(15, 2) NOT NULL,
    snapshot_date DATE NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'manual',  -- 'setu_sync', 'manual', 'scheduled'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(account_id, snapshot_date)
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_snapshots_user_date ON public.balance_snapshots(user_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_account_date ON public.balance_snapshots(account_id, snapshot_date);

-- ============================================
-- Table: cached_metrics
-- Caches computed metrics and forecasts
-- ============================================
CREATE TABLE IF NOT EXISTS public.cached_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_data JSONB NOT NULL DEFAULT '{}',
    forecast_data JSONB,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Index for cache expiry checks
CREATE INDEX IF NOT EXISTS idx_metrics_expires ON public.cached_metrics(expires_at);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for recurring_transactions
CREATE POLICY "Users can view own recurring transactions"
    ON public.recurring_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage recurring transactions"
    ON public.recurring_transactions FOR ALL
    USING (true)
    WITH CHECK (true);

-- Policies for balance_snapshots
CREATE POLICY "Users can view own balance snapshots"
    ON public.balance_snapshots FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage balance snapshots"
    ON public.balance_snapshots FOR ALL
    USING (true)
    WITH CHECK (true);

-- Policies for cached_metrics
CREATE POLICY "Users can view own cached metrics"
    ON public.cached_metrics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage cached metrics"
    ON public.cached_metrics FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- Updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to recurring_transactions
DROP TRIGGER IF EXISTS update_recurring_transactions_updated_at ON public.recurring_transactions;
CREATE TRIGGER update_recurring_transactions_updated_at
    BEFORE UPDATE ON public.recurring_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Success message
-- ============================================
SELECT 'Migration complete: ML tables created (recurring_transactions, balance_snapshots, cached_metrics)' as status;
