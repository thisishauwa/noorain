-- ============================================================
-- Noorain Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS noorain_users (
  id         TEXT PRIMARY KEY,          -- QF OAuth sub
  name       TEXT NOT NULL DEFAULT 'Anonymous',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

-- ── Enable RLS ───────────────────────────────────────────────────────────────
ALTER TABLE noorain_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE noorain_quiz_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE noorain_leaderboard  ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies (leaderboard is public read-only) ────────────────────────────
CREATE POLICY "Public read users"       ON noorain_users        FOR SELECT USING (true);
CREATE POLICY "Public read scores"      ON noorain_quiz_scores  FOR SELECT USING (true);
CREATE POLICY "Public read leaderboard" ON noorain_leaderboard  FOR SELECT USING (true);

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
