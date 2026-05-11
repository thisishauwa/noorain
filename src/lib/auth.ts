const USER_API_BASE = "https://apis.quran.foundation/auth/v1";
const CLIENT_ID = import.meta.env.VITE_QURAN_CLIENT_ID as string;
const USER_AUTH_TOKEN = import.meta.env.VITE_QURAN_USER_AUTH_TOKEN as string;

let syncDisabled = !CLIENT_ID || !USER_AUTH_TOKEN;

// ── User API calls (fire-and-forget, fail silently) ───────────────────────────

function userHeaders() {
  return {
    "x-auth-token": USER_AUTH_TOKEN,
    "x-client-id": CLIENT_ID,
    "Content-Type": "application/json",
    "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

async function fireAndForget(path: string, body: Record<string, unknown>) {
  if (syncDisabled) return;
  try {
    const res = await fetch(`${USER_API_BASE}${path}`, {
      method: "POST",
      headers: userHeaders(),
      body: JSON.stringify(body),
    });
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      syncDisabled = true;
    }
  } catch {
    syncDisabled = true;
  }
}

/** Track current reading position for "Continue reading" resume UX */
export function syncReadingSession(chapterNumber: number, verseNumber: number) {
  void fireAndForget("/reading-sessions", { chapterNumber, verseNumber });
}

/**
 * Credit reading time to streaks, goals, and activity calendar.
 * ranges format: "1:1-1:7" or "2:1-2:10,3:1-3:5"
 */
export function syncActivityDay(ranges: string, seconds: number) {
  if (!ranges) return;
  void fireAndForget("/activity-days", {
    type: "QURAN",
    seconds: Math.max(1, Math.round(seconds)),
    ranges,
    mushafId: 4,
  });
}

/** Set the cloud reading bookmark (isReading singleton) */
export function syncBookmark(chapterNumber: number, verseNumber: number) {
  void fireAndForget("/bookmarks", {
    key: chapterNumber,
    type: "ayah",
    verseNumber,
    isReading: true,
    mushafId: 4,
  });
}
