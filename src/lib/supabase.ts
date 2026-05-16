import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase env vars not set — leaderboard features disabled.");
}

/** Public read-only client (publishable key — safe in browser) */
export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// ── Types ────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  total_score: number;
  quiz_count: number;
  week_start: string;
}

export interface QuizScore {
  user_id: string;
  user_name: string;
  surah_number: number;
  surah_name: string;
  score: number;
  total_questions: number;
}

// ── Read helpers (use publishable key client) ────────────────────────────────

/** Fetch this week's global leaderboard (top 10) */
export async function fetchWeeklyLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];
  const weekStart = getWeekStart();
  const { data, error } = await supabase
    .from("noorain_leaderboard")
    .select("user_id, user_name, total_score, quiz_count, week_start")
    .eq("week_start", weekStart)
    .order("total_score", { ascending: false })
    .limit(10);
  if (error) {
    console.error("Leaderboard fetch error:", error.message);
    return [];
  }
  return data ?? [];
}

/** Fetch a single user's rank this week */
export async function fetchUserRank(userId: string): Promise<number | null> {
  if (!supabase || !userId) return null;
  const board = await fetchWeeklyLeaderboard();
  const idx = board.findIndex((e) => e.user_id === userId);
  return idx === -1 ? null : idx + 1;
}

// ── Write helpers (go through /api/sb-record — server-side service role) ──────

/** Record a completed quiz score (server-validated) */
export async function recordQuizScore(
  payload: QuizScore,
  accessToken: string,
): Promise<boolean> {
  try {
    const res = await fetch("/api/sb-record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "quiz_score", payload, accessToken }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Upsert user profile in Supabase (called on login) */
export async function upsertUser(
  userId: string,
  name: string,
  accessToken: string,
  email?: string,
): Promise<boolean> {
  try {
    const res = await fetch("/api/sb-record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "upsert_user",
        payload: { user_id: userId, user_name: name, email: email ?? null },
        accessToken,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Utility ──────────────────────────────────────────────────────────────────

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}
