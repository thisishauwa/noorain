import { useState, useEffect, useRef } from "react";
import {
  fetchVersesByPage,
  Verse,
  fetchChapters,
  Chapter,
  fetchTafsir,
  Tafsir,
  fetchAudio,
} from "../lib/api";
import { useAppContext } from "../lib/store";
import { getNoorMood } from "../lib/noor";
import { useAuth } from "../lib/authContext";
import { generateReflectionQuestions, ReflectionQuestion, summarizeTafsir } from "../lib/gemini";
import { recordQuizScore } from "../lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft2,
  ArrowRight2,
  Book1,
  Play,
  Bookmark,
  MessageText,
  Copy,
  TickSquare,
  More,
  Microphone2,
  ArrowDown2,
  VolumeHigh,
} from "iconsax-react";

const OPTION_LETTERS = ["A", "B", "C", "D"];

export function Reader({
  initialPage = 1,
  onNavigate,
  backDest = "home",
}: {
  initialPage?: number | null;
  onNavigate: (s: "home" | "browser") => void;
  backDest?: "home" | "browser";
}) {
  const [page, setPage] = useState(initialPage || 1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [activeTafsirAyah, setActiveTafsirAyah] = useState<string | null>(null);
  const [tafsirData, setTafsirData] = useState<Tafsir | null>(null);
  const [loadingTafsir, setLoadingTafsir] = useState(false);
  const { markPageRead, updateBookmark, markJuzCompleted, noor, bookmark } =
    useAppContext();
  const { pushReadingSession, flushActivityDay, pushBookmark, accessToken, user } = useAuth();
  const sessionStartRef = useRef(Date.now());
  const visitedRangesRef = useRef<string[]>([]);
  const [reflectionQs, setReflectionQs] = useState<
    [ReflectionQuestion, ReflectionQuestion] | null
  >(null);
  const [reflectionA1, setReflectionA1] = useState<number | null>(null);
  const [reflectionA2, setReflectionA2] = useState<number | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);

  const [goodbyeStep, setGoodbyeStep] = useState<number>(0); // 0 = none, 1 = say goodbye, 2 = waving
  const [playingWordId, setPlayingWordId] = useState<number | null>(null);
  const [playingAyahKey, setPlayingAyahKey] = useState<string | null>(null);
  const [currentlyPlayingAudio, setCurrentlyPlayingAudio] =
    useState<HTMLAudioElement | null>(null);
  const moodInfo = getNoorMood(noor.moodScore);
  const [isMushafMode, setIsMushafMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const initialMoodRef = useRef(noor.moodScore);
  const goodbyeStepRef = useRef(0);
  goodbyeStepRef.current = goodbyeStep;
  const [showSurahPicker, setShowSurahPicker] = useState(false);
  const [playAllActive, setPlayAllActive] = useState(false);
  const playAllRef = useRef(false);
  const answerAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const queueAdvance = (nextStep: number) => {
    if (answerAdvanceRef.current) clearTimeout(answerAdvanceRef.current);
    answerAdvanceRef.current = setTimeout(() => {
      setGoodbyeStep(nextStep);
      answerAdvanceRef.current = null;
    }, 450);
  };

  const handleMenuClick = async (action: string, verse: Verse) => {
    setActiveMenuId(null);
    if (action === "Copy") {
      const text = `${verse.text_uthmani}\n\n${verse.translations?.find((t: any) => t.resource_id === 85)?.text || ""}`;
      await navigator.clipboard.writeText(text);
      showToast("Ayah copied");
    } else if (action === "Bookmark") {
      const [surahId, ayahNum] = verse.verse_key.split(":").map(Number);
      updateBookmark({
        surah: surahId,
        ayah: ayahNum,
        page,
        juz: verse.juz_number,
        lastRead: new Date().toISOString(),
      });
      pushBookmark(surahId, ayahNum);
      showToast("Bookmark updated");
    } else if (action === "Tafsir") {
      setActiveTafsirAyah(verse.verse_key);
    }
  };

  const handlePlayWord = (url: string | null | undefined, wordId: number) => {
    if (!url) return;
    if (currentlyPlayingAudio) {
      currentlyPlayingAudio.pause();
    }
    const audioUrl = url.startsWith("//")
      ? `https:${url}`
      : url.startsWith("http")
        ? url
        : `https://audio.qurancdn.com/${url}`;
    const audio = new Audio(audioUrl);
    setCurrentlyPlayingAudio(audio);
    setPlayingWordId(wordId);

    audio.onended = () => {
      setPlayingWordId(null);
      setCurrentlyPlayingAudio(null);
    };
    audio.onerror = () => {
      console.error("Audio failed to load", audioUrl);
      setPlayingWordId(null);
      setCurrentlyPlayingAudio(null);
      showToast("Audio unavailable");
    };

    audio.play().catch((e) => {
      console.error("Error playing audio", e);
      setPlayingWordId(null);
      showToast("Audio playback failed");
    });
  };

  const handlePlayAyah = async (ayahKey: string, onEnded?: () => void) => {
    const v = verses.find((v) => v.verse_key === ayahKey);
    if (!v) {
      onEnded?.();
      return;
    }
    if (currentlyPlayingAudio) currentlyPlayingAudio.pause();

    let src = v.audio?.url;

    if (!src) {
      setPlayingAyahKey(ayahKey);
      try {
        src = await fetchAudio(7, ayahKey);
      } catch {
        setPlayingAyahKey(null);
        showToast("Audio not available");
        onEnded?.();
        return;
      }
    }

    const audioUrl = src.startsWith("//")
      ? `https:${src}`
      : src.startsWith("http")
        ? src
        : `https://verses.quran.com/${src}`;
    const audio = new Audio(audioUrl);

    setPlayingAyahKey(ayahKey);
    setCurrentlyPlayingAudio(audio);

    audio.onended = () => {
      setPlayingAyahKey(null);
      setCurrentlyPlayingAudio(null);
      onEnded?.();
    };
    audio.onerror = () => {
      setPlayingAyahKey(null);
      setCurrentlyPlayingAudio(null);
      showToast("Failed to load audio");
      onEnded?.();
    };

    audio.play().catch(() => {
      setPlayingAyahKey(null);
      setCurrentlyPlayingAudio(null);
      showToast("Audio playback failed");
      onEnded?.();
    });
  };

  useEffect(() => {
    return () => {
      if (currentlyPlayingAudio) currentlyPlayingAudio.pause();
    };
  }, [currentlyPlayingAudio]);

  useEffect(() => {
    setLoading(true);
    fetchChapters().then((res) => {
      if (res) setChapters(res);
    });

    fetchVersesByPage(page).then((data) => {
      if (data) {
        setVerses(data);
        if (data.length > 0) {
          // Only tracking cloud resume location here, NOT advancing streak/happiness until 'Done for today' is clicked.
          const firstKey = data[0].verse_key;
          const lastKey = data[data.length - 1].verse_key;
          const range = `${firstKey}-${lastKey}`;
          if (!visitedRangesRef.current.includes(range))
            visitedRangesRef.current.push(range);
          const [ch, v] = firstKey.split(":").map(Number);
          pushReadingSession(ch, v);
        }
      }
      setLoading(false);
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [page]);

  useEffect(() => {
    if (activeTafsirAyah) {
      setLoadingTafsir(true);
      setAiSummary(null);
      setLoadingAiSummary(false);
      fetchTafsir(activeTafsirAyah).then((data) => {
        setTafsirData(data);
        setLoadingTafsir(false);
      });
    } else {
      setTafsirData(null);
      setAiSummary(null);
      setLoadingAiSummary(false);
    }
  }, [activeTafsirAyah]);

  useEffect(() => {
    if (goodbyeStep !== 3) {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    const tryStart = () => {
      try {
        recognition.start();
      } catch {}
    };
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      if (goodbyeStepRef.current === 3) setTimeout(tryStart, 400);
    };
    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (e.error !== "aborted" && goodbyeStepRef.current === 3)
        setTimeout(tryStart, 600);
    };
    recognition.onresult = (event: any) => {
      const texts = Array.from(event.results[0]).map((r: any) =>
        r.transcript.toLowerCase(),
      );
      const heard = texts.some(
        (t) =>
          t.includes("salam") ||
          t.includes("salaam") ||
          t.includes("peace") ||
          t.includes("shalom"),
      );
      if (heard) {
        goodbyeStepRef.current = 4;
        setGoodbyeStep(4);
        setTimeout(() => {
          setGoodbyeStep(0);
          onNavigate("home");
        }, 2500);
      }
    };
    recognitionRef.current = recognition;
    tryStart();
    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [goodbyeStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const flushSession = () => {
    const seconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
    const ranges = visitedRangesRef.current.join(",");
    if (ranges) flushActivityDay(ranges, Math.max(seconds, 1));
  };

  const handleDone = () => {
    if (verses.length > 0) {
      const juzNumber = verses[0].juz_number;
      if (juzNumber) markPageRead(page, juzNumber);
    }

    flushSession();
    const surahName = currentChapter?.name_simple ?? "this surah";
    const translations = verses.flatMap(
      (v) => v.translations?.map((t: any) => t.text ?? "") ?? [],
    );
    setReflectionQs(null);
    setReflectionA1(null);
    setReflectionA2(null);
    generateReflectionQuestions(surahName, translations).then(setReflectionQs);
    goodbyeStepRef.current = 1;
    setGoodbyeStep(1);
  };

  const playAll = (index: number = 0) => {
    if (!playAllRef.current || index >= verses.length) {
      playAllRef.current = false;
      setPlayAllActive(false);
      return;
    }
    handlePlayAyah(verses[index].verse_key, () => playAll(index + 1));
  };

  const startPlayAll = () => {
    playAllRef.current = true;
    setPlayAllActive(true);
    playAll(0);
  };

  const stopPlayAll = () => {
    playAllRef.current = false;
    setPlayAllActive(false);
    if (currentlyPlayingAudio) {
      currentlyPlayingAudio.pause();
      setCurrentlyPlayingAudio(null);
      setPlayingAyahKey(null);
    }
  };

  const triggerGoodbyeAnimation = () => {
    goodbyeStepRef.current = 4;
    playAllRef.current = false;
    if (currentlyPlayingAudio) currentlyPlayingAudio.pause();
    setGoodbyeStep(4);
    setTimeout(() => {
      setGoodbyeStep(0);
      onNavigate("home");
    }, 2500);
  };

  const currentChapterId =
    verses.length > 0 ? parseInt(verses[0].verse_key.split(":")[0]) : null;
  const currentChapter =
    currentChapterId != null
      ? chapters.find((c) => c.id === currentChapterId)
      : null;
  const happinessGained = Math.max(0, noor.moodScore - initialMoodRef.current);

  const isMorning = new Date().getHours() >= 6 && new Date().getHours() < 18;
  const bgImage = isMorning
    ? "url('/newcharacters/bgimgmorning.png')"
    : "url('/newcharacters/bgimgnight.png')";

  return (
    <div className="flex flex-col h-dvh bg-white text-gray-800 font-sans relative">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl sticky top-0 z-20 border-b-2 border-gray-100 pt-safe">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <button
            onClick={() => {
              flushSession();
              onNavigate(backDest);
            }}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft2 size="24" color="#9ca3af" />
          </button>

          <button
            onClick={() => setShowSurahPicker(true)}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-1">
              <span className="font-display text-[19px] tracking-tight text-gray-800 leading-tight">
                {currentChapter?.name_simple ?? `Page ${page}`}
              </span>
              <ArrowDown2 size="14" color="#9ca3af" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1CB0F6] mt-0.5">
              Reading with Noorain
            </span>
          </button>

          <button
            onClick={() => setIsMushafMode(!isMushafMode)}
            className={`p-2 -mr-2 rounded-xl transition-colors ${isMushafMode ? "bg-[#1CB0F6] text-white" : "text-gray-400 hover:bg-gray-50 hover:text-[#1CB0F6]"}`}
          >
            <Book1
              size="24"
              color={isMushafMode ? "white" : "currentColor"}
              variant={isMushafMode ? "Bold" : "Outline"}
            />
          </button>
        </div>
      </div>

      {/* Reader Content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-4 py-6 relative pb-[160px] md:pb-6"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400 font-bold gap-4">
            <motion.img
              src={`/newcharacters/${moodInfo.asset}`}
              alt="Loading"
              className="w-20 h-20 opacity-50 grayscale"
              animate={{ y: [0, -15, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <div className="uppercase tracking-widest text-sm">
              Warming up...
            </div>
          </div>
        ) : isMushafMode ? (
          <>
            <div className="flex justify-center mb-4">
              <button
                onClick={playAllActive ? stopPlayAll : startPlayAll}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-sm uppercase tracking-widest border-2 transition-all ${
                  playAllActive
                    ? "bg-[#1CB0F6] border-[#1CB0F6] text-white"
                    : "bg-white border-gray-200 border-b-4 text-[#1CB0F6] active:translate-y-[2px] active:border-b-2"
                }`}
              >
                <VolumeHigh
                  size="20"
                  color={playAllActive ? "white" : "#1CB0F6"}
                  variant={playAllActive ? "Bold" : "Outline"}
                />
                {playAllActive ? "Stop" : "Play Page"}
              </button>
            </div>
            {/* Mushaf page header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">
                {chapters.find(c => c.id === verses[0]?.verse_key?.split(":")[0] as any)?.name_simple ?? ""}
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">
                Page {page}
              </span>
            </div>

            {/* Mushaf body */}
            <div
              className="bg-[#FDFBF5] border border-[#E8DFC8] border-b-4 rounded-2xl px-5 py-6 md:px-8 md:py-10 leading-[2.6] md:leading-[2.8] text-center font-arabic text-xl md:text-2xl overflow-hidden mb-6 shadow-sm"
              dir="rtl"
            >
              {verses.map((verse) => (
                <span
                  key={verse.id}
                  className={`transition-colors ${playingAyahKey === verse.verse_key ? "text-[#1CB0F6]" : "text-gray-800"}`}
                >
                  {verse.words.map((word) => (
                    <span
                      key={word.id}
                      onClick={() =>
                        word.char_type_name !== "end" &&
                        handlePlayWord(word.audio_url, word.id)
                      }
                      className={`inline-block mx-0.5 transition-colors ${word.char_type_name === "end" ? "cursor-default" : "cursor-pointer hover:text-[#1CB0F6]/80"} ${playingWordId === word.id ? "text-[#1CB0F6]" : ""}`}
                    >
                      {word.char_type_name === "end" ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1CB0F6]/10 border border-[#1CB0F6]/25 align-middle mx-1 select-none">
                          <span className="text-[9px] font-extrabold text-[#1CB0F6] leading-none font-sans">
                            {verse.verse_number}
                          </span>
                        </span>
                      ) : (
                        word.text_uthmani
                      )}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-5 mb-6">
            {verses.map((verse, _index) => (
              <div
                key={verse.id}
                className={`card-duo p-5 md:p-6 transition-all ${
                  playingAyahKey === verse.verse_key
                    ? "border-[#1CB0F6] bg-blue-50/50"
                    : bookmark?.surah ===
                          parseInt(verse.verse_key.split(":")[0]) &&
                        bookmark?.ayah ===
                          parseInt(verse.verse_key.split(":")[1])
                      ? "border-[#1CB0F6]/40 bg-[#1CB0F6]/5"
                      : ""
                }`}
              >
                {/* Verse Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-dashed border-gray-100 relative">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-[13px] text-gray-400 uppercase tracking-widest">
                      {chapters.find(
                        (c) => c.id === parseInt(verse.verse_key.split(":")[0]),
                      )?.name_simple || ""}
                      , {verse.verse_key}
                    </div>
                    {bookmark?.surah ===
                      parseInt(verse.verse_key.split(":")[0]) &&
                      bookmark?.ayah ===
                        parseInt(verse.verse_key.split(":")[1]) && (
                        <Bookmark size="14" color="#1CB0F6" variant="Bold" />
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePlayAyah(verse.verse_key)}
                      className={`p-2 transition-colors rounded-full flex items-center justify-center ${playingAyahKey === verse.verse_key ? "bg-[#1CB0F6] text-white" : "text-gray-400 hover:text-[#1CB0F6] hover:bg-[#1CB0F6]/10"}`}
                    >
                      {playingAyahKey === verse.verse_key ? (
                        <div className="w-5 h-5 flex justify-center items-center gap-0.5">
                          <div className="w-1 h-3 bg-white animate-pulse" />
                          <div className="w-1 h-2 bg-white animate-pulse delay-75" />
                          <div className="w-1 h-4 bg-white animate-pulse delay-150" />
                        </div>
                      ) : (
                        <Play size="20" color="currentColor" variant="Bold" />
                      )}
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(
                            activeMenuId === verse.id ? null : verse.id,
                          );
                        }}
                        className={`p-2 transition-colors rounded-full flex items-center justify-center ${activeMenuId === verse.id ? "bg-[#1CB0F6]/10 text-[#1CB0F6]" : "text-gray-400 hover:text-[#1CB0F6] hover:bg-[#1CB0F6]/10"}`}
                      >
                        <More size="20" color="currentColor" />
                      </button>
                      <AnimatePresence>
                        {activeMenuId === verse.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-50 flex flex-col"
                          >
                            <div className="px-3 py-2 text-[11px] font-bold text-gray-400 mb-1 border-b border-gray-100 pb-2.5">
                              Ayah {verse.verse_key}
                            </div>
                            {[
                              { icon: Bookmark, label: "Bookmark" },
                              { icon: MessageText, label: "Tafsir" },
                              { icon: Copy, label: "Copy" },
                            ].map((item, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMenuClick(item.label, verse);
                                }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-bold text-gray-600 transition-colors w-full text-left"
                              >
                                <item.icon
                                  size="18"
                                  color="#9ca3af"
                                  variant="Outline"
                                />
                                {item.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Word by Word */}
                <div className="flex flex-row-reverse flex-wrap gap-x-4 gap-y-8 justify-start leading-loose">
                  {verse.words.map((word, _i) => (
                    <div
                      key={word.id}
                      onClick={() =>
                        word.char_type_name !== "end" &&
                        handlePlayWord(word.audio_url, word.id)
                      }
                      className={`flex flex-col items-center justify-start group text-center relative w-min transition-all ${word.char_type_name === "end" ? "cursor-default" : "cursor-pointer"} ${playingWordId === word.id ? "opacity-50 scale-95" : "opacity-100 hover:scale-105"}`}
                    >
                      {word.char_type_name === "end" ? (
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#1CB0F6]/10 border-2 border-[#1CB0F6]/25 border-b-4 mx-2 mb-3 mt-1 select-none">
                          <span className="text-[11px] font-extrabold text-[#1CB0F6] leading-none">
                            {verse.verse_number}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div
                            className={`font-arabic text-2xl md:text-3xl leading-tight transition-colors mb-2 ${playingWordId === word.id ? "text-[#1CB0F6]" : "text-gray-800 group-hover:text-[#1CB0F6]"}`}
                          >
                            {word.text_uthmani}
                          </div>
                          <div className="text-[12px] md:text-[13px] text-gray-500 font-bold mb-0.5 whitespace-nowrap px-1">
                            {word.transliteration?.text}
                          </div>
                          <div className="text-[10px] md:text-[11px] text-gray-400 whitespace-nowrap px-1">
                            {word.translation?.text}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Ayah Translation */}
                {verse.translations && verse.translations.length > 0 && (
                  <div className="mt-6 pt-5 border-t-2 border-dashed border-gray-100 flex flex-col gap-4 text-left">
                    {verse.translations.find(
                      (t: any) => t.resource_id === 57,
                    ) && (
                      <div className="flex flex-col gap-1">
                        <div className="text-[14px] md:text-[15px] font-semibold leading-relaxed text-gray-500">
                          <span
                            dangerouslySetInnerHTML={{
                              __html:
                                verse.translations.find(
                                  (t: any) => t.resource_id === 57,
                                )?.text || "",
                            }}
                          />
                        </div>
                        <div className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">
                          Transliteration
                        </div>
                      </div>
                    )}
                    {verse.translations.find(
                      (t: any) => t.resource_id === 85,
                    ) && (
                      <div className="flex flex-col gap-1">
                        <div className="text-[14px] md:text-[15px] font-medium leading-relaxed text-gray-700">
                          <span
                            dangerouslySetInnerHTML={{
                              __html:
                                verse.translations.find(
                                  (t: any) => t.resource_id === 85,
                                )?.text || "",
                            }}
                          />
                        </div>
                        <div className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">
                          Translation
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Bar — fixed bottom on mobile, inline on md+ */}
      {!loading && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 pb-safe px-4 pt-4 z-10 md:relative md:bottom-auto md:left-auto md:right-auto md:bg-transparent md:backdrop-blur-none md:border-0 md:pb-8 md:pt-6">
          <div className="max-w-2xl mx-auto w-full flex gap-2 sm:gap-3 items-center">
            {/* Back */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-duo-secondary px-4 shrink-0 text-sm font-extrabold"
              aria-label="Previous page"
            >
              Back
            </button>
            {/* Done for today — smaller, centred */}
            <button
              onClick={handleDone}
              className="btn-duo-primary flex-1 whitespace-nowrap text-sm"
            >
              <TickSquare size="18" color="white" variant="Bold" />
              Done for today
            </button>
            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(604, p + 1))}
              className="btn-duo-secondary px-4 shrink-0 text-sm font-extrabold"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Done Animation Overlay */}
      <AnimatePresence>
        {goodbyeStep > 0 && (
          <motion.div
            key="goodbye-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-8"
          >
            <div 
              className="w-full h-full md:max-h-[850px] max-w-2xl mx-auto md:rounded-3xl flex flex-col items-center justify-start px-4 md:px-8 pb-0 overflow-hidden bg-white relative"
            >
            {/* ── Skip / close button ── */}
              <button
                onClick={() => setGoodbyeStep(0)}
                className="absolute top-4 right-4 z-30 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-full hover:bg-gray-100"
              >
                Skip →
              </button>

            {/* ── Top: Question + Options ── */}
              <div className="flex-1 w-full flex flex-col justify-end items-center px-4 md:px-8 pt-6 pb-4 z-20 min-h-0">
                <motion.div
                  key={`step-${goodbyeStep}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-sm flex flex-col items-center gap-3"
                >
                  {/* Speech bubble */}
                  <div className="relative bg-white border-2 border-gray-200 border-b-4 rounded-2xl px-4 py-3 w-full text-center">
                    <div className="absolute bottom-[-11px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-4 border-r-4 border-gray-200 rotate-45 rounded-br-[3px]"></div>
                    <p className="text-sm font-bold text-gray-800 leading-snug">
                      {goodbyeStep === 1 &&
                        (reflectionQs
                          ? reflectionQs[0].question
                          : "I was reading that with you... wait, let me ask you something small.")}
                      {goodbyeStep === 2 &&
                        (reflectionQs
                          ? reflectionQs[1].question
                          : "Hmm okay, one more — I want to make sure I understood it with you.")}
                      {goodbyeStep === 3 &&
                        (happinessGained > 0
                          ? `JazakAllah Khair. +${happinessGained} happiness — say "Assalam Alaikum" to leave.`
                          : 'JazakAllah Khair for sharing. Say "Assalam Alaikum" — I want to hear your voice before you go.')}
                      {goodbyeStep === 4 &&
                        "Wa Alaikum Assalam! Can't wait to read with you tomorrow."}
                    </p>
                  </div>

                  {/* Step 1 — Q1 MCQ */}
                  {goodbyeStep === 1 && reflectionQs && (
                    <div className="w-full flex flex-col gap-1.5">
                      {reflectionQs[0].options.map((opt, i) => {
                        const answered = reflectionA1 !== null;
                        const isCorrect = i === reflectionQs[0].correct;
                        const isSelected = reflectionA1 === i;
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              if (!answered) {
                                setReflectionA1(i);
                                if (i === reflectionQs[0].correct) queueAdvance(2);
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-left leading-snug transition-all ${
                              !answered ? "bg-white border-2 border-[#1CB0F6]/25 border-b-4 text-gray-700 hover:border-[#1CB0F6]/55 hover:bg-[#F0F9FF] active:scale-95"
                                : isCorrect ? "bg-[#58CC02]/10 border-2 border-[#58CC02] border-b-4 text-[#58CC02]"
                                : isSelected ? "bg-[#1CB0F6]/12 border-2 border-[#1CB0F6] border-b-4 text-[#1CB0F6]"
                                : "bg-gray-50 border-2 border-gray-100 border-b-2 text-gray-300"
                            }`}
                          >
                            <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                              !answered ? "bg-[#1CB0F6]/12 text-[#1CB0F6] border border-[#1CB0F6]/35"
                                : isCorrect ? "bg-[#58CC02] text-white"
                                : isSelected ? "bg-[#1CB0F6] text-white"
                                : "bg-gray-200 text-gray-500"
                            }`}>{OPTION_LETTERS[i]}</span>
                            <span className="flex-1">{opt}</span>
                          </button>
                        );
                      })}
                      {reflectionA1 !== null && (
                        <p className={`text-xs font-bold text-center ${ reflectionA1 === reflectionQs[0].correct ? "text-[#58CC02]" : "text-red-500" }`}>
                          {reflectionA1 !== reflectionQs[0].correct && `Not quite — the answer was: "${reflectionQs[0].options[reflectionQs[0].correct]}"`}
                        </p>
                      )}
                      <button
                        onClick={() => setGoodbyeStep(2)}
                        disabled={reflectionA1 === null}
                        className="btn-duo-primary w-full disabled:opacity-40"
                      >
                        <TickSquare size="20" color="white" variant="Bold" />
                        {reflectionA1 === null ? "Pick one to continue" : reflectionA1 === reflectionQs[0].correct ? "Correct — next" : "Next"}
                      </button>
                    </div>
                  )}
                  {goodbyeStep === 1 && !reflectionQs && (
                    <div className="w-full flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-[#1CB0F6] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Step 2 — Q2 MCQ */}
                  {goodbyeStep === 2 && reflectionQs && (
                    <div className="w-full flex flex-col gap-1.5">
                      {reflectionQs[1].options.map((opt, i) => {
                        const answered = reflectionA2 !== null;
                        const isCorrect = i === reflectionQs[1].correct;
                        const isSelected = reflectionA2 === i;
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              if (!answered) {
                                setReflectionA2(i);
                                if (i === reflectionQs[1].correct) queueAdvance(3);
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-left leading-snug transition-all ${
                              !answered ? "bg-white border-2 border-[#1CB0F6]/25 border-b-4 text-gray-700 hover:border-[#1CB0F6]/55 hover:bg-[#F0F9FF] active:scale-95"
                                : isCorrect ? "bg-[#58CC02]/10 border-2 border-[#58CC02] border-b-4 text-[#58CC02]"
                                : isSelected ? "bg-[#1CB0F6]/12 border-2 border-[#1CB0F6] border-b-4 text-[#1CB0F6]"
                                : "bg-gray-50 border-2 border-gray-100 border-b-2 text-gray-300"
                            }`}
                          >
                            <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                              !answered ? "bg-[#1CB0F6]/12 text-[#1CB0F6] border border-[#1CB0F6]/35"
                                : isCorrect ? "bg-[#58CC02] text-white"
                                : isSelected ? "bg-[#1CB0F6] text-white"
                                : "bg-gray-200 text-gray-500"
                            }`}>{OPTION_LETTERS[i]}</span>
                            <span className="flex-1">{opt}</span>
                          </button>
                        );
                      })}
                      {reflectionA2 !== null && (
                        <p className={`text-xs font-bold text-center ${ reflectionA2 === reflectionQs[1].correct ? "text-[#58CC02]" : "text-red-500" }`}>
                          {reflectionA2 !== reflectionQs[1].correct && `Not quite — the answer was: "${reflectionQs[1].options[reflectionQs[1].correct]}"`}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          const score =
                            (reflectionA1 === reflectionQs![0].correct ? 1 : 0) +
                            (reflectionA2 === reflectionQs![1].correct ? 1 : 0);
                          if (accessToken && user?.sub) {
                            recordQuizScore({ user_id: user.sub, user_name: user.name || "Anonymous", surah_number: currentChapterId || 0, surah_name: currentChapter?.name_simple || "", score, total_questions: 2 }, accessToken);
                          }
                          setGoodbyeStep(3);
                        }}
                        disabled={reflectionA2 === null}
                        className="btn-duo-primary w-full disabled:opacity-40"
                      >
                        <TickSquare size="20" color="white" variant="Bold" />
                        {reflectionA2 === null ? "Pick one to continue" : reflectionA2 === reflectionQs[1].correct ? "Correct — finish" : "Finish"}
                      </button>
                    </div>
                  )}



                  {/* Step 3 — farewell + mic */}
                  {goodbyeStep === 3 && (
                    <div className="w-full flex flex-col items-center gap-3">
                      <div
                        className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 w-full justify-center transition-all ${
                          isListening
                            ? "border-[#1CB0F6] bg-[#1CB0F6]/5 text-[#1CB0F6]"
                            : "border-gray-200 bg-gray-50 text-gray-400"
                        }`}
                      >
                        <motion.div
                          animate={isListening ? { scale: [1, 1.25, 1] } : {}}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Microphone2
                            size="24"
                            color={isListening ? "#1CB0F6" : "#9ca3af"}
                            variant={isListening ? "Bold" : "Outline"}
                          />
                        </motion.div>
                        <span className="text-sm font-extrabold uppercase tracking-widest">
                          {isListening
                            ? 'Say "Assalam Alaikum"'
                            : "Starting mic..."}
                        </span>
                      </div>
                      <button
                        onClick={triggerGoodbyeAnimation}
                        className="btn-duo-primary w-full"
                      >
                        <TickSquare size="20" color="white" variant="Bold" />
                        Assalam Alaikum!
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* ── Bottom: Character ── */}
              <div className="w-full shrink-0 flex items-end justify-center pb-6" style={{ height: "30%" }}>
                <motion.img
                  key={goodbyeStep}
                  initial={{ scale: 0.85, opacity: 0, y: 16 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  src="/newcharacters/Waving.png"
                  className="h-full w-auto object-contain object-bottom pointer-events-none"
                />
              </div>

        </div>
      </motion.div>
    )}
  </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-50 flex justify-center pointer-events-none"
          >
            <div className="bg-gray-800 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg whitespace-nowrap">
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tafsir Bottom Sheet */}
      <AnimatePresence>
        {activeTafsirAyah && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTafsirAyah(null)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-60"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto h-[80vh] bg-white rounded-t-3xl shadow-2xl z-70 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b-2 border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Tafsir Ibn Kathir
                  </h3>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mt-1">
                    Ayah {activeTafsirAyah}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTafsirAyah(null)}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft2
                    size="20"
                    color="#6b7280"
                    className="rotate-180"
                  />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 pb-10 bg-white">
                {loadingTafsir ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-[#1CB0F6] rounded-full" />
                  </div>
                ) : tafsirData ? (
                  <div className="flex flex-col gap-6">
                    {/* AI Summary Section */}
                    <div className="card-duo p-5 relative overflow-hidden">
                      <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#1CB0F6]/5 rounded-full blur-xl pointer-events-none" />
                      {!aiSummary && !loadingAiSummary ? (
                        <div className="flex flex-col items-center text-center gap-3 relative z-10">
                          <div className="w-12 h-12 bg-[#1CB0F6]/10 rounded-full flex items-center justify-center mb-1">
                            <motion.img 
                              src="/newcharacters/Waving.png" 
                              className="w-8 h-8 object-contain"
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-sm">Too long to read?</h4>
                            <p className="text-xs text-gray-500 mt-1">Noorain can simplify and tell you the main lesson.</p>
                          </div>
                          <button
                            onClick={async () => {
                              setLoadingAiSummary(true);
                              const summary = await summarizeTafsir(tafsirData.text);
                              setAiSummary(summary);
                              setLoadingAiSummary(false);
                            }}
                            className="btn-duo-primary mt-2 w-full"
                          >
                            Do it, please
                          </button>
                        </div>
                      ) : loadingAiSummary ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-4 relative z-10">
                          <div className="relative w-12 h-12">
                            <motion.div
                              className="absolute inset-0 rounded-full border-2 border-[#1CB0F6]/20"
                              animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <motion.img 
                              src={`/newcharacters/${moodInfo.asset}`}
                              className="w-full h-full object-contain"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                            />
                          </div>
                          <p className="text-xs font-bold text-[#1CB0F6] uppercase tracking-widest animate-pulse">Noorain is reading...</p>
                        </div>
                      ) : (
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-[#1CB0F6]/10 rounded-full flex items-center justify-center shrink-0">
                              <img src="/newcharacters/Hugs.png" className="w-5 h-5 object-contain" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-[#1CB0F6]">Noorain's Note</span>
                          </div>
                          <div className="text-sm font-medium text-gray-700 leading-relaxed bg-[#1CB0F6]/5 p-4 rounded-xl border border-[#1CB0F6]/10">
                            {aiSummary}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Original Tafsir Content */}
                    <div className="card-duo p-6">
                      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                        <Book1 size="20" color="#9ca3af" variant="Bulk" />
                        <h4 className="font-bold text-gray-400 text-sm">Full Text (Ibn Kathir)</h4>
                      </div>
                      <div
                        className="prose prose-sm max-w-none text-gray-600 leading-[1.8] prose-headings:font-bold prose-headings:text-gray-800 prose-headings:mt-6 prose-headings:mb-3 prose-p:mb-5 prose-a:text-[#1CB0F6] prose-blockquote:border-[#1CB0F6] prose-blockquote:bg-gray-50 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r-xl prose-blockquote:text-gray-700 prose-blockquote:not-italic prose-strong:text-gray-800"
                        dangerouslySetInnerHTML={{ __html: tafsirData.text }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center mt-20 gap-4">
                    <img src="/newcharacters/Waving.png" className="w-16 h-16 opacity-50 grayscale" />
                    <div className="text-center text-gray-400 font-bold">Failed to load tafsir</div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Surah Picker */}
      <AnimatePresence>
        {showSurahPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSurahPicker(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-60"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto h-[85vh] bg-white rounded-t-3xl shadow-2xl z-70 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="font-display text-xl text-gray-800">
                  Select Surah
                </h3>
                <button
                  onClick={() => setShowSurahPicker(false)}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft2
                    size="20"
                    color="#6b7280"
                    className="rotate-180"
                  />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {chapters.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setPage(c.pages[0]);
                      setShowSurahPicker(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors text-left mb-1 ${
                      currentChapterId === c.id
                        ? "bg-[#1CB0F6]/10 text-[#1CB0F6]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500 shrink-0">
                      {c.id}
                    </span>
                    <span className="font-bold text-gray-700 flex-1">
                      {c.name_simple}
                    </span>
                    <span className="font-arabic text-gray-400 text-xl">
                      {c.name_arabic}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
