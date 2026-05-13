import { motion, AnimatePresence } from "motion/react";
import { getNoorMood } from "../lib/noor";

interface Props {
  moodScore: number;
}

export function NoorCharacter({ moodScore }: Props) {
  const moodInfo = getNoorMood(moodScore);

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <AnimatePresence mode="wait">
        <motion.img
          key={moodInfo.asset}
          src={`/newcharacters/${moodInfo.asset}`}
          alt={`Noorain is feeling ${moodInfo.mood}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full h-full object-contain select-none pointer-events-none origin-center"
          draggable={false}
        />
      </AnimatePresence>
    </div>
  );
}
