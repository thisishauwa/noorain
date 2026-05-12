import { motion, AnimatePresence } from "motion/react";

const MOCK_DONORS = [
  { name: "Yusuf A.", city: "London", meals: 3 },
  { name: "Maryam H.", city: "Dubai", meals: 2 },
  { name: "Ibrahim K.", city: "Karachi", meals: 5 },
  { name: "Zainab R.", city: "Cairo", meals: 1 },
];

interface Props {
  show: boolean;
  meals: number;
  onClose: () => void;
}

export function SadaqahModal({ show, meals, onClose }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto"
          style={{ background: "#1CB0F6" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center max-w-sm w-full"
          >
            {/* Arabic dua — leads the moment */}
            <p
              className="font-arabic text-5xl text-white mb-8 leading-loose"
              dir="rtl"
            >
              بَارَكَ اللهُ فِيكَ
            </p>

            {/* Noorain character */}
            <motion.img
              src="/noor/Hugs.png"
              alt="Noorain giving hugs"
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-36 h-36 object-contain mb-6 select-none pointer-events-none"
              draggable={false}
            />

            {/* Headline */}
            <h2 className="text-2xl font-black text-white leading-snug mb-2">
              Noorain donated on your behalf.
            </h2>
            <p className="text-white/60 text-sm font-semibold mb-8 leading-relaxed">
              {meals} meal{meals !== 1 ? "s" : ""} given to children in need, in
              your name.
            </p>

            {/* Donor feed */}
            <div className="w-full rounded-2xl border border-white/20 mb-8 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">
                  Reading with you today
                </p>
              </div>
              {MOCK_DONORS.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 border-b border-white/10 last:border-0"
                >
                  <div className="text-left">
                    <span className="text-sm font-bold text-white">
                      {d.name}
                    </span>
                    <span className="text-xs text-white/40 ml-2">{d.city}</span>
                  </div>
                  <span className="text-xs font-extrabold text-green-300">
                    {d.meals} {d.meals === 1 ? "meal" : "meals"}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer tag */}
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/25 mb-6">
              Powered by Noorain Foundation
            </p>

            {/* CTA */}
            <button
              onClick={onClose}
              className="w-full bg-white text-[#1CB0F6] py-4 rounded-2xl font-black text-base active:scale-[0.98] transition-transform"
            >
              Keep Reading
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
