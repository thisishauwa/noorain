import React, { createContext, useContext, useEffect, useState } from "react";
import { getNoorMood } from "./noor";

export type Bookmark = {
  surah: number;
  ayah: number;
  page: number;
  juz: number;
  lastRead: string; // ISO date string
} | null;

export type Streak = {
  current: number;
  longest: number;
  lastReadDate: string | null;
  history: string[];
};

export type Sadaqah = {
  meals: number;
  completedJuz: number[];
};

export type Noor = {
  moodScore: number;
  currentMood: string;
  lastUpdated: string | null;
  sadaqahTrigger: boolean;
  lastFridayDonation: string | null;
};

interface AppState {
  bookmark: Bookmark;
  pinnedBookmark: Bookmark;
  streak: Streak;
  completedJuz: number[];
  sadaqah: Sadaqah;
  noor: Noor;
  updateBookmark: (bookmark: Bookmark) => void;
  updatePinnedBookmark: (bookmark: Bookmark) => void;
  markPageRead: (page: number, juz: number) => void;
  markJuzCompleted: (juz: number) => void;
  evaluateStreak: () => void;
  adjustNoorScore: (delta: number) => void;
  hydrateFromRemote: (remote: import("./supabase").RemoteProgress) => void;
}

const initialState: Omit<
  AppState,
  | "updateBookmark"
  | "updatePinnedBookmark"
  | "markPageRead"
  | "markJuzCompleted"
  | "evaluateStreak"
  | "adjustNoorScore"
  | "hydrateFromRemote"
> = {
  bookmark: null,
  pinnedBookmark: null,
  streak: { current: 0, longest: 0, lastReadDate: null, history: [] },
  completedJuz: [],
  sadaqah: { meals: 0, completedJuz: [] },
  noor: {
    moodScore: 70,
    currentMood: "Winking",
    lastUpdated: null,
    sadaqahTrigger: false,
    lastFridayDonation: null,
  },
};

const AppContext = createContext<AppState | undefined>(undefined);

export { getNoorMood } from "./noor";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [bookmark, setBookmark] = useState<Bookmark>(initialState.bookmark);
  const [pinnedBookmark, setPinnedBookmark] = useState<Bookmark>(
    initialState.pinnedBookmark,
  );
  const [streak, setStreak] = useState<Streak>(initialState.streak);
  const [completedJuz, setCompletedJuz] = useState<number[]>(
    initialState.completedJuz,
  );
  const [sadaqah, setSadaqah] = useState<Sadaqah>(initialState.sadaqah);
  const [noor, setNoor] = useState<Noor>(initialState.noor);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const load = (key: string, setter: any, defaultVal: any) => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          setter(JSON.parse(stored));
        } catch (e) {
          setter(defaultVal);
        }
      } else {
        setter(defaultVal);
      }
    };

    load("noorain_bookmark", setBookmark, initialState.bookmark);
    load("noorain_pinned_bookmark", setPinnedBookmark, null);
    load("noorain_streak", setStreak, initialState.streak);
    load("noorain_completed_juz", setCompletedJuz, initialState.completedJuz);
    load("noorain_sadaqah", setSadaqah, initialState.sadaqah);
    load("noorain_noor", setNoor, initialState.noor);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("noorain_bookmark", JSON.stringify(bookmark));
    localStorage.setItem(
      "noorain_pinned_bookmark",
      JSON.stringify(pinnedBookmark),
    );
    localStorage.setItem("noorain_streak", JSON.stringify(streak));
    localStorage.setItem("noorain_completed_juz", JSON.stringify(completedJuz));
    localStorage.setItem("noorain_sadaqah", JSON.stringify(sadaqah));
    localStorage.setItem("noorain_noor", JSON.stringify(noor));
  }, [bookmark, pinnedBookmark, streak, completedJuz, sadaqah, noor, isLoaded]);

  const updateBookmark = (newBookmark: Bookmark) => setBookmark(newBookmark);
  const updatePinnedBookmark = (newBookmark: Bookmark) =>
    setPinnedBookmark(newBookmark);

  const adjustNoorScore = (delta: number) => {
    const today = new Date().toISOString().split("T")[0];
    setNoor((prev) => {
      const newScore = Math.max(0, Math.min(100, prev.moodScore + delta));
      const moodInfo = getNoorMood(newScore);
      return {
        ...prev,
        moodScore: newScore,
        currentMood: moodInfo.mood,
        lastUpdated: today,
        sadaqahTrigger: moodInfo.sadaqahTrigger || false,
      };
    });
  };

  const markPageRead = (page: number, juz: number) => {
    const today = new Date().toISOString().split("T")[0];

    let isNewDay = false;
    setStreak((prev) => {
      let newCurrent = prev.current;
      let newLongest = prev.longest;
      const newHistory = [...prev.history];

      if (prev.lastReadDate !== today) {
        isNewDay = true;
        const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        if (prev.lastReadDate === yesterday) {
          newCurrent += 1;
        } else {
          newCurrent = 1; // broken streak
        }
        if (newCurrent > newLongest) newLongest = newCurrent;
        if (!newHistory.includes(today)) newHistory.push(today);
      }

      return {
        current: newCurrent,
        longest: newLongest,
        lastReadDate: today,
        history: newHistory,
      };
    });

    setNoor((prev) => {
      let newScore = prev.moodScore + 15;
      newScore = Math.max(0, Math.min(100, newScore));
      const moodInfo = getNoorMood(newScore);
      return {
        ...prev,
        moodScore: newScore,
        currentMood: moodInfo.mood,
        lastUpdated: today,
        sadaqahTrigger: moodInfo.sadaqahTrigger || false,
      };
    });
  };

  const markJuzCompleted = (juz: number) => {
    setCompletedJuz((prev) => {
      if (prev.includes(juz)) return prev;
      return [...prev, juz];
    });
    setSadaqah((prev) => {
      if (prev.completedJuz.includes(juz)) return prev;
      return {
        meals: prev.meals + 1, // 1 meal per juz
        completedJuz: [...prev.completedJuz, juz],
      };
    });
    const today = new Date().toISOString().split("T")[0];
    setNoor((prev) => {
      let newScore = prev.moodScore + 25;
      newScore = Math.max(0, Math.min(100, newScore));
      const moodInfo = getNoorMood(newScore);
      return {
        ...prev,
        moodScore: newScore,
        currentMood: moodInfo.mood,
        lastUpdated: prev.lastUpdated,
        sadaqahTrigger: moodInfo.sadaqahTrigger || false,
      };
    });
  };

  const evaluateStreak = () => {
    const today = new Date().toISOString().split("T")[0];

    // Evaluate streak
    setStreak((prev) => {
      if (prev.lastReadDate) {
        const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        if (prev.lastReadDate !== today && prev.lastReadDate !== yesterday) {
          return { ...prev, current: 0 };
        }
      }
      return prev;
    });

    // Evaluate Noor's mood decay
    setNoor((prev) => {
      if (prev.lastUpdated === today) return prev;

      let missedDays = 0;
      if (streak.lastReadDate) {
        missedDays = Math.floor(
          (new Date(today).getTime() -
            new Date(streak.lastReadDate).getTime()) /
            (1000 * 3600 * 24),
        );
      } else if (streak.history.length === 0) {
        return prev; // Never read
      }

      if (missedDays > 0) {
        let newScore = prev.moodScore;
        if (missedDays >= 5) newScore = 0;
        else if (missedDays >= 2) newScore -= 30;
        else newScore -= 20;

        newScore = Math.max(0, Math.min(100, newScore));
        const moodInfo = getNoorMood(newScore);
        return {
          ...prev,
          moodScore: newScore,
          currentMood: moodInfo.mood,
          lastUpdated: today,
          sadaqahTrigger: moodInfo.sadaqahTrigger || false,
        };
      }
      return prev;
    });

    // Friday donation — scaled by happiness, fires once per Friday
    const dayOfWeek = new Date().getDay();
    if (
      dayOfWeek === 5 &&
      noor.lastFridayDonation !== today &&
      noor.moodScore > 0
    ) {
      const mealsToAdd = Math.max(1, Math.floor(noor.moodScore / 20));
      setSadaqah((prev) => ({ ...prev, meals: prev.meals + mealsToAdd }));
      setNoor((prev) => ({
        ...prev,
        lastFridayDonation: today,
        sadaqahTrigger: true,
      }));
    }
  };

  /** Merge remote Supabase progress into local state.
   *  Remote wins for anything that's "more advanced" (higher streak, more meals, etc.)
   *  On a fresh device this means remote fills in everything. */
  const hydrateFromRemote = (remote: import("./supabase").RemoteProgress) => {
    // Bookmark: use remote if local has no bookmark or remote is more recent
    if (remote.bookmark_surah != null) {
      setBookmark((local) => {
        if (!local) {
          return {
            surah: remote.bookmark_surah!,
            ayah: remote.bookmark_ayah ?? 1,
            page: remote.bookmark_page ?? 1,
            juz: remote.bookmark_juz ?? 1,
            lastRead: remote.bookmark_last_read ?? new Date().toISOString(),
          };
        }
        // Keep whichever was read more recently
        const localDate = new Date(local.lastRead).getTime();
        const remoteDate = remote.bookmark_last_read
          ? new Date(remote.bookmark_last_read).getTime()
          : 0;
        return remoteDate > localDate
          ? {
              surah: remote.bookmark_surah!,
              ayah: remote.bookmark_ayah ?? 1,
              page: remote.bookmark_page ?? 1,
              juz: remote.bookmark_juz ?? 1,
              lastRead: remote.bookmark_last_read ?? local.lastRead,
            }
          : local;
      });
    }
    // Streak: take whichever is higher
    setStreak((local) => ({
      current: Math.max(local.current, remote.streak_current ?? 0),
      longest: Math.max(local.longest, remote.streak_longest ?? 0),
      lastReadDate: remote.streak_last_date ?? local.lastReadDate,
      history: Array.from(
        new Set([...local.history, ...(remote.streak_history ?? [])]),
      ),
    }));
    // Noor mood: take highest (most earned)
    setNoor((local) => ({
      ...local,
      moodScore: Math.max(local.moodScore, remote.mood_score ?? 0),
    }));
    // Sadaqah: take highest
    setSadaqah((local) => ({
      meals: Math.max(local.meals, remote.sadaqah_meals ?? 0),
      completedJuz: Array.from(
        new Set([...local.completedJuz, ...(remote.completed_juz ?? [])]),
      ),
    }));
    // CompletedJuz: merge
    setCompletedJuz((local) =>
      Array.from(new Set([...local, ...(remote.completed_juz ?? [])])),
    );
  };

  if (!isLoaded) return null;

  return (
    <AppContext.Provider
      value={{
        bookmark,
        pinnedBookmark,
        streak,
        completedJuz,
        sadaqah,
        noor,
        updateBookmark,
        updatePinnedBookmark,
        adjustNoorScore,
        markPageRead,
        markJuzCompleted,
        evaluateStreak,
        hydrateFromRemote,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within a AppProvider");
  }
  return context;
}
