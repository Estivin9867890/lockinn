-- ============================================================
-- LockIn "Master Control Update" — Migrations V2
-- Exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. Heure de coucher cible (string "HH:MM")
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS sleep_target_time TEXT DEFAULT '23:00';

-- 2. Points personnalisés (overrides sur les actions par défaut)
--    Format JSONB : { "seance_validee": 80, "alcool": -40 }
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS custom_points_config JSONB DEFAULT '{}';

-- 3. Mauvaises habitudes personnalisées
--    Format JSONB : [{ "id": "...", "label": "Fumer", "emoji": "🚬", "points": -30 }]
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS custom_bad_habits JSONB DEFAULT '[]';
