-- ============================================================
-- LockIn — Migration Auth Multi-utilisateurs
-- Colle CE FICHIER dans Supabase > SQL Editor et exécute
-- ============================================================

-- 1. Supprimer toutes les anciennes politiques permissives
DROP POLICY IF EXISTS "allow_all_user_settings"          ON user_settings;
DROP POLICY IF EXISTS "allow_all_sport_spots"            ON sport_spots;
DROP POLICY IF EXISTS "allow_all_sport_sessions"         ON sport_sessions;
DROP POLICY IF EXISTS "allow_all_nutrition_logs"         ON nutrition_logs;
DROP POLICY IF EXISTS "allow_all_water_logs"             ON water_logs;
DROP POLICY IF EXISTS "allow_all_finances_transactions"  ON finances_transactions;
DROP POLICY IF EXISTS "allow_all_finances_subscriptions" ON finances_subscriptions;
DROP POLICY IF EXISTS "allow_all_media_vault"            ON media_vault;
DROP POLICY IF EXISTS "allow_all_inventory"              ON inventory;

-- 2. Recréer user_settings avec UUID lié à auth.users (remplace le text 'default')
DROP TABLE IF EXISTS user_settings CASCADE;
CREATE TABLE user_settings (
  id                        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                   uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name              text NOT NULL DEFAULT 'Moi',
  water_goal_ml             integer NOT NULL DEFAULT 2000,
  calorie_goal              integer NOT NULL DEFAULT 2200,
  protein_goal_g            integer NOT NULL DEFAULT 165,
  carbs_goal_g              integer NOT NULL DEFAULT 250,
  fat_goal_g                integer NOT NULL DEFAULT 75,
  steps_goal                integer NOT NULL DEFAULT 10000,
  workout_sessions_per_week integer NOT NULL DEFAULT 4,
  monthly_budget_eur        numeric(10,2) NOT NULL DEFAULT 1500,
  sleep_goal_hours          numeric(4,1) NOT NULL DEFAULT 8.0,
  strava_connected          boolean NOT NULL DEFAULT false,
  strava_athlete_id         bigint,
  strava_access_token       text,
  strava_refresh_token      text,
  strava_token_expires_at   timestamptz,
  updated_at                timestamptz DEFAULT now()
);

-- 3. Ajouter user_id à toutes les tables de données
ALTER TABLE sport_spots            ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sport_sessions         ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE nutrition_logs         ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE water_logs             ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE finances_transactions  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE finances_subscriptions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE media_vault            ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE inventory              ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Activer RLS + politiques : chaque user ne voit QUE ses données
ALTER TABLE user_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_spots            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_vault            ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory              ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_settings"      ON user_settings          FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_spots"         ON sport_spots            FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_sessions"      ON sport_sessions         FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_nutrition"     ON nutrition_logs         FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_water"         ON water_logs             FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_transactions"  ON finances_transactions  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_subscriptions" ON finances_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_media"         ON media_vault            FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_inventory"     ON inventory              FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Trigger : crée automatiquement user_settings à chaque inscription
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS create_settings_on_signup ON auth.users;
CREATE TRIGGER create_settings_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();
