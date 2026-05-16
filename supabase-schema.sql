-- ============================================================
-- Noorain Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS noorain_users (
  id         TEXT PRIMARY KEY,          -- QF OAuth sub
  name       TEXT NOT NULL DEFAULT 'Anonymous',
  email      TEXT,                      -- QF email (may be null)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migration: add email to existing deployments (safe to re-run)
ALTER TABLE noorain_users ADD COLUMN IF NOT EXISTS email TEXT;

-- 1b. User progress (cross-device persistence)
CREATE TABLE IF NOT EXISTS noorain_progress (
  user_id             TEXT PRIMARY KEY,
  bookmark_surah      INT,
  bookmark_ayah       INT,
  bookmark_page       INT,
  bookmark_juz        INT,
  bookmark_last_read  TEXT,
  streak_current      INT  DEFAULT 0,
  streak_longest      INT  DEFAULT 0,
  streak_last_date    TEXT,
  streak_history      JSONB DEFAULT '[]',
  mood_score          INT  DEFAULT 70,
  sadaqah_meals       INT  DEFAULT 0,
  completed_juz       JSONB DEFAULT '[]',
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Migration for existing deployments (safe to re-run)
ALTER TABLE noorain_progress ADD COLUMN IF NOT EXISTS bookmark_surah     INT;
ALTER TABLE noorain_progress ADD COLUMN IF NOT EXISTS bookmark_ayah      INT;
ALTER TABLE noorain_progress ADD COLUMN IF NOT EXISTS bookmark_page      INT;
ALTER TABLE noorain_progress ADD COLUMN IF NOT EXISTS bookmark_juz       INT;
ALTER TABLE noorain_progress ADD COLUMN IF NOT EXISTS bookmark_last_read TEXT;
ALTER TABLE noorain_progress ADD COLUMN IF NOT EXISTS streak_current     INT  DEFAULT 0;
ALTER TABLE noorain_progress ADD COLUMN IF NOT EXISTS streak_longest     INT  DEFAULT 0;
ALTER TABLE noorain_progress ADD COLUMN IF NOT EXISTS streak_last_date   TEXT;
ALTER TABLE noorain_progress ADD COLUMN IF NOT EXISTS streak_history     JSONB DEFAULT '[]';
ALTER TABLE noorain_progress ADD COLUMN IF NOT EXISTS mood_score         INT  DEFAULT 70;
ALTER TABLE noorain_progress ADD COLUMN IF NOT EXISTS sadaqah_meals      INT  DEFAULT 0;
ALTER TABLE noorain_progress ADD COLUMN IF NOT EXISTS completed_juz      JSONB DEFAULT '[]';

-- 2. Quiz scores (individual attempts)
CREATE TABLE IF NOT EXISTS noorain_quiz_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  user_name       TEXT NOT NULL DEFAULT 'Anonymous',
  surah_number    INT  NOT NULL,
  surah_name      TEXT,
  score           INT  NOT NULL,
  total_questions INT  NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. Weekly leaderboard (aggregated)
CREATE TABLE IF NOT EXISTS noorain_leaderboard (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  user_name   TEXT NOT NULL DEFAULT 'Anonymous',
  total_score INT  NOT NULL DEFAULT 0,
  quiz_count  INT  NOT NULL DEFAULT 0,
  week_start  DATE NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- ── Expose tables to Data API (required since April 2026) ───────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON noorain_users    TO anon, authenticated;
GRANT SELECT ON noorain_quiz_scores TO anon, authenticated;
GRANT SELECT ON noorain_leaderboard TO anon, authenticated;
GRANT SELECT ON noorain_progress    TO anon, authenticated;

-- ── Enable RLS ───────────────────────────────────────────────────────────────
ALTER TABLE noorain_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE noorain_quiz_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE noorain_leaderboard  ENABLE ROW LEVEL SECURITY;
ALTER TABLE noorain_progress     ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies (all public read-only; writes via service role only) ─────────
CREATE POLICY "Public read users"       ON noorain_users        FOR SELECT USING (true);
CREATE POLICY "Public read scores"      ON noorain_quiz_scores  FOR SELECT USING (true);
CREATE POLICY "Public read leaderboard" ON noorain_leaderboard  FOR SELECT USING (true);
CREATE POLICY "Public read progress"    ON noorain_progress     FOR SELECT USING (true);

-- Writes only from service role (our server-side function — no browser writes)
-- No INSERT/UPDATE/DELETE policies needed for anon/authenticated.

-- ── Stored procedure: upsert leaderboard score atomically ────────────────────
CREATE OR REPLACE FUNCTION upsert_leaderboard_score(
  p_user_id   TEXT,
  p_user_name TEXT,
  p_score     INT,
  p_week_start DATE
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO noorain_leaderboard (user_id, user_name, total_score, quiz_count, week_start)
  VALUES (p_user_id, p_user_name, p_score, 1, p_week_start)
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET
    total_score = noorain_leaderboard.total_score + EXCLUDED.total_score,
    quiz_count  = noorain_leaderboard.quiz_count + 1,
    user_name   = EXCLUDED.user_name,
    updated_at  = now();
END;
$$;
