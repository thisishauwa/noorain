import React, { createContext, useContext, useRef } from "react";
import { syncReadingSession, syncActivityDay, syncBookmark } from "./auth";

interface AuthState {
  /** Call when current visible Ayah changes — debounced */
  pushReadingSession: (chapter: number, verse: number) => void;
  /** Call when session ends — credits streaks & goals */
  flushActivityDay: (ranges: string, seconds: number) => void;
  /** Sync reading bookmark to cloud */
  pushBookmark: (chapter: number, verse: number) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const readingDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushReadingSession = (chapter: number, verse: number) => {
    if (readingDebounce.current) clearTimeout(readingDebounce.current);
    readingDebounce.current = setTimeout(() => {
      syncReadingSession(chapter, verse);
    }, 2000);
  };

  const flushActivityDay = (ranges: string, seconds: number) => {
    if (ranges) syncActivityDay(ranges, seconds);
  };

  const pushBookmark = (chapter: number, verse: number) => {
    syncBookmark(chapter, verse);
  };

  return (
    <AuthContext.Provider
      value={{ pushReadingSession, flushActivityDay, pushBookmark }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
