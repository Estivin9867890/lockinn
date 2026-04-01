-- ============================================================
-- LockIn "Performance Update" — Migrations Supabase
-- Exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. Ajouter le champ "feeling" aux sessions sport (1-10)
ALTER TABLE sport_sessions
  ADD COLUMN IF NOT EXISTS feeling INT CHECK (feeling >= 1 AND feeling <= 10);

-- 2. Table programme hebdomadaire
CREATE TABLE IF NOT EXISTS workout_plans (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  label       TEXT NOT NULL DEFAULT '',
  exercises   JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, day_of_week)
);
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their workout plans" ON workout_plans
  FOR ALL USING (auth.uid() = user_id);

-- 3. Table PR Tracker (Personal Records)
CREATE TABLE IF NOT EXISTS pr_tracker (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users NOT NULL,
  exercise    TEXT NOT NULL,
  weight_kg   NUMERIC,
  reps        INT,
  date        DATE DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE pr_tracker ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their PRs" ON pr_tracker
  FOR ALL USING (auth.uid() = user_id);

-- 4. Table Ingrédients de repas
CREATE TABLE IF NOT EXISTS meal_ingredients (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id     UUID REFERENCES nutrition_logs(id) ON DELETE CASCADE,
  food_name   TEXT NOT NULL,
  weight_g    NUMERIC NOT NULL,
  protein_g   NUMERIC DEFAULT 0,
  carbs_g     NUMERIC DEFAULT 0,
  fat_g       NUMERIC DEFAULT 0,
  calories    NUMERIC DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE meal_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own meal ingredients via nutrition_logs" ON meal_ingredients
  FOR ALL USING (
    meal_id IN (
      SELECT id FROM nutrition_logs WHERE user_id = auth.uid()
    )
  );

-- 5. Table Historique des points (Gamification)
CREATE TABLE IF NOT EXISTS points_history (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users NOT NULL,
  date        DATE DEFAULT CURRENT_DATE,
  action      TEXT NOT NULL,
  label       TEXT NOT NULL DEFAULT '',
  points      INT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their points" ON points_history
  FOR ALL USING (auth.uid() = user_id);

-- Index pour les requêtes par date
CREATE INDEX IF NOT EXISTS points_history_date_idx ON points_history (user_id, date);

-- 6. Table Suppléments
CREATE TABLE IF NOT EXISTS supplements (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users NOT NULL,
  name        TEXT NOT NULL,
  protein_g   NUMERIC DEFAULT 0,
  carbs_g     NUMERIC DEFAULT 0,
  fat_g       NUMERIC DEFAULT 0,
  has_macros  BOOLEAN DEFAULT false,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their supplements" ON supplements
  FOR ALL USING (auth.uid() = user_id);

-- 7. Table Logs quotidiens des suppléments
CREATE TABLE IF NOT EXISTS supplement_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users NOT NULL,
  supplement_id   UUID REFERENCES supplements(id) ON DELETE CASCADE,
  date            DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, supplement_id, date)
);
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their supplement logs" ON supplement_logs
  FOR ALL USING (auth.uid() = user_id);
