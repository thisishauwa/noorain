import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../lib/authContext";

const SLIDES = [
  {
    title: "نورين",
    text: "Meet your Quran companion.\nRead, reflect, and grow your daily habit.",
    img: "/noor/Waving.png",
    bg: "#EEF4FA",
    cloud: "#DEEAF3",
  },
  {
    title: "Stay on track",
    text: "I'll be with you every day to help you build a consistent reading habit.",
    img: "/noor/Excited_Childlike.png",
    bg: "#FFF0F4",
    cloud: "#FCE1E8",
  },
  {
    title: "Real impact",
    text: "For every milestone you reach, we donate to charity in your name.",
    img: "/noor/Hugs.png",
    bg: "#F0F7F4",
    cloud: "#E1EFE7",
  },
];

const DECO = [
  { emoji: "✦", x: "12%", y: "18%", size: 28, delay: 0, dur: 3.2 },
  { emoji: "✦", x: "82%", y: "22%", size: 20, delay: 0.6, dur: 2.8 },
  { emoji: "☽", x: "78%", y: "8%", size: 32, delay: 0.8, dur: 4.0 },
  { emoji: "✦", x: "15%", y: "65%", size: 18, delay: 1.1, dur: 3.6 },
  { emoji: "✦", x: "85%", y: "75%", size: 24, delay: 0.3, dur: 2.5 },
];

export function Landing() {
  const { login, continueAsGuest, isConnecting } = useAuth();
  const [showStory, setShowStory] = useState(false);
  const [slide, setSlide] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showStory) return;
    function onDown(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node))
        setShowStory(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showStory]);

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-white gap-5 px-6">
        <motion.img
          src="/noor/Excited_Childlike.png"
          alt="Noorain"
          className="w-36 h-36 object-contain drop-shadow-xl"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-mondwest text-2xl text-gray-800">Connecting…</p>
          <p className="text-sm font-bold text-gray-400 font-selfmodern">
            Just a moment
          </p>
        </div>
        <div className="w-8 h-8 border-[3px] border-[#1CB0F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const current = SLIDES[slide];

  return (
    <div className="flex flex-col h-dvh bg-white font-selfmodern relative overflow-hidden px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="relative flex flex-col items-center h-full max-w-sm mx-auto w-full justify-between gap-4">
        {/* Character Container (~2/3 screen) */}
        <motion.div
          animate={{ backgroundColor: current.bg }}
          transition={{ duration: 0.5 }}
          className="w-full flex-[1.6] rounded-[2.5rem] relative overflow-hidden flex items-end justify-center pt-8"
        >
          {/* Deco Clouds */}
          <motion.div
            animate={{ backgroundColor: current.cloud }}
            transition={{ duration: 0.5 }}
            className="absolute top-[18%] left-[10%] w-28 h-8 rounded-full"
          />
          <motion.div
            animate={{ backgroundColor: current.cloud }}
            transition={{ duration: 0.5 }}
            className="absolute top-[28%] left-[32%] w-16 h-5 rounded-full"
          />

          {/* Character */}
          <AnimatePresence mode="wait">
            <motion.img
              key={slide}
              src={current.img}
              alt="Noorain"
              className="w-full h-full object-contain relative z-10 scale-[1.25] origin-bottom mb-2"
              initial={{ opacity: 0, x: 20, scale: 1.15 }}
              animate={{ opacity: 1, x: 0, scale: 1.25 }}
              exit={{ opacity: 0, x: -20, scale: 1.15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </AnimatePresence>
        </motion.div>

        {/* Carousel Dots */}
        <div className="flex items-center justify-center gap-2 my-1 w-full">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === slide ? "w-6 bg-[#1CB0F6]" : "w-2.5 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Name + tagline */}
        <div className="flex flex-col items-center gap-3 shrink-0 mb-2 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="relative flex items-center gap-1.5"
                ref={popoverRef}
              >
                <h1 className="font-mondwest text-4xl text-gray-900 tracking-tight leading-none pt-1">
                  {current.title}
                </h1>
                {slide === 0 && (
                  <button
                    onClick={() => setShowStory((v) => !v)}
                    className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors shrink-0"
                    aria-label="About Noorain"
                  >
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                      <circle
                        cx="7"
                        cy="7"
                        r="6.5"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      />
                      <rect
                        x="6.3"
                        y="6"
                        width="1.4"
                        height="4.2"
                        rx="0.7"
                        fill="currentColor"
                      />
                      <circle cx="7" cy="3.8" r="0.85" fill="currentColor" />
                    </svg>
                  </button>
                )}

                {/* Polaroid popover */}
                <AnimatePresence>
                  {showStory && slide === 0 && (
                    <motion.div
                      className="absolute bottom-full mb-3 left-[60%] -translate-x-1/2 w-72 bg-white rounded-2xl p-4 shadow-2xl z-50 border border-gray-100"
                      initial={{ opacity: 0, scale: 0.88, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.88, y: 8 }}
                      transition={{
                        type: "spring",
                        damping: 22,
                        stiffness: 320,
                      }}
                    >
                      <div className="absolute bottom-[-9px] left-[55%] -translate-x-1/2 w-4 h-4 bg-white border-b-[1.5px] border-r-[1.5px] border-gray-100 rotate-45" />
                      <div className="relative flex justify-center items-end h-36 mb-3">
                        <div
                          className="absolute bg-white p-2 pb-6 shadow-md border border-gray-100 w-28"
                          style={{
                            transform: "rotate(-6deg) translate(-30px, 4px)",
                            zIndex: 1,
                          }}
                        >
                          <div className="w-full aspect-square bg-gray-200 rounded-sm" />
                        </div>
                        <div
                          className="absolute bg-white p-2 pb-6 shadow-md border border-gray-100 w-28"
                          style={{
                            transform: "rotate(4deg) translate(28px, 0px)",
                            zIndex: 2,
                          }}
                        >
                          <div className="w-full aspect-square bg-gray-200 rounded-sm" />
                        </div>
                        <div
                          className="absolute bg-white p-2 pb-6 shadow-lg border border-gray-100 w-28"
                          style={{
                            transform: "rotate(-1deg) translate(0px, -6px)",
                            zIndex: 3,
                          }}
                        >
                          <div className="w-full aspect-square bg-gray-200 rounded-sm" />
                        </div>
                      </div>
                      <p className="text-[14px] text-gray-600 text-center leading-relaxed font-medium font-selfmodern">
                        This is my cat Noorain. He passed away shortly before
                        his third birthday. I miss him every day — so I built
                        this in his memory.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <p className="text-[19px] text-gray-500 font-bold text-center leading-snug whitespace-pre-line px-2 font-selfmodern">
                {current.text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Buttons */}
        <motion.div
          className="flex flex-col gap-3 w-full shrink-0 mt-2 font-selfmodern"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.38 }}
        >
          <button
            onClick={() => login()}
            className="w-full bg-[#1CB0F6] text-white font-bold text-[18px] rounded-2xl py-4 border-b-4 border-[#0e9fd8] active:border-b-0 active:translate-y-[2px] transition-transform flex items-center justify-center gap-2.5"
          >
            <QFLogo />
            Continue with Quran.com
          </button>
          <button
            onClick={continueAsGuest}
            className="w-full bg-gray-100 text-gray-500 font-bold text-[17px] rounded-2xl py-3.5 hover:bg-gray-200 transition-colors"
          >
            Read without an account
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function QFLogo() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 40 40"
      fill="none"
      className="shrink-0"
    >
      <circle cx="20" cy="20" r="20" fill="white" fillOpacity="0.25" />
      <text
        x="20"
        y="26"
        textAnchor="middle"
        fontSize="18"
        fontWeight="bold"
        fill="white"
        fontFamily="serif"
      >
        ق
      </text>
    </svg>
  );
}
