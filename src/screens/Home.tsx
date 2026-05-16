import { useAppContext } from "../lib/store";
import { getNoorMood } from "../lib/noor";
import { NoorCharacter } from "../components/NoorCharacter";
import { SadaqahModal } from "../components/SadaqahModal";
import { motion, AnimatePresence } from "motion/react";
import { Flash, InfoCircle, Heart, CloseCircle } from "iconsax-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/authContext";
import { initiateLogin } from "../lib/oauth";
import { fetchWeeklyLeaderboard, LeaderboardEntry } from "../lib/supabase";

export function Home({
  onNavigate,
}: {
  onNavigate: (screen: "home" | "browser" | "reader") => void;
}) {
  const { streak, sadaqah, noor, bookmark } = useAppContext();
  const { logout, user, isGuest } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? user?.preferred_username ?? null;
  const initial = firstName?.[0]?.toUpperCase() ?? null;

  const [showSadaqah, setShowSadaqah] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const moodInfo = getNoorMood(noor.moodScore);
  const prevMealsRef = useRef(sadaqah.meals);

  // Load leaderboard on mount (authenticated only)
  useEffect(() => {
    if (isGuest) return;
    fetchWeeklyLeaderboard().then((data) => {
      setLeaderboard(data);
      if (user?.sub) {
        const rank = data.findIndex((e) => e.user_id === user.sub);
        setUserRank(rank === -1 ? null : rank + 1);
      }
    });
  }, [user?.sub, isGuest]);

  useEffect(() => {
    if (sadaqah.meals > prevMealsRef.current) {
      prevMealsRef.current = sadaqah.meals;
      setShowSadaqah(true);
    }
  }, [sadaqah.meals]);

  const daysUntilFriday = (() => {
    const d = (5 - new Date().getDay() + 7) % 7;
    if (d === 0) return "today";
    if (d === 1) return "tmrw";
    return `${d}d`;
  })();

  const hasReadToday = (() => {
    if (!streak.lastReadDate) return false;
    const last = new Date(streak.lastReadDate);
    const now = new Date();
    return (
      last.getFullYear() === now.getFullYear() &&
      last.getMonth() === now.getMonth() &&
      last.getDate() === now.getDate()
    );
  })();

  const getNoorSpeech = () => {
    if (isGuest) {
      const hour = new Date().getHours();
      if (hour >= 21) return "It's late — may your reading bring you peace tonight 🌙";
      if (hour >= 18) return "Welcome, friend. I'm happy you're here this evening 🌿";
      if (hour >= 12) return "Alhamdulillah — glad you stopped by. Read at your own pace 🤍";
      return "Ahlan wa sahlan! I'm happy you're here. Dive in whenever you're ready 🌟";
    }

    const hour = new Date().getHours();
    const name = firstName ? `, ${firstName}` : "";

    if (streak.current === 0 && streak.lastReadDate) {
      const days = Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(streak.lastReadDate).getTime()) /
            (1000 * 3600 * 24),
        ),
      );
      return `${firstName ? firstName + ", " : ""}hungry kids haven't eaten in ${days} day${days !== 1 ? "s" : ""}… please come back 😢`;
    }

    if (hasReadToday) {
      if (streak.current > 3) {
        const d = (5 - new Date().getDay() + 7) % 7;
        if (d === 0) return `Today is donation day${name}! You made it happen.`;
        return `${d} day${d !== 1 ? "s" : ""} till I donate — keep your streak!`;
      }
      return moodInfo.messageAfter;
    }

    if (hour >= 21) return `${firstName ? firstName + " — p" : "P"}lease… it's almost midnight. One page. That's all I need. 🌙`;
    if (hour >= 18) return `Evening already${name}. I've been waiting all day — will you read with me tonight?`;
    if (hour >= 12) return `Afternoon. Still time${name}. ${moodInfo.message}`;
    return firstName ? `${moodInfo.message}` : moodInfo.message;
  };

  const isMorning = new Date().getHours() >= 6 && new Date().getHours() < 18;
  const bgImage = isMorning
    ? "url('/newcharacters/bgimgmorning.png')"
    : "url('/newcharacters/bgimgnight.png')";

  return (
    <div className="flex flex-col h-dvh bg-white overflow-hidden font-sans relative">

      {/* ── Top Bar ── */}
      <header className="flex flex-col gap-3 px-4 py-4 md:py-5 max-w-2xl mx-auto w-full pt-[max(1rem,env(safe-area-inset-top))]">

        {/* Row 1: streak (left) + greeting + profile icon (right) */}
        <div className="flex justify-between items-center w-full mt-2">

          {/* Left: streak pill (hidden for guests) */}
          {!isGuest ? (
            <div className="h-9 flex items-center gap-1.5 bg-orange-50 border-2 border-orange-200 rounded-full px-2.5">
              <Flash size="16" color="#FF9600" variant="Bold" />
              <span className="text-xs font-extrabold text-[#FF9600]">{streak.current}</span>
            </div>
          ) : (
            <div className="h-9 flex items-center gap-1.5 bg-gray-100 rounded-full px-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Guest</span>
            </div>
          )}

          {/* Right: greeting + profile avatar */}
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-end">
              <h1 className="text-[18px] sm:text-xl md:text-2xl font-display text-gray-900 leading-none">
                {isGuest ? "Ahlan wa sahlan" : `Assalam Alaikum${firstName ? `, ${firstName}` : ""}`}
              </h1>
            </div>
            <button
              id="profile-avatar-btn"
              onClick={() => setShowProfile(true)}
              aria-label="Open profile"
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-extrabold text-sm shadow-sm border-2 border-white ring-2 ring-gray-200 hover:ring-[#1CB0F6] transition-all"
              style={{
                background: isGuest
                  ? "#F3F4F6"
                  : "linear-gradient(135deg, #1CB0F6, #0088CC)",
              }}
            >
              {isGuest ? (
                <span className="text-gray-400 text-lg leading-none">👤</span>
              ) : (
                <span className="text-white">{initial ?? "?"}</span>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: progress bar (auth) or guest banner */}
        {!isGuest ? (
          <div className="flex flex-col w-full gap-2">
            <div className="flex justify-between items-center text-[12px] font-extrabold text-gray-400 uppercase tracking-widest">
              <button
                onClick={() => setShowInfo(true)}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                NOORAIN'S HAPPINESS
                <InfoCircle size="14" color="#a3a3a3" variant="Outline" />
              </button>
              <span
                className={
                  noor.moodScore >= 80
                    ? "text-[#58CC02]"
                    : noor.moodScore >= 50
                      ? "text-[#1CB0F6]"
                      : "text-gray-400"
                }
              >
                {noor.moodScore >= 80
                  ? `${noor.moodScore}% · ${daysUntilFriday}`
                  : noor.moodScore >= 50
                    ? `${noor.moodScore}% · fri ${daysUntilFriday}`
                    : `${noor.moodScore}% · read more`}
              </span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full relative overflow-hidden">
              <motion.div
                className="absolute left-0 top-0 bottom-0 bg-[#58CC02] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${noor.moodScore}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <div className="absolute top-1.5 left-3 right-3 h-1 bg-white/30 rounded-full" />
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-sm">📖</span>
            <p className="text-xs font-bold text-amber-700 leading-snug">
              Reading as a guest — nothing is saved.{" "}
              <button
                onClick={() => setShowProfile(true)}
                className="underline hover:no-underline"
              >
                Sign in
              </button>{" "}
              to track your journey.
            </p>
          </div>
        )}
      </header>

      {/* ── Weekly Leaderboard Strip (auth only) ── */}
      {!isGuest && leaderboard.length > 0 && (
        <section className="max-w-2xl mx-auto w-full px-4 mb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 whitespace-nowrap mr-1 shrink-0">
              This week
            </p>
            {leaderboard.slice(0, 5).map((entry, i) => {
              const medals = ["🥇", "🥈", "🥉"];
              const isMe = user?.sub === entry.user_id;
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 shrink-0 ${
                    isMe ? "border-[#1CB0F6] bg-[#EAF7FF]" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <span className="text-sm leading-none">{medals[i] ?? `#${i + 1}`}</span>
                  <span className={`text-xs font-extrabold ${isMe ? "text-[#1CB0F6]" : "text-gray-700"}`}>
                    {isMe ? "You" : entry.user_name.split(" ")[0]}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">{entry.total_score}pts</span>
                </div>
              );
            })}
            {userRank !== null && userRank > 5 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[#1CB0F6] bg-[#EAF7FF] shrink-0">
                <span className="text-xs font-extrabold text-[#1CB0F6]">You #{userRank}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4 md:px-0 min-h-0">
        <div
          className="flex flex-col items-center justify-end w-full h-full max-h-[600px] relative bg-cover bg-bottom bg-no-repeat rounded-3xl pb-6 md:pb-8 px-4 md:px-8 overflow-hidden"
          style={{ backgroundImage: bgImage }}
        >
          {/* Speech Bubble */}
          <div className="relative inline-block bg-white border-2 border-gray-200 border-b-4 rounded-2xl p-4 md:p-5 z-20 text-center shadow-lg mb-8 md:mb-12 max-w-[85%] md:max-w-sm mx-auto">
            <div className="absolute bottom-[-11px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-4 border-r-4 border-gray-200 rotate-45 rounded-br-[3px]" />
            <span className="text-base md:text-[17px] font-bold text-gray-700 leading-snug">
              "{getNoorSpeech()}"
            </span>
          </div>

          {/* Character */}
          <div className="w-[52vw] max-w-[260px] md:max-w-[220px] aspect-square shrink-0 relative z-10 overflow-visible translate-y-[-20%]">
            <NoorCharacter moodScore={noor.moodScore} />
          </div>
        </div>
      </main>

      {/* ── Footer CTA ── */}
      <footer className="w-full p-4 md:p-8 mt-auto pb-safe">
        <div className="max-w-2xl mx-auto w-full flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-4">
          <button
            onClick={() => onNavigate("browser")}
            className="btn-duo-secondary flex-1"
          >
            Browse Surahs
          </button>
          <button
            onClick={() => onNavigate("reader")}
            className="btn-duo-primary flex-2"
          >
            {isGuest ? "Start Reading" : bookmark ? "Continue Reading" : "Read with Noorain"}
          </button>
        </div>
      </footer>

      {/* ── Sadaqah modal (auth only) ── */}
      {!isGuest && (
        <SadaqahModal
          show={showSadaqah}
          meals={sadaqah.meals}
          onClose={() => setShowSadaqah(false)}
        />
      )}

      {/* ── Happiness Info Modal ── */}
      <AnimatePresence>
        {showInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfo(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl"
            >
              <h3 className="font-display text-2xl mb-3 text-gray-800">Noorain's Happiness</h3>
              <p className="text-gray-600 font-medium leading-relaxed mb-4">
                Keep Noorain happy and every Friday, the Hawasleman Fund will
                make a donation to a partner charity on your behalf — the
                happier he is, the more he gives. Charity partnerships are
                launching soon in sha' Allah.
              </p>
              <p className="text-[11px] text-gray-400 font-extrabold uppercase tracking-widest mb-6">
                Hawasleman Fund · Sadaqah Program
              </p>
              <button onClick={() => setShowInfo(false)} className="btn-duo-primary w-full">
                Got it!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Profile / Settings Drawer ── */}
      <AnimatePresence>
        {showProfile && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfile(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

              {/* Close */}
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <CloseCircle size="24" variant="Bold" color="#d1d5db" />
              </button>

              {isGuest ? (
                /* ── Guest panel ── */
                <div className="flex flex-col items-center gap-4 pt-2">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl">👤</div>
                  <div className="text-center">
                    <h3 className="font-display text-xl text-gray-800">You're reading as a guest</h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      Nothing is being saved. Sign in with your Quran.com account
                      to track streaks, earn sadaqah, and join the weekly quiz leaderboard.
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowProfile(false); initiateLogin(); }}
                    className="btn-duo-primary w-full"
                  >
                    Sign in with Quran.com
                  </button>
                  <button
                    onClick={() => setShowProfile(false)}
                    className="btn-duo-secondary w-full"
                  >
                    Continue as guest
                  </button>
                </div>
              ) : (
                /* ── Authenticated panel ── */
                <div className="flex flex-col gap-5">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-extrabold text-white shrink-0"
                      style={{ background: "linear-gradient(135deg, #1CB0F6, #0088CC)" }}
                    >
                      {initial ?? "?"}
                    </div>
                    <div>
                      <p className="font-display text-lg text-gray-800 leading-tight">{user?.name ?? "—"}</p>
                      <p className="text-xs text-gray-400 font-medium">{user?.email ?? user?.preferred_username ?? "Quran Foundation"}</p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center gap-1 bg-orange-50 rounded-2xl py-3 border border-orange-100">
                      <Flash size="20" color="#FF9600" variant="Bold" />
                      <span className="text-lg font-extrabold text-[#FF9600]">{streak.current}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Streak</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 bg-red-50 rounded-2xl py-3 border border-red-100">
                      <Heart size="20" color="#FF4B4B" variant="Bold" />
                      <span className="text-lg font-extrabold text-[#FF4B4B]">{sadaqah.meals}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Meals</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 bg-blue-50 rounded-2xl py-3 border border-blue-100">
                      <span className="text-lg">🏆</span>
                      <span className="text-lg font-extrabold text-[#1CB0F6]">
                        {userRank ? `#${userRank}` : "—"}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Rank</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-100" />

                  {/* Sign out */}
                  <button
                    onClick={() => { setShowProfile(false); logout(); }}
                    className="w-full py-3 rounded-2xl border-2 border-red-100 text-red-500 font-extrabold text-sm hover:bg-red-50 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
