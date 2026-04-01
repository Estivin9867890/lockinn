-- ============================================================
-- LockIn "Builder & Explorer Update" — Migrations V3
-- Exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. Table Mémos (Post-it numériques avec Smart Schedule)
CREATE TABLE IF NOT EXISTS memos (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users NOT NULL,
  content      TEXT NOT NULL,
  icon         TEXT DEFAULT '📝',
  color        TEXT DEFAULT '#FEFCE8',
  scheduled_at TIMESTAMPTZ,
  event_id     UUID,  -- FK souple vers events(id), pas de contrainte hard (events créée séparément)
  completed    BOOLEAN DEFAULT false,
  pinned       BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their memos" ON memos
  FOR ALL USING (auth.uid() = user_id);

-- 2. Table Projets
CREATE TABLE IF NOT EXISTS projects (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT DEFAULT '',
  emoji          TEXT DEFAULT '🚀',
  color          TEXT DEFAULT '#5B9CF6',
  status         TEXT DEFAULT 'active',
  total_time_min INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- 3. Table Milestones (étapes de projet)
CREATE TABLE IF NOT EXISTS milestones (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users NOT NULL,
  title        TEXT NOT NULL,
  difficulty   TEXT DEFAULT 'medium',
  completed    BOOLEAN DEFAULT false,
  points       INT DEFAULT 25,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their milestones" ON milestones
  FOR ALL USING (auth.uid() = user_id);

-- 4. Table Sessions Focus (timer lié aux projets)
CREATE TABLE IF NOT EXISTS focus_sessions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users NOT NULL,
  project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  duration_min INT NOT NULL,
  started_at   TIMESTAMPTZ DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their focus sessions" ON focus_sessions
  FOR ALL USING (auth.uid() = user_id);

-- 5. Table Défis & Quêtes
CREATE TABLE IF NOT EXISTS challenges (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT DEFAULT '',
  emoji         TEXT DEFAULT '⚡',
  type          TEXT DEFAULT 'weekly',
  target        INT DEFAULT 1,
  current       INT DEFAULT 0,
  points_reward INT DEFAULT 50,
  week_start    DATE,
  completed     BOOLEAN DEFAULT false,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their challenges" ON challenges
  FOR ALL USING (auth.uid() = user_id);

-- Index pour les quêtes hebdomadaires
CREATE INDEX IF NOT EXISTS challenges_week_idx ON challenges (user_id, type, week_start);
