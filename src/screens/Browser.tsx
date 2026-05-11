import { useState, useEffect } from "react";
import { fetchChapters, Chapter, fetchJuzs, Juz } from "../lib/api";
import { useAppContext } from "../lib/store";
import { Book1, TickCircle, ArrowLeft2 } from "iconsax-react";

export function Browser({
  onNavigate,
  onOpenPage,
}: {
  onNavigate: (s: "home" | "reader") => void;
  onOpenPage: (p: number) => void;
}) {
  const [activeTab, setActiveTab] = useState<"surah" | "juz">("surah");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [juzs, setJuzs] = useState<Juz[]>([]);
  const { completedJuz } = useAppContext();

  useEffect(() => {
    fetchChapters()
      .then((data) => {
        if (data) setChapters(data);
      })
      .catch((err) => {
        console.error("Failed to fetch chapters", err);
      });
  }, []);

  useEffect(() => {
    fetchJuzs()
      .then((data) => {
        if (data) setJuzs(data);
      })
      .catch((err) => {
        console.error("Failed to fetch juzs", err);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-dvh bg-white text-gray-800 font-sans">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl sticky top-0 z-10 border-b-2 border-gray-100 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("home")}
              className="p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft2 size="24" color="#9ca3af" />
            </button>
            <h1 className="text-2xl font-display tracking-tight text-gray-800">
              Index
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mb-2">
            <button
              className={`flex-1 py-3 text-sm font-extrabold uppercase tracking-widest rounded-2xl border-2 transition-all ${activeTab === "surah" ? "bg-blue-50 border-[#1CB0F6] text-[#1CB0F6]" : "bg-white border-gray-200 text-gray-400 border-b-4 active:translate-y-[2px] active:border-b-2"}`}
              onClick={() => setActiveTab("surah")}
            >
              Surahs
            </button>
            <button
              className={`flex-1 py-3 text-sm font-extrabold uppercase tracking-widest rounded-2xl border-2 transition-all ${activeTab === "juz" ? "bg-blue-50 border-[#1CB0F6] text-[#1CB0F6]" : "bg-white border-gray-200 text-gray-400 border-b-4 active:translate-y-[2px] active:border-b-2"}`}
              onClick={() => setActiveTab("juz")}
            >
              Juz
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        {activeTab === "surah" ? (
          <div className="flex flex-col gap-3">
            {chapters.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onOpenPage(c.pages[0]);
                  onNavigate("reader");
                }}
                className="card-duo p-4 flex items-center justify-between active:translate-y-1 active:border-b-2 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-black text-base shrink-0 group-hover:bg-[#1CB0F6] group-hover:text-white transition-colors">
                    {c.id}
                  </div>
                  <div>
                    <div className="font-bold text-lg leading-tight text-gray-800">
                      {c.name_simple}
                    </div>
                    <div className="text-sm text-gray-400 font-bold mt-0.5 uppercase tracking-wider">
                      {c.translated_name.name}
                    </div>
                  </div>
                </div>
                <div className="font-arabic text-2xl text-gray-300 group-hover:text-[#1CB0F6] transition-colors">
                  {c.name_arabic}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {juzs
              .filter(
                (j, i, self) =>
                  self.findIndex((x) => x.juz_number === j.juz_number) === i,
              )
              .map((j) => {
                const isCompleted = completedJuz.includes(j.juz_number);
                return (
                  <button
                    key={j.id}
                    onClick={() => {
                      onOpenPage((j.juz_number - 1) * 20 + 1);
                      onNavigate("reader");
                    }}
                    className={`card-duo p-5 flex flex-col items-center justify-center gap-3 aspect-square text-center active:translate-y-1 active:border-b-2 transition-all ${
                      isCompleted
                        ? "bg-blue-50 border-[#1CB0F6] text-[#1CB0F6]"
                        : "border-gray-200"
                    }`}
                  >
                    {isCompleted ? (
                      <TickCircle size="40" color="#1CB0F6" variant="Bold" />
                    ) : (
                      <Book1 size="40" color="#d1d5db" variant="Outline" />
                    )}
                    <div>
                      <div className="font-black text-xl text-gray-800">
                        Juz {j.juz_number}
                      </div>
                      {isCompleted && (
                        <div className="text-[11px] font-extrabold text-[#1CB0F6] mt-1 uppercase tracking-widest">
                          Done
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
