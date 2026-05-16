import { humanizeNoorainQuestion, humanizeTafsirNote } from "./humaniser";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const KEY_HINT = API_KEY ? API_KEY.slice(-4) : "none";
const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const CACHE_KEY = "noorain_reflection_cache_v4";
const QUOTA_BLOCK_UNTIL_KEY = `noorain_gemini_quota_block_until_${KEY_HINT}`;
const pendingRequests = new Map<
  string,
  Promise<[ReflectionQuestion, ReflectionQuestion]>
>();

export interface ReflectionQuestion {
  type: "mcq";
  question: string;
  options: string[];
  correct: number;
}

export async function summarizeTafsir(tafsirHtml: string): Promise<string> {
  if (!API_KEY) return "Open the full tafsir below to read Ibn Kathir's commentary.";

  // Strip HTML and limit tokens
  const plainText = tafsirHtml.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 3500);

  const prompt = `You are summarising Ibn Kathir's tafsir for a Quran reader. Extract the most important facts from this commentary and present them as 3-5 short bullet points.

TAFSIR TEXT:
"${plainText}"

RULES:
- Each bullet must state a SPECIFIC fact: an actual ruling, a fraction (like "sisters get one-third"), a name of a companion, a specific event, a hadith, or a cause of revelation.
- DO NOT write meta-commentary like "Ibn Kathir discusses..." or "this verse teaches..." — STATE the thing itself.
- If there is a ruling about inheritance, prayer, halal/haram — state the exact ruling.
- If there is a hadith, say who narrated it and what they said.
- If there is a historical event (who asked, when it was revealed, what happened) — name who was involved.
- Keep each bullet to 1-2 sentences maximum.
- Write in plain English. No markdown. Use • as the bullet character.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS (no intro, no outro, just bullets):
• [fact 1]
• [fact 2]
• [fact 3]`;

  try {
    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 350,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    // Return raw bullet points — skip humanizer which breaks the format
    return text ? text.trim() : "Open the full tafsir below to read Ibn Kathir's commentary.";
  } catch (err) {
    console.error("[Gemini] summarizeTafsir error:", err);
    return "Open the full tafsir below to read Ibn Kathir's commentary.";
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

  const excerpt = translations.slice(0, 6).join(" ").slice(0, 1000);
  // Use page-level cache key (surah + hash) for in-flight dedup only
  // We do NOT return cached answers so questions stay fresh each read
  const cacheKey = `${surahName}:${hashText(excerpt)}`;
  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    console.log("[Gemini] Returning in-flight request");
    return pending;
  }
  console.log(`[Gemini] Requesting questions for ${surahName}...`);

  const prompt = `You are Noorain, a warm Quran companion. The user just finished reading a section.

Surah: ${surahName}
What they read (excerpt): "${excerpt}"

Generate 2 educational multiple-choice questions about this specific passage. Each question should teach the user something concrete from what they read.

RULES:
- ONLY ask about what is literally in the excerpt above — no general surah knowledge
- Ask about: a specific command, a name mentioned, a warning, a promise, a number, an event, a word meaning, a theme
- Make Q1 and Q2 different in what they ask about
- 4 options each, exactly 1 correct answer
- All options max 8 words
- Each question max 20 words
- Warm, human tone — Noorain sounds like a curious friend
- type is always "mcq"

Return ONLY a JSON array — no markdown:
[{"type":"mcq","question":"...","options":["...","...","...","..."],"correct":0},{"type":"mcq","question":"...","options":["...","...","...","..."],"correct":2}]`;

  const request = (async () => {
    try {
      const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: "application/json",
            responseSchema: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  type: { type: "STRING" },
                  question: { type: "STRING" },
                  options: { type: "ARRAY", items: { type: "STRING" } },
                  correct: { type: "INTEGER" },
                },
                required: ["type", "question", "options", "correct"],
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
    if (!Array.isArray(q.options) || q.options.length < 2) {
      console.error(`[Gemini] q[${i}].options invalid:`, q.options);
      return null;
    }
    q.correct = Number(q.correct ?? 0);
    q.type = "mcq";
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
  if (text.includes("guidance") || text.includes("muttaq") || text.includes("god-conscious")) {
    return [
      { type: "mcq", question: `Who is this guidance in ${surahName} really for?`, options: ["Those mindful of Allah", "Only scholars", "Only prophets", "Only rulers"], correct: 0 },
      { type: "mcq", question: "What does this passage keep pointing toward?", options: ["Faith and guidance", "Wealth and status", "Travel and trade", "Food and clothing"], correct: 0 },
    ];
  }
  return [
    { type: "mcq", question: `What theme shows up most in this part of ${surahName}?`, options: ["Guidance and worship", "Trade laws", "War stories", "Food rules"], correct: 0 },
    { type: "mcq", question: "What is Allah calling believers to in this passage?", options: ["Follow His guidance", "Chase worldly praise", "Ignore the warning", "Delay doing good"], correct: 0 },
  ];
}
