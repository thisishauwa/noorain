const USER_API_BASE = "https://apis.quran.foundation/auth/v1";
const CLIENT_ID = import.meta.env.VITE_QURAN_CLIENT_ID as string;
const AUTH_TOKEN = import.meta.env.VITE_QURAN_AUTH_TOKEN as string;

// ── User API calls (fire-and-forget, fail silently) ───────────────────────────

function userHeaders() {
  return {
    "x-auth-token": AUTH_TOKEN,
    "x-client-id": CLIENT_ID,
    "Content-Type": "application/json",
    "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/** Track current reading position for "Continue reading" resume UX */
export function syncReadingSession(chapterNumber: number, verseNumber: number) {
  fetch(`${USER_API_BASE}/reading-sessions`, {
    method: "POST",
    headers: userHeaders(),
    body: JSON.stringify({ chapterNumber, verseNumber }),
  }).catch(() => {});
}

/**
 * Credit reading time to streaks, goals, and activity calendar.
 * ranges format: "1:1-1:7" or "2:1-2:10,3:1-3:5"
 */
export function syncActivityDay(ranges: string, seconds: number) {
  if (!ranges) return;
  fetch(`${USER_API_BASE}/activity-days`, {
    method: "POST",
    headers: userHeaders(),
    body: JSON.stringify({
      type: "QURAN",
      seconds,
      ranges,
      mushafId: 4,
      date: new Date().toISOString().split("T")[0],
    }),
  }).catch(() => {});
}

/** Set the cloud reading bookmark (isReading singleton) */
export function syncBookmark(chapterNumber: number, verseNumber: number) {
  fetch(`${USER_API_BASE}/bookmarks`, {
    method: "POST",
    headers: userHeaders(),
    body: JSON.stringify({
      chapterNumber,
      type: "ayah",
      verseNumber,
      isReading: true,
      mushafId: 4,
    }),
  }).catch(() => {});
}
