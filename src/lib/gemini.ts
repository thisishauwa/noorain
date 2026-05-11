const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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
  if (!API_KEY) return fallback(surahName);

  const excerpt = translations.slice(0, 6).join(" ").slice(0, 800);
  const prompt = `You are Noorain, an educational Quran teacher companion. The user just read ${surahName}. Here are the verses: "${excerpt}".

Write 2 educational multiple-choice questions that TEACH the user something specific about what they just read — a theme, a concept, a command, a name, or a meaning directly from the text. Do NOT ask how the user "feels". Ask what the text actually says or means.

Rules:
- Each question must reference something SPECIFIC from the excerpt above
- 1 correct answer, 3 wrong-but-plausible distractors  
- All options max 6 words
- "correct" is the 0-indexed position of the right answer

Return ONLY valid JSON, no markdown:
[{"question":"...","options":["...","...","...","..."],"correct":0},{"question":"...","options":["...","...","...","..."],"correct":2}]`;

  try {
    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
      }),
    });
    if (!res.ok) return fallback(surahName);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) return fallback(surahName);
    const qs = JSON.parse(match[0]) as ReflectionQuestion[];
    if (
      qs.length >= 2 &&
      qs[0].options?.length === 4 &&
      typeof qs[0].correct === "number"
    )
      return [qs[0], qs[1]];
    return fallback(surahName);
  } catch {
    return fallback(surahName);
  }
}

function fallback(surahName: string): [ReflectionQuestion, ReflectionQuestion] {
  return [
    {
      question: `${surahName} is primarily a surah of...`,
      options: [
        "Guidance and worship",
        "Trade laws",
        "War stories",
        "Food rules",
      ],
      correct: 0,
    },
    {
      question: "Who is the Quran guidance for?",
      options: [
        "Those who fear Allah",
        "Only the Prophet",
        "Arabs alone",
        "The wealthy",
      ],
      correct: 0,
    },
  ];
}
