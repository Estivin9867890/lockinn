-- ============================================================
-- LockIn "Sovereign Life OS" — Migrations V4
-- Exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. Table Sleep Logs (Sommeil + Sleep Score)
CREATE TABLE IF NOT EXISTS sleep_logs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users NOT NULL,
  date         DATE NOT NULL,                    -- La date du réveil (matin)
  bedtime      TEXT NOT NULL,                    -- "23:00"
  wake_time    TEXT NOT NULL,                    -- "07:00"
  duration_min INT NOT NULL,                     -- Durée calculée en minutes
  quality      INT NOT NULL CHECK (quality BETWEEN 1 AND 10),
  score        INT NOT NULL DEFAULT 0,           -- 0-100 calculé
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their sleep logs" ON sleep_logs
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS sleep_logs_user_date ON sleep_logs (user_id, date DESC);

-- 2. Table Investments (Portefeuille)
CREATE TABLE IF NOT EXISTS investments (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users NOT NULL,
  name          TEXT NOT NULL,
  ticker        TEXT,
  category      TEXT NOT NULL DEFAULT 'autre',   -- action, crypto, immobilier, autre
  amount_eur    NUMERIC(12,2) NOT NULL,
  quantity      NUMERIC(18,8),
  buy_price     NUMERIC(12,4),
  current_price NUMERIC(12,4),
  date          DATE NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their investments" ON investments
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS investments_user_date ON investments (user_id, date DESC);

-- 3. Table Snapshots (Mémoire du jour)
CREATE TABLE IF NOT EXISTS snapshots (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   UUID REFERENCES auth.users NOT NULL,
  date      DATE NOT NULL UNIQUE,               -- 1 snapshot par jour
  phrase    TEXT NOT NULL,
  photo_url TEXT,
  mood      INT NOT NULL DEFAULT 3 CHECK (mood BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their snapshots" ON snapshots
  FOR ALL USING (auth.uid() = user_id);

-- 4. Colonne sleep_wake_time dans user_settings (si pas déjà fait)
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS sleep_wake_time TEXT DEFAULT '07:00';

-- 5. Index performances supplémentaires
CREATE INDEX IF NOT EXISTS points_history_date_idx ON points_history (user_id, date DESC);
