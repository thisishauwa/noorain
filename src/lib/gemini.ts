const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const CACHE_KEY = "noorain_reflection_cache_v1";

export interface ReflectionQuestion {
  question: string;
  options: string[];
  correct: number;
}

/**
 * Generate 2 educational multiple-choice questions about what the user just read.
 * Each question has one correct answer that teaches something about the surah.
 */
export async function generateReflectionQuestions(
  surahName: string,
  translations: string[],
): Promise<[ReflectionQuestion, ReflectionQuestion]> {
  if (!API_KEY) return fallback(surahName, translations);

  const excerpt = translations.slice(0, 6).join(" ").slice(0, 800);
  const prompt = `You are Noorain, a warm Quran companion reading alongside the user. Sound human, affectionate, and slightly quirky. You are allowed to say things like "I was reading that with you", "wait", "mm okay", or "let me quiz you" — but keep it natural and short.

The user just read ${surahName}. Excerpt: "${excerpt}".

Write 2 multiple-choice questions that TEACH something specific from these verses while still sounding like Noorain talking. The question itself should feel warm and in-character, but the answer choices should be clear and educational.

Rules:
- Each question must be grounded in the excerpt
- Ask about meaning, theme, command, warning, promise, person, or lesson from the text
- No vague emotional questions
- 4 options exactly
- 1 correct answer, 3 plausible distractors
- All options max 6 words
- "correct" is the 0-indexed correct option
- Keep each question under 20 words

Return ONLY valid JSON:
[{"question":"...","options":["...","...","...","..."],"correct":0},{"question":"...","options":["...","...","...","..."],"correct":2}]`;

  try {
    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.55, maxOutputTokens: 500 },
      }),
    });
    if (!res.ok) {
      if (res.status === 429) return cachedOrFallback(surahName, translations);
      return fallback(surahName, translations);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) return cachedOrFallback(surahName, translations);
    const qs = JSON.parse(match[0]) as ReflectionQuestion[];
    if (
      qs.length >= 2 &&
      qs[0].options?.length === 4 &&
      typeof qs[0].correct === "number"
    ) {
      writeCache(surahName, [qs[0], qs[1]]);
      return [qs[0], qs[1]];
    }
    return cachedOrFallback(surahName, translations);
  } catch {
    return cachedOrFallback(surahName, translations);
  }
}

function cachedOrFallback(
  surahName: string,
  translations: string[],
): [ReflectionQuestion, ReflectionQuestion] {
  const cached = readCache(surahName);
  return cached ?? fallback(surahName, translations);
}

function readCache(
  surahName: string,
): [ReflectionQuestion, ReflectionQuestion] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, ReflectionQuestion[]>;
    const qs = parsed[surahName];
    if (!qs || qs.length < 2) return null;
    return [qs[0], qs[1]];
  } catch {
    return null;
  }
}

function writeCache(
  surahName: string,
  questions: [ReflectionQuestion, ReflectionQuestion],
) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as Record<string, ReflectionQuestion[]>)
      : {};
    parsed[surahName] = questions;
    localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
  } catch {}
}

function fallback(
  surahName: string,
  translations: string[],
): [ReflectionQuestion, ReflectionQuestion] {
  const text = translations.join(" ").toLowerCase();
  if (
    text.includes("guidance") ||
    text.includes("muttaq") ||
    text.includes("god-conscious")
  ) {
    return [
      {
        question: `I was reading ${surahName} with you — who is this guidance really for?`,
        options: [
          "Those mindful of Allah",
          "Only scholars",
          "Only prophets",
          "Only rulers",
        ],
        correct: 0,
      },
      {
        question: "Okay wait — what does this surah keep pointing us toward?",
        options: [
          "Faith and guidance",
          "Wealth and status",
          "Travel and trade",
          "Food and clothing",
        ],
        correct: 0,
      },
    ];
  }
  return [
    {
      question: `I read ${surahName} with you — let me quiz you: what theme showed up most?`,
      options: [
        "Guidance and worship",
        "Trade laws",
        "War stories",
        "Food rules",
      ],
      correct: 0,
    },
    {
      question: "Hmm, one more — what is Noorain meant to learn from this bit?",
      options: [
        "Follow Allah's guidance",
        "Chase worldly praise",
        "Ignore the warning",
        "Delay doing good",
      ],
      correct: 0,
    },
  ];
}
