-- ============================================================
-- Life OS — Schéma Supabase/PostgreSQL
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── user_settings ──────────────────────────────────────────────────────────
-- Une seule ligne par utilisateur (user_id = 'default' pour usage solo)
CREATE TABLE IF NOT EXISTS user_settings (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       text        UNIQUE NOT NULL DEFAULT 'default',
  water_goal_ml integer     NOT NULL DEFAULT 2000,
  calorie_goal  integer     NOT NULL DEFAULT 2200,
  protein_goal_g integer    NOT NULL DEFAULT 165,
  carbs_goal_g  integer     NOT NULL DEFAULT 250,
  fat_goal_g    integer     NOT NULL DEFAULT 75,
  steps_goal    integer     NOT NULL DEFAULT 10000,
  workout_sessions_per_week integer NOT NULL DEFAULT 4,
  monthly_budget_eur numeric(10,2) NOT NULL DEFAULT 1500,
  sleep_goal_hours numeric(4,1) NOT NULL DEFAULT 8.0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Ligne par défaut (auto-insérée au premier lancement)
INSERT INTO user_settings (user_id) VALUES ('default')
ON CONFLICT (user_id) DO NOTHING;

-- ─── sport_spots ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sport_spots (
  id           uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text  NOT NULL,
  lat          numeric(10,6) NOT NULL,
  lng          numeric(10,6) NOT NULL,
  type         text  NOT NULL CHECK (type IN ('run','bike','skate','climb','gym')),
  distance_km  numeric(6,2),
  notes        text,
  created_at   timestamptz DEFAULT now()
);

-- ─── sport_sessions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sport_sessions (
  id           uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  date         date  NOT NULL DEFAULT CURRENT_DATE,
  type         text  NOT NULL,
  duration_min integer NOT NULL CHECK (duration_min > 0),
  calories     integer CHECK (calories >= 0),
  spot_id      uuid  REFERENCES sport_spots(id) ON DELETE SET NULL,
  notes        text,
  created_at   timestamptz DEFAULT now()
);

-- ─── nutrition_logs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id           uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  date         date    NOT NULL DEFAULT CURRENT_DATE,
  meal_name    text    NOT NULL,
  items        text[]  NOT NULL DEFAULT '{}',
  calories     integer NOT NULL DEFAULT 0 CHECK (calories >= 0),
  protein_g    numeric(6,1) NOT NULL DEFAULT 0,
  carbs_g      numeric(6,1) NOT NULL DEFAULT 0,
  fat_g        numeric(6,1) NOT NULL DEFAULT 0,
  completed    boolean NOT NULL DEFAULT false,
  time_of_day  text,
  created_at   timestamptz DEFAULT now()
);

-- ─── water_logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS water_logs (
  id         uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  date       date    NOT NULL DEFAULT CURRENT_DATE,
  amount_ml  integer NOT NULL CHECK (amount_ml > 0),
  created_at timestamptz DEFAULT now()
);

-- ─── finances_transactions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS finances_transactions (
  id         uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  date       date    NOT NULL DEFAULT CURRENT_DATE,
  label      text    NOT NULL,
  category   text    NOT NULL DEFAULT 'Autre',
  amount     numeric(10,2) NOT NULL CHECK (amount > 0),
  recurring  boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ─── finances_subscriptions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS finances_subscriptions (
  id             uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  name           text    NOT NULL,
  amount         numeric(10,2) NOT NULL CHECK (amount > 0),
  color          text    NOT NULL DEFAULT '#5B9CF6',
  icon           text    NOT NULL DEFAULT '💳',
  billing_period text    NOT NULL DEFAULT 'mensuel',
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

-- ─── media_vault ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media_vault (
  id         uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  title      text    NOT NULL,
  type       text    NOT NULL CHECK (type IN ('movie','series','book')),
  status     text    NOT NULL DEFAULT 'to-watch' CHECK (status IN ('to-watch','watching','completed')),
  rating     integer CHECK (rating >= 1 AND rating <= 10),
  poster_url text,
  genre      text,
  year       integer CHECK (year > 1800),
  progress   integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  notes      text,
  created_at timestamptz DEFAULT now()
);

-- ─── inventory ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id              uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  name            text    NOT NULL,
  category        text    NOT NULL,
  purchase_date   date,
  usage_unit      text    NOT NULL DEFAULT 'km',
  current_usage   numeric(10,2) NOT NULL DEFAULT 0 CHECK (current_usage >= 0),
  max_usage       numeric(10,2) NOT NULL CHECK (max_usage > 0),
  icon            text    NOT NULL DEFAULT '📦',
  color           text    NOT NULL DEFAULT '#5B9CF6',
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- ─── RLS (permissif — app personnelle sans auth) ─────────────────────────────
ALTER TABLE user_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_spots            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_vault            ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory              ENABLE ROW LEVEL SECURITY;

-- Politique "tout public" pour usage solo (pas d'auth)
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'user_settings','sport_spots','sport_sessions',
    'nutrition_logs','water_logs','finances_transactions',
    'finances_subscriptions','media_vault','inventory'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "allow_all_%s" ON %I FOR ALL USING (true) WITH CHECK (true)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ─── Index utiles ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_nutrition_date   ON nutrition_logs (date DESC);
CREATE INDEX IF NOT EXISTS idx_water_date       ON water_logs (date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_date     ON finances_transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_date    ON sport_sessions (date DESC);
CREATE INDEX IF NOT EXISTS idx_media_status     ON media_vault (status);
