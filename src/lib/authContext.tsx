import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { syncReadingSession, syncActivityDay, syncBookmark } from "./auth";
import {
  initiateLogin,
  exchangeCallback,
  parseIdToken,
  saveTokens,
  loadSavedSession,
  clearTokens,
  setGuestMode,
  isGuestMode,
  type QFUser,
} from "./oauth";

export type { QFUser };

interface AuthState {
  user: QFUser | null;
  accessToken: string | null;
  isConnecting: boolean;
  isReady: boolean;
  isGuest: boolean;
  login: () => Promise<void>;
  continueAsGuest: () => void;
  logout: () => void;
  pushReadingSession: (chapter: number, verse: number) => void;
  flushActivityDay: (ranges: string, seconds: number) => void;
  pushBookmark: (chapter: number, verse: number) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<QFUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isGuest, setIsGuest] = useState(isGuestMode);
  const readingDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (code && state) {
      setIsConnecting(true);
      window.history.replaceState({}, "", window.location.pathname);
      exchangeCallback(code, state)
        .then((tokens) => {
          if (tokens) {
            saveTokens(tokens);
            setAccessToken(tokens.accessToken);
            if (tokens.idToken) {
              const decoded = parseIdToken(tokens.idToken);
              if (decoded) setUser(decoded);
            }
          }
        })
        .finally(() => {
          setIsConnecting(false);
          setIsReady(true);
        });
      return;
    }

    const saved = loadSavedSession();
    if (saved) setAccessToken(saved.accessToken);
    setIsReady(true);
  }, []);

  const login = useCallback(async () => {
    await initiateLogin();
  }, []);

  const continueAsGuest = useCallback(() => {
    setGuestMode(true);
    setIsGuest(true);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setGuestMode(false);
    setIsGuest(false);
    setAccessToken(null);
    setUser(null);
  }, []);

  const pushReadingSession = useCallback(
    (chapter: number, verse: number) => {
      if (readingDebounce.current) clearTimeout(readingDebounce.current);
      readingDebounce.current = setTimeout(() => {
        syncReadingSession(chapter, verse, accessToken);
      }, 2000);
    },
    [accessToken],
  );

  const flushActivityDay = useCallback(
    (ranges: string, seconds: number) => {
      if (ranges) syncActivityDay(ranges, seconds, accessToken);
    },
    [accessToken],
  );

  const pushBookmark = useCallback(
    (chapter: number, verse: number) => {
      syncBookmark(chapter, verse, accessToken);
    },
    [accessToken],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isConnecting,
        isReady,
        isGuest,
        login,
        continueAsGuest,
        logout,
        pushReadingSession,
        flushActivityDay,
        pushBookmark,
      }}
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

export { isGuestMode };
