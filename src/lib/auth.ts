const USER_API_BASE = "https://apis.quran.foundation/auth/v1";
const CLIENT_ID = import.meta.env.VITE_QURAN_CLIENT_ID as string;

// ── User API calls (fire-and-forget, fail silently) ───────────────────────────

function userHeaders(token: string) {
  return {
    "x-auth-token": token,
    "x-client-id": CLIENT_ID,
    "Content-Type": "application/json",
    "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

async function fireAndForget(
  path: string,
  body: Record<string, unknown>,
  token: string | null,
) {
  if (!token) return;
  try {
    await fetch(`${USER_API_BASE}${path}`, {
      method: "POST",
      headers: userHeaders(token),
      body: JSON.stringify(body),
    });
  } catch {}
}

/** Track current reading position for "Continue reading" resume UX */
export function syncReadingSession(
  chapterNumber: number,
  verseNumber: number,
  token: string | null,
) {
  void fireAndForget(
    "/reading-sessions",
    { chapterNumber, verseNumber },
    token,
  );
}

/**
 * Credit reading time to streaks, goals, and activity calendar.
 * ranges format: "1:1-1:7" or "2:1-2:10,3:1-3:5"
 */
export function syncActivityDay(
  ranges: string,
  seconds: number,
  token: string | null,
) {
  if (!ranges) return;
  void fireAndForget(
    "/activity-days",
    {
      type: "QURAN",
      seconds: Math.max(1, Math.round(seconds)),
      ranges,
      mushafId: 4,
    },
    token,
  );
}

/** Set the cloud reading bookmark (isReading singleton) */
export function syncBookmark(
  chapterNumber: number,
  verseNumber: number,
  token: string | null,
) {
  void fireAndForget(
    "/bookmarks",
    {
      key: chapterNumber,
      type: "ayah",
      verseNumber,
      isReading: true,
      mushafId: 4,
    },
    token,
  );
}
