import { humanizeNoorainQuestion, humanizeTafsirNote } from "./humaniser";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const KEY_HINT = API_KEY ? API_KEY.slice(-4) : "none";
const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const CACHE_KEY = "noorain_reflection_cache_v3";
const QUOTA_BLOCK_UNTIL_KEY = `noorain_gemini_quota_block_until_${KEY_HINT}`;
const pendingRequests = new Map<
  string,
  Promise<[ReflectionQuestion, ReflectionQuestion]>
>();

export interface ReflectionQuestion {
  question: string;
  options: string[];
  correct: number;
}

export async function summarizeTafsir(tafsirHtml: string): Promise<string> {
  if (!API_KEY) return "SubhanAllah — this verse is calling you to reflect.";

  // Strip HTML and limit tokens
  const plainText = tafsirHtml.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 2500);

  const prompt = `You are Noorain, a warm Quran companion. A user just opened Ibn Kathir's tafsir for a verse.

Here is the tafsir text:
"${plainText}"

Write exactly 2 short sentences — total max 45 words — that tell the user one SPECIFIC, concrete thing from this tafsir:
- A historical context (when/why this was revealed)
- What a specific word or name in the verse means
- A specific command, promise, or warning Allah makes
- A specific person or event mentioned

Forbidden words: profound, wisdom, deep, emphasizes, reminds us, reflects, underscores, highlights, illustrates, conveys, spiritual journey.
Start with: "Ibn Kathir says", "You know what?", "This was actually", "SubhanAllah —", or "So —".
Sound like a friend talking, not an essay.`;

  try {
    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 120,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });
    if (!res.ok) return "SubhanAllah — this verse carries a beautiful meaning.";
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? humanizeTafsirNote(text.trim()) : "SubhanAllah — this verse carries a beautiful meaning.";
  } catch (err) {
    console.error("[Gemini] summarizeTafsir error:", err);
    return "SubhanAllah — this verse carries a beautiful meaning.";
  }
}

/**
 * Generate 2 educational multiple-choice questions about what the user just read.
 * Each question has one correct answer that teaches something about the surah.
 */
export async function generateReflectionQuestions(
  surahName: string,
  translations: string[],
): Promise<[ReflectionQuestion, ReflectionQuestion]> {
  console.log(`[Gemini] key hint: ...${KEY_HINT}`);
  if (!API_KEY) {
    console.warn("[Gemini] No API key — using fallback");
    return cachedOrFallbackFromInputs(surahName, translations);
  }
  if (isQuotaBlocked()) {
    console.warn("[Gemini] Quota block active — using fallback");
    return cachedOrFallbackFromInputs(surahName, translations);
  }

  const excerpt = translations.slice(0, 6).join(" ").slice(0, 800);
  const cacheKey = `${surahName}:${hashText(excerpt)}`;
  const cached = readCache(cacheKey);
  if (cached) {
    console.log("[Gemini] Returning cached questions");
    return cached;
  }
  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    console.log("[Gemini] Returning in-flight request");
    return pending;
  }
  console.log(`[Gemini] Requesting questions for ${surahName}...`);

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

  const request = (async () => {
    try {
      const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.55,
            maxOutputTokens: 2048,
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: "application/json",
            responseSchema: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  question: { type: "STRING" },
                  options: { type: "ARRAY", items: { type: "STRING" } },
                  correct: { type: "INTEGER" },
                },
                required: ["question", "options", "correct"],
              },
            },
          },
        }),
      });
      if (res.status === 429) {
        const errBody = await res.json().catch(() => ({}));
        console.error("[Gemini]", res.status, JSON.stringify(errBody));
        blockQuota(errBody);
        return cachedOrFallback(cacheKey, surahName, translations);
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("[Gemini]", res.status, JSON.stringify(errBody));
        return cachedOrFallback(cacheKey, surahName, translations);
      }
      const data = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text ?? "")
          .join("") ?? "";
      const parsed = parseQuestions(text, surahName);
      if (parsed) {
        writeCache(cacheKey, parsed);
        return parsed;
      }
      console.error("[Gemini] Parse failed — raw response text:", text);
      return cachedOrFallback(cacheKey, surahName, translations);
    } catch (err) {
      console.error("[Gemini] Fetch/runtime error:", err);
      return cachedOrFallback(cacheKey, surahName, translations);
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, request);
  return request;
}

function cachedOrFallback(
  cacheKey: string,
  surahName: string,
  translations: string[],
): [ReflectionQuestion, ReflectionQuestion] {
  const cached = readCache(cacheKey);
  return cached ?? fallback(surahName, translations);
}

function cachedOrFallbackFromInputs(
  surahName: string,
  translations: string[],
): [ReflectionQuestion, ReflectionQuestion] {
  const excerpt = translations.slice(0, 6).join(" ").slice(0, 800);
  const cacheKey = `${surahName}:${hashText(excerpt)}`;
  return cachedOrFallback(cacheKey, surahName, translations);
}

function readCache(
  cacheKey: string,
): [ReflectionQuestion, ReflectionQuestion] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, ReflectionQuestion[]>;
    const qs = parsed[cacheKey];
    if (!qs || qs.length < 2) return null;
    return [qs[0], qs[1]];
  } catch {
    return null;
  }
}

function writeCache(
  cacheKey: string,
  questions: [ReflectionQuestion, ReflectionQuestion],
) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as Record<string, ReflectionQuestion[]>)
      : {};
    parsed[cacheKey] = questions;
    localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
  } catch {}
}

function isQuotaBlocked() {
  try {
    const raw = localStorage.getItem(QUOTA_BLOCK_UNTIL_KEY);
    if (!raw) return false;
    return Number(raw) > Date.now();
  } catch {
    return false;
  }
}

function blockQuota(errBody: any) {
  const violations =
    errBody?.error?.details?.find((detail: any) =>
      String(detail?.["@type"] ?? "").includes("QuotaFailure"),
    )?.violations ?? [];
  const retryDelay = errBody?.error?.details?.find((detail: any) =>
    String(detail?.["@type"] ?? "").includes("RetryInfo"),
  )?.retryDelay;
  const retrySeconds =
    typeof retryDelay === "string" && retryDelay.endsWith("s")
      ? Math.max(0, Math.ceil(parseFloat(retryDelay)))
      : 0;
  const isDailyLimit = violations.some((violation: any) =>
    String(violation?.quotaId ?? "").includes("PerDay"),
  );
  const blockMs = isDailyLimit
    ? 12 * 60 * 60 * 1000
    : Math.max(retrySeconds * 1000, 60 * 1000);

  try {
    localStorage.setItem(QUOTA_BLOCK_UNTIL_KEY, String(Date.now() + blockMs));
  } catch {}
}

function parseQuestions(
  text: string,
  surahName: string,
): [ReflectionQuestion, ReflectionQuestion] | null {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  console.log(
    "[Gemini] parseQuestions text length:",
    cleaned.length,
    "| first 300:",
    cleaned.slice(0, 300),
  );

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error("[Gemini] JSON.parse threw:", e);
    const match = cleaned.match(/\[[\s\S]*\]/)?.[0];
    if (!match) {
      console.error("[Gemini] No JSON array found by regex either");
      return null;
    }
    try {
      parsed = JSON.parse(match);
    } catch (e2) {
      console.error("[Gemini] Regex fallback parse also threw:", e2);
      return null;
    }
  }

  if (!Array.isArray(parsed)) {
    console.error("[Gemini] Parsed value is not an array:", typeof parsed);
    return null;
  }
  if (parsed.length < 2) {
    console.error("[Gemini] Array has fewer than 2 items:", parsed.length);
    return null;
  }

  for (let i = 0; i < 2; i++) {
    const q = parsed[i];
    if (typeof q.question !== "string") {
      console.error(`[Gemini] q[${i}].question not string:`, q.question);
      return null;
    }
    if (!Array.isArray(q.options)) {
      console.error(`[Gemini] q[${i}].options not array:`, q.options);
      return null;
    }
    if (q.options.length < 2) {
      console.error(`[Gemini] q[${i}].options too short:`, q.options.length);
      return null;
    }
    if (q.correct == null) {
      console.error(`[Gemini] q[${i}].correct missing`);
      return null;
    }
    q.correct = Number(q.correct);
  }

  return [
    humaniseQuestion(parsed[0], surahName),
    humaniseQuestion(parsed[1], surahName),
  ];
}

function humaniseQuestion(
  question: ReflectionQuestion,
  surahName: string,
): ReflectionQuestion {
  return {
    ...question,
    question: humanizeNoorainQuestion(question.question, surahName),
    options: question.options.map((option) => option.trim()),
  };
}

function hashText(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
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
