-- ============================================================
-- LockIn V5 — Finance Précision + Settings Master
-- Exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. Table investment_transactions (transactions liées à chaque investissement)
CREATE TABLE IF NOT EXISTS investment_transactions (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users NOT NULL,
  investment_id  UUID REFERENCES investments(id) ON DELETE CASCADE,
  type           TEXT NOT NULL DEFAULT 'buy',    -- 'buy' | 'sell'
  quantity       NUMERIC(18,8) NOT NULL,
  price_eur      NUMERIC(12,4) NOT NULL,
  total_eur      NUMERIC(12,2) NOT NULL,
  date           DATE NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their investment_transactions" ON investment_transactions
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS inv_tx_user_inv ON investment_transactions (user_id, investment_id, date DESC);

-- 2. Nouveaux champs user_settings pour Settings V2
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS weekly_budget_eur        NUMERIC(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS thermal_threshold        INT DEFAULT 80,     -- % avant rouge
  ADD COLUMN IF NOT EXISTS hardcore_mode            BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_reset_33h           BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS currency                 TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS theme                    TEXT DEFAULT 'space_gray',
  ADD COLUMN IF NOT EXISTS morning_routine_time     TEXT DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS night_routine_time       TEXT DEFAULT '22:00';

-- 3. Index pour points_history (Règle 33h + Weekly Wrapped)
CREATE INDEX IF NOT EXISTS points_history_created ON points_history (user_id, created_at DESC);
