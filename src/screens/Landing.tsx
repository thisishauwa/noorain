import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../lib/authContext";

const SLIDES = [
  {
    title: "Meet Noorain",
    text: "Your Quran companion. His happiness depends on you.",
    img: "/noor/onboarding%20images/8.png",
    bg: "#FFE8EE",
    cloud: "#FFC5D5",
  },
  {
    title: "He needs you",
    text: "Every page you read, he gets happier. Every day you skip, he dies a little.",
    img: "/noor/onboarding%20images/9.png",
    bg: "#FFE8E3",
    cloud: "#FFC8BF",
  },
  {
    title: "Happy Noorain gives",
    text: "When he's at his happiest, he gives sadaqah in your name, powered by the Hauwa Suleiman Fund. Charity partnerships launching soon.",
    img: "/noor/onboarding%20images/10.png",
    bg: "#FFF4DC",
    cloud: "#FFE4A0",
  },
];

const DECO = [
  { emoji: "✦", x: "12%", y: "18%", size: 28, delay: 0, dur: 3.2 },
  { emoji: "✦", x: "82%", y: "22%", size: 20, delay: 0.6, dur: 2.8 },
  { emoji: "☽", x: "78%", y: "8%", size: 32, delay: 0.8, dur: 4.0 },
  { emoji: "✦", x: "15%", y: "65%", size: 18, delay: 1.1, dur: 3.6 },
  { emoji: "✦", x: "85%", y: "75%", size: 24, delay: 0.3, dur: 2.5 },
];

const CAT_PHOTOS = [
  "/noor/noorain-images/cat1.png",
  "/noor/noorain-images/cat2.png",
  "/noor/noorain-images/cat3.png",
];

export function Landing() {
  const { login, continueAsGuest, isConnecting } = useAuth();
  const [showStory, setShowStory] = useState(false);
  const [slide, setSlide] = useState(0);
  const [catStack, setCatStack] = useState([0, 1, 2]); // index 0 is the front card
  const bringToFront = (photoIdx: number) => {
    setCatStack((prev) => {
      if (prev[0] === photoIdx) return prev;
      return [photoIdx, ...prev.filter((i) => i !== photoIdx)];
    });
  };
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

  useEffect(() => {
    if (showStory) return;
    const interval = setInterval(() => {
      setSlide((s) => (s + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
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
          <p className="font-display text-2xl text-gray-800">Connecting…</p>
          <p className="text-sm font-bold text-gray-400">Just a moment</p>
        </div>
        <div className="w-8 h-8 border-[3px] border-[#1CB0F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const current = SLIDES[slide];

  return (
    <div className="flex flex-col h-dvh bg-white font-sans relative overflow-hidden px-5 md:px-12 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="relative flex flex-col md:flex-row md:items-stretch items-center h-full max-w-5xl mx-auto w-full gap-4 md:gap-12">
        {/* Character Container (~2/3 screen) */}
        <motion.div
          animate={{ backgroundColor: current.bg }}
          transition={{ duration: 0.5 }}
          className="w-full flex-[1.7] md:flex-1 md:h-auto rounded-[2.5rem] relative flex flex-col items-center justify-end overflow-hidden pt-10"
        >
          {/* Info button — fixed top-right, outside animated content */}
          <div ref={popoverRef} className="absolute top-3 right-3 z-20">
            <button
              onClick={() => setShowStory((v) => !v)}
              className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 border-b-4 text-gray-400 font-extrabold hover:bg-gray-50 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center font-display text-[15px]"
              aria-label="About Noorain"
            >
              i
            </button>
            <AnimatePresence>
              {showStory && (
                <motion.div
                  className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl p-4 shadow-2xl border border-gray-100"
                  initial={{ opacity: 0, scale: 0.88, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, y: -6 }}
                  transition={{ type: "spring", damping: 22, stiffness: 320 }}
                >
                  <div className="absolute top-[-9px] right-3 w-4 h-4 bg-white border-t-[1.5px] border-l-[1.5px] border-gray-100 rotate-45" />
                  {/* Interactive stacked polaroids — swipe front photo, or click back photos */}
                  <div className="relative flex justify-center items-center h-44 mb-4 mt-2">
                    {[...catStack].reverse().map((photoIdx) => {
                      const i = catStack.indexOf(photoIdx);
                      const isFront = i === 0;
                      const pos = [
                        { x: 0, y: -4, rotate: -2, zIndex: 3, scale: 1 },
                        { x: 28, y: 6, rotate: 6, zIndex: 2, scale: 0.96 },
                        { x: -28, y: 6, rotate: -8, zIndex: 1, scale: 0.92 },
                      ][i];

                      return (
                        <motion.div
                          key={photoIdx}
                          layout
                          onClick={() => !isFront && bringToFront(photoIdx)}
                          drag={isFront ? "x" : false}
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.6}
                          onDragEnd={(_, info) => {
                            if (isFront && Math.abs(info.offset.x) > 40) {
                              setCatStack((prev) => [
                                ...prev.slice(1),
                                prev[0],
                              ]);
                            }
                          }}
                          animate={pos}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          }}
                          whileHover={
                            isFront ? {} : { scale: pos.scale * 1.05 }
                          }
                          whileDrag={{
                            scale: 1.05,
                            zIndex: 10,
                            rotate: (info) =>
                              info?.offset?.x ? info.offset.x * 0.1 : 0,
                          }}
                          className={`absolute bg-white p-2 pb-6 border border-gray-200 w-28 rounded-sm ${
                            isFront
                              ? "shadow-xl cursor-grab active:cursor-grabbing"
                              : "shadow-md cursor-pointer"
                          }`}
                        >
                          <img
                            src={CAT_PHOTOS[photoIdx]}
                            alt={`Noorain ${photoIdx + 1}`}
                            className="w-full aspect-square object-cover rounded-sm pointer-events-none"
                            draggable={false}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                  <p className="text-[14px] text-gray-600 text-center leading-relaxed font-medium font-sans">
                    This is my cat Noorain. He passed away shortly before his
                    third birthday. I miss him every day. I built this app in
                    his memory.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Deco Clouds (pill shapes) */}
          <motion.div
            animate={{ backgroundColor: current.cloud }}
            transition={{ duration: 0.5 }}
            className="absolute top-[12%] left-[10%] w-32 h-10 rounded-full"
          />
          <motion.div
            animate={{ backgroundColor: current.cloud }}
            transition={{ duration: 0.5 }}
            className="absolute top-[22%] left-[35%] w-20 h-7 rounded-full"
          />

          {/* Character */}
          <AnimatePresence mode="wait">
            <motion.img
              key={slide}
              src={current.img}
              alt="Noorain"
              className="w-[92%] object-contain relative z-10"
              style={{ maxHeight: "85%" }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </AnimatePresence>
        </motion.div>

        {/* Right / bottom content panel */}
        <div className="flex flex-col items-center md:items-start md:justify-center w-full md:flex-1 gap-3 md:gap-6 shrink-0">
          {/* Carousel Dots */}
          <div className="flex items-center justify-center md:justify-start gap-2 w-full">
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
          <div className="flex flex-col items-center md:items-start gap-3 shrink-0 mb-2 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                className="flex flex-col items-center md:items-start gap-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="font-display text-4xl md:text-5xl text-gray-900 tracking-tight leading-none pt-1">
                  {current.title}
                </h1>
                <p className="text-[19px] md:text-[21px] text-gray-500 font-medium text-center md:text-left leading-snug whitespace-pre-line px-2 md:px-0 font-sans">
                  {current.text}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Buttons */}
          <motion.div
            className="flex flex-col gap-3 w-full shrink-0 font-sans"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.38 }}
          >
            <button
              onClick={() => login()}
              className="w-full bg-[#1CB0F6] text-white text-[16px] rounded-2xl py-4 border-b-4 border-[#0e9fd8] active:border-b-0 active:translate-y-[2px] transition-transform flex items-center justify-center gap-2.5"
            >
              Continue with Quran.com
            </button>
            <button
              onClick={continueAsGuest}
              className="w-full bg-gray-100 text-gray-500 text-[15px] rounded-2xl py-3.5 hover:bg-gray-200 transition-colors"
            >
              Read without an account
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
