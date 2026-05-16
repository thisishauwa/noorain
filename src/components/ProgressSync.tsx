/**
 * ProgressSync — invisible component that bridges auth context ↔ Supabase ↔ store.
 *
 * On mount (authenticated):
 *   1. Fetches remote progress from Supabase
 *   2. Calls hydrateFromRemote() to merge it into local state
 *
 * On every store change (debounced 5 s):
 *   3. Saves the full state to Supabase so any future device gets it
 */
import { useEffect, useRef } from "react";
import { useAuth } from "../lib/authContext";
import { useAppContext } from "../lib/store";
import { fetchUserProgress, saveUserProgress } from "../lib/supabase";

export function ProgressSync() {
  const { user, accessToken, isGuest, isReady } = useAuth();
  const { bookmark, streak, completedJuz, sadaqah, noor, hydrateFromRemote } =
    useAppContext();

  const hasSynced = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 1. Restore from Supabase on login ─────────────────────────────────────
  useEffect(() => {
    if (!isReady || isGuest || !user?.sub || hasSynced.current) return;
    hasSynced.current = true;

    fetchUserProgress(user.sub).then((remote) => {
      if (remote) hydrateFromRemote(remote);
    });
  }, [isReady, isGuest, user?.sub]);

  // Reset sync flag on logout so next login re-fetches
  useEffect(() => {
    if (!user?.sub) hasSynced.current = false;
  }, [user?.sub]);

  // ── 2. Save to Supabase on store changes (debounced 5 s) ─────────────────
  useEffect(() => {
    if (isGuest || !accessToken || !user?.sub) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveUserProgress(
        {
          bookmark_surah: bookmark?.surah ?? null,
          bookmark_ayah: bookmark?.ayah ?? null,
          bookmark_page: bookmark?.page ?? null,
          bookmark_juz: bookmark?.juz ?? null,
          bookmark_last_read: bookmark?.lastRead ?? null,
          streak_current: streak.current,
          streak_longest: streak.longest,
          streak_last_date: streak.lastReadDate ?? null,
          streak_history: streak.history,
          mood_score: noor.moodScore,
          sadaqah_meals: sadaqah.meals,
          completed_juz: completedJuz,
        },
        accessToken,
      );
    }, 5000); // 5 s debounce — saves are fire-and-forget

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [bookmark, streak, noor.moodScore, sadaqah.meals, completedJuz, accessToken, isGuest]);

  return null; // renders nothing
}
