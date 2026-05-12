import { motion } from "motion/react";
import { useAuth } from "../lib/authContext";

export function Landing() {
  const { login, continueAsGuest, isConnecting } = useAuth();

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-[#FBF7EF] gap-5 px-6">
        <motion.img
          src="/noor/Excited_Childlike.png"
          alt="Noorain"
          className="w-40 h-40 object-contain"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-display text-2xl text-gray-800">
            Connecting your account...
          </p>
          <p className="text-sm font-bold text-gray-400">Just a moment</p>
        </div>
        <div className="w-8 h-8 border-[3px] border-[#1CB0F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#FBF7EF] font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[55%] bg-white rounded-b-[60%] pointer-events-none" />

      {/* Content */}
      <div className="relative flex flex-col items-center flex-1 justify-between px-6 py-10 max-w-sm mx-auto w-full pt-[max(2.5rem,env(safe-area-inset-top))]">
        {/* Top: character + branding */}
        <div className="flex flex-col items-center gap-4 mt-4">
          <motion.img
            src="/noor/Waving.png"
            alt="Noorain"
            className="w-52 h-52 object-contain drop-shadow-xl"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />

          <motion.div
            className="flex flex-col items-center gap-1 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <h1 className="font-display text-5xl text-gray-800 tracking-tight leading-none">
              نورين
            </h1>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#1CB0F6] mt-1">
              Noorain · Your Quran Companion
            </p>
          </motion.div>
        </div>

        {/* Middle: speech bubble */}
        <motion.div
          className="relative bg-white border-2 border-gray-200 border-b-4 rounded-2xl px-6 py-5 w-full text-center shadow-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 border-gray-200 rotate-45" />
          <p className="text-[17px] font-bold text-gray-700 leading-snug">
            "As-salamu alaykum! I'm Noorain — let's read the Quran together."
          </p>
        </motion.div>

        {/* Bottom: auth buttons */}
        <motion.div
          className="flex flex-col gap-3 w-full pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <button
            onClick={() => login()}
            className="btn-duo-primary w-full text-[16px] flex items-center justify-center gap-2.5 py-4"
          >
            <QFLogo />
            Continue with Quran.com
          </button>

          <button
            onClick={continueAsGuest}
            className="btn-duo-secondary w-full text-[15px] py-3.5"
          >
            Read without an account
          </button>

          <p className="text-center text-[11px] text-gray-400 font-bold mt-1 leading-relaxed px-2">
            Signing in syncs your streaks, bookmarks & goals across all
            Quran.com apps.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function QFLogo() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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
