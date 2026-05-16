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
  streak: Streak;
  completedJuz: number[];
  sadaqah: Sadaqah;
  noor: Noor;
  updateBookmark: (bookmark: Bookmark) => void;
  markPageRead: (page: number, juz: number) => void;
  markJuzCompleted: (juz: number) => void;
  evaluateStreak: () => void;
}

const initialState: Omit<
  AppState,
  "updateBookmark" | "markPageRead" | "markJuzCompleted" | "evaluateStreak"
> = {
  bookmark: null,
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
    load("noorain_streak", setStreak, initialState.streak);
    load("noorain_completed_juz", setCompletedJuz, initialState.completedJuz);
    load("noorain_sadaqah", setSadaqah, initialState.sadaqah);
    load("noorain_noor", setNoor, initialState.noor);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("noorain_bookmark", JSON.stringify(bookmark));
    localStorage.setItem("noorain_streak", JSON.stringify(streak));
    localStorage.setItem("noorain_completed_juz", JSON.stringify(completedJuz));
    localStorage.setItem("noorain_sadaqah", JSON.stringify(sadaqah));
    localStorage.setItem("noorain_noor", JSON.stringify(noor));
  }, [bookmark, streak, completedJuz, sadaqah, noor, isLoaded]);

  const updateBookmark = (newBookmark: Bookmark) => setBookmark(newBookmark);

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

  if (!isLoaded) return null;

  return (
    <AppContext.Provider
      value={{
        bookmark,
        streak,
        completedJuz,
        sadaqah,
        noor,
        updateBookmark,
        markPageRead,
        markJuzCompleted,
        evaluateStreak,
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
