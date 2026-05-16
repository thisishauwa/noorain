/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { AppProvider, useAppContext } from "./lib/store";
import { AuthProvider, useAuth } from "./lib/authContext";
import { Home } from "./screens/Home";
import { Browser } from "./screens/Browser";
import { Reader } from "./screens/Reader";
import { Landing } from "./screens/Landing";
import { ProgressSync } from "./components/ProgressSync";

function MainApp() {
  const { streak, evaluateStreak, bookmark } = useAppContext();
  const { accessToken, isReady, isConnecting, isGuest } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<
    "home" | "browser" | "reader"
  >("home");
  const [targetPage, setTargetPage] = useState<number | null>(null);
  const [readerBackDest, setReaderBackDest] = useState<"home" | "browser">(
    "home",
  );

  const navigateTo = (screen: "home" | "browser" | "reader") => {
    if (screen === "reader") {
      setReaderBackDest(currentScreen as "home" | "browser");
    }
    setCurrentScreen(screen);
  };

  useEffect(() => {
    evaluateStreak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  if (!isReady || isConnecting) {
    return <Landing />;
  }

  if (!accessToken && !isGuest) {
    return <Landing />;
  }

  return (
    <div className="min-h-dvh bg-white flex justify-center font-sans antialiased text-gray-800">
      <div className="w-full relative overflow-x-hidden flex flex-col">
        <ProgressSync />
        {currentScreen === "home" && <Home onNavigate={(s) => navigateTo(s)} />}
        {currentScreen === "browser" && (
          <Browser
            onNavigate={(s) => navigateTo(s)}
            onOpenPage={setTargetPage}
          />
        )}
        {currentScreen === "reader" && (
          <Reader
            onNavigate={(s) => navigateTo(s)}
            initialPage={targetPage ?? bookmark?.page ?? 1}
            backDest={readerBackDest}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </AuthProvider>
  );
}
