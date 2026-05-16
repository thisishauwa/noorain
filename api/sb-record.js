import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const qfAuthBase =
  process.env.QF_AUTH_BASE || "https://oauth2.quran.foundation";

// ── Validate QF access token ──────────────────────────────────────────────────
async function getQFUser(accessToken) {
  try {
    const res = await fetch(`${qfAuthBase}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return await res.json(); // { sub, name, email, ... }
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(503).json({ error: "Supabase not configured" });
  }

  const { type, payload, accessToken } = req.body ?? {};

  if (!accessToken || !type || !payload) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate the QF token — get the real user identity
  const qfUser = await getQFUser(accessToken);
  if (!qfUser?.sub) {
    return res.status(401).json({ error: "Invalid access token" });
  }

  // Service-role client — full DB access, never sent to browser
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    if (type === "upsert_user") {
      const { error } = await supabase.from("noorain_users").upsert(
        {
          id: qfUser.sub,
          name: qfUser.name || payload.user_name || "Anonymous",
          email: qfUser.email || payload.email || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    if (type === "quiz_score") {
      const { score, total_questions, surah_number, surah_name } = payload;

      // Record the raw score
      const { error: scoreError } = await supabase
        .from("noorain_quiz_scores")
        .insert({
          user_id: qfUser.sub,
          user_name: qfUser.name || "Anonymous",
          surah_number,
          surah_name,
          score,
          total_questions,
        });
      if (scoreError) throw scoreError;

      // Upsert leaderboard (weekly aggregate)
      const weekStart = getWeekStart();
      const { error: lbError } = await supabase.rpc(
        "upsert_leaderboard_score",
        {
          p_user_id: qfUser.sub,
          p_user_name: qfUser.name || "Anonymous",
          p_score: score,
          p_week_start: weekStart,
        },
      );
      if (lbError) throw lbError;

      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    console.error("sb-record error:", err);
    return res.status(500).json({ error: "Database error" });
  }
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}
