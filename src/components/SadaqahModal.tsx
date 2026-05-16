import { motion, AnimatePresence } from "motion/react";

interface Props {
  show: boolean;
  meals: number;
  onClose: () => void;
}

export function SadaqahModal({ show, meals, onClose }: Props) {
  const handleShare = async () => {
    const text = `I've been reading the Qur'an consistently with Noorain. ${meals} sadaqah pledge${meals !== 1 ? "s have" : " has"} built up in my name — powered by the Hauwa Suleiman Fund 🌙\n\nhttps://noorain-app.vercel.app`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text);
      } catch {}
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-6 py-8 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center max-w-sm w-full"
          >
            {/* Arabic dua */}
            <p
              className="font-arabic text-5xl text-[#1CB0F6] mb-8 leading-loose"
              dir="rtl"
            >
              بَارَكَ اللهُ فِيكَ
            </p>

            {/* Noorain character */}
            <motion.img
              src="/newcharacters/Hugs.png"
              alt="Noorain giving hugs"
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-36 h-36 object-contain mb-6 select-none pointer-events-none"
              draggable={false}
            />

            {/* Headline */}
            <h2 className="text-2xl font-black text-gray-900 leading-snug mb-2">
              Your sadaqah is building up.
            </h2>
            <p className="text-gray-500 text-sm font-semibold mb-8 leading-relaxed">
              {meals} sadaqah pledge{meals !== 1 ? "s" : ""} earned through
              your reading — recorded in your name.
            </p>

            {/* Hawasleman Fund card */}
            <div className="w-full card-duo mb-8 overflow-hidden">
              <div className="px-4 py-3 border-b-2 border-gray-100 flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                  Hawasleman Fund
                </p>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1CB0F6]">
                  Coming soon
                </span>
              </div>
              <div className="px-4 py-4 text-left">
                <p className="text-sm font-semibold text-gray-700 leading-relaxed mb-3">
                  The Hawasleman Fund is partnering with registered charities so
                  that every pledge you earn becomes a real donation — food,
                  water, and essentials for those in need.
                </p>
                <p className="text-xs font-bold text-gray-400">
                  Every Friday, pledges convert to donations as partnerships go
                  live. Your reading is already making a difference in sha'
                  Allah.
                </p>
              </div>
            </div>

            {/* Share */}
            <button
              onClick={handleShare}
              className="btn-duo-secondary w-full mb-3"
            >
              Share your sadaqah
            </button>

            {/* Keep reading */}
            <button onClick={onClose} className="btn-duo-primary w-full">
              Keep reading
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
