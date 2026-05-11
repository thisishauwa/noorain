import { useAppContext } from "../lib/store";
import { getNoorMood } from "../lib/noor";
import { NoorCharacter } from "../components/NoorCharacter";
import { SadaqahModal } from "../components/SadaqahModal";
import { motion, AnimatePresence } from "motion/react";
import { Flash, InfoCircle } from "iconsax-react";
import { useState, useEffect, useRef } from "react";

export function Home({
  onNavigate,
}: {
  onNavigate: (screen: "home" | "browser" | "reader") => void;
}) {
  const { streak, sadaqah, noor, bookmark } = useAppContext();
  const [showSadaqah, setShowSadaqah] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const moodInfo = getNoorMood(noor.moodScore);
  const prevMealsRef = useRef(sadaqah.meals);

  useEffect(() => {
    if (sadaqah.meals > prevMealsRef.current) {
      prevMealsRef.current = sadaqah.meals;
      setShowSadaqah(true);
    }
  }, [sadaqah.meals]);

  const daysUntilFriday = (() => {
    const d = (5 - new Date().getDay() + 7) % 7;
    if (d === 0) return "today";
    if (d === 1) return "tomorrow";
    return `in ${d} days`;
  })();

  const getGreetingText = () => {
    if (streak.current === 0)
      return "Noorain hasn't been eating well, he misses you!";
    if (streak.current === 1) return "Let's see how long this lasts.";
    if (streak.current > 7) return "You're on fire! Noorain is thriving.";
    return "Back for more, huh? Let's go.";
  };

  const getNoorSpeech = () => {
    if (streak.current === 0 && streak.lastReadDate) {
      const days = Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(streak.lastReadDate).getTime()) /
            (1000 * 3600 * 24),
        ),
      );
      return `Hungry kids haven't eaten in ${days} day${days !== 1 ? "s" : ""}… please come back 😢`;
    }
    if (streak.current > 3) {
      const d = (5 - new Date().getDay() + 7) % 7;
      if (d === 0) return "Today is donation day! You made it happen.";
      return `${d} day${d !== 1 ? "s" : ""} till I donate, keep your streak!`;
    }
    return moodInfo.message;
  };

  return (
    <div className="flex flex-col min-h-dvh bg-white overflow-hidden font-sans relative">
      {/* ── Top Bar ── */}
      <header className="flex flex-col gap-4 px-4 py-4 md:py-6 max-w-2xl mx-auto w-full pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display text-gray-800 tracking-tight">
              Assalam Alaikum
            </h1>
            <p className="text-sm md:text-base font-bold text-gray-400 mt-0.5">
              {getGreetingText()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-orange-50 border-2 border-orange-200 rounded-full px-3 py-1.5">
              <Flash size="16" color="#FF9600" variant="Bold" />
              <span className="text-sm font-extrabold text-[#FF9600]">
                {streak.current}
              </span>
            </div>
            <div className="flex items-center bg-red-50 border-2 border-red-200 rounded-full px-3 py-1.5">
              <span className="text-xs font-extrabold text-[#FF4B4B]">
                {sadaqah.meals}{" "}
                {sadaqah.meals === 1 ? "meal donated" : "meals donated"}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col w-full gap-2 mt-2">
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
                ? `${noor.moodScore}% · donating ${daysUntilFriday}`
                : noor.moodScore >= 50
                  ? `${noor.moodScore}% · donates ${daysUntilFriday}`
                  : `${noor.moodScore}% · keep reading`}
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
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4 -mt-4">
        <div className="flex flex-col items-center w-full">
          {/* Character */}
          <div className="w-[70vw] max-w-[380px] aspect-square shrink-0 relative z-10 overflow-visible">
            <NoorCharacter moodScore={noor.moodScore} />
          </div>

          {/* Speech Bubble */}
          <div className="relative bg-white border-2 border-gray-200 border-b-4 rounded-2xl p-5 md:p-6 w-full max-w-md -mt-10 md:-mt-14 z-20 text-center">
            {/* Tail pointing UP */}
            <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 border-gray-200 rotate-45"></div>

            <span className="text-[18px] md:text-xl font-bold text-gray-700 leading-snug">
              "{getNoorSpeech()}"
            </span>
          </div>
        </div>
      </main>

      {/* ── Footer CTA ── */}
      <footer className="w-full p-4 md:p-8 mt-auto pb-safe">
        <div className="max-w-2xl mx-auto w-full flex flex-col sm:flex-row gap-4">
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
            {bookmark ? "Continue Reading" : "Read with Noor"}
          </button>
        </div>
        <p className="text-center text-[11px] text-gray-400 font-extrabold uppercase tracking-widest mt-3">
          Keep Noorain happy, he'll donate food every Friday in your name!
        </p>
      </footer>

      <SadaqahModal
        show={showSadaqah}
        meals={sadaqah.meals}
        onClose={() => setShowSadaqah(false)}
      />

      {/* Happiness Info Modal */}
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
              <h3 className="font-display text-2xl mb-3 text-gray-800">
                Noorain's Happiness
              </h3>
              <p className="text-gray-600 font-medium leading-relaxed mb-4">
                Keep Noorain happy and every Friday the Noorain Foundation will
                make a real food donation to charity on your behalf. The happier
                he is, the more he gives.
              </p>
              <p className="text-[11px] text-gray-400 font-extrabold uppercase tracking-widest mb-6">
                Powered by Noorain Foundation · Verified Charity
              </p>
              <button
                onClick={() => setShowInfo(false)}
                className="btn-duo-primary w-full"
              >
                Got it!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
