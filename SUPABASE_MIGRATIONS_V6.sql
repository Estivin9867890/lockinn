-- ============================================================
-- LockIn V6 — Sport Analysis + Weight Tracking + Finance Income
-- Exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. Colonnes supplémentaires sur sport_sessions
ALTER TABLE sport_sessions
  ADD COLUMN IF NOT EXISTS readiness_score  INT CHECK (readiness_score BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS session_sub_type TEXT;

-- 2. Table weight_logs (suivi poids corporel)
CREATE TABLE IF NOT EXISTS weight_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users NOT NULL,
  date        DATE NOT NULL,
  weight_kg   NUMERIC(5,2) NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their weight_logs" ON weight_logs
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS weight_logs_user_date ON weight_logs (user_id, date DESC);

-- 3. Table exercise_library (bibliothèque d'exercices personnelle)
CREATE TABLE IF NOT EXISTS exercise_library (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users NOT NULL,
  name             TEXT NOT NULL,
  muscle_group     TEXT NOT NULL,
  default_sets     INT DEFAULT 4,
  default_reps     TEXT DEFAULT '8-12',
  default_rest_sec INT DEFAULT 90,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their exercise_library" ON exercise_library
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS exercise_library_user_group ON exercise_library (user_id, muscle_group);

-- 4. Colonne is_income sur finances_transactions (revenus positifs)
ALTER TABLE finances_transactions
  ADD COLUMN IF NOT EXISTS is_income BOOLEAN DEFAULT false;
