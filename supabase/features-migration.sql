-- ============================================================
-- LockIn — Migration Features (Calendrier, Notes, Diète)
-- Colle dans Supabase > SQL Editor
-- ============================================================

-- ─── Table events (Calendrier) ────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title      text NOT NULL,
  start_at   timestamptz NOT NULL,
  end_at     timestamptz NOT NULL,
  type       text NOT NULL DEFAULT 'personal'
               CHECK (type IN ('lockin','sport','personal','work','health','other')),
  color      text NOT NULL DEFAULT '#5B9CF6',
  notes      text,
  all_day    boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_events" ON events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_date ON events (user_id, start_at DESC);

-- ─── Table notes (Brain Dump) ──────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title      text NOT NULL DEFAULT 'Sans titre',
  content    text NOT NULL DEFAULT '',
  pinned     boolean NOT NULL DEFAULT false,
  tags       text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_notes" ON notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes (user_id, updated_at DESC);

-- ─── Champs Diète dans user_settings ──────────────────────
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS weight_kg      numeric(5,1);
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS height_cm      integer;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS age            integer;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS activity_level text DEFAULT 'moderate';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS nutrition_goal text DEFAULT 'maintenance';
