-- ============================================================
-- Life OS — Migrations (à exécuter après schema.sql)
-- ============================================================

-- ─── user_settings : profil + Strava ────────────────────────
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS display_name text NOT NULL DEFAULT 'Moi';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS strava_connected boolean NOT NULL DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS strava_athlete_id bigint;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS strava_access_token text;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS strava_refresh_token text;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS strava_token_expires_at timestamptz;

-- ─── sport_sessions : champs Strava ──────────────────────────
ALTER TABLE sport_sessions ADD COLUMN IF NOT EXISTS strava_activity_id bigint UNIQUE;
ALTER TABLE sport_sessions ADD COLUMN IF NOT EXISTS distance_km numeric(6,2);
ALTER TABLE sport_sessions ADD COLUMN IF NOT EXISTS start_lat numeric(10,6);
ALTER TABLE sport_sessions ADD COLUMN IF NOT EXISTS start_lng numeric(10,6);
