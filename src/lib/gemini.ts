const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export interface ReflectionQuestion {
  question: string;
  options: string[];
}

/**
 * Generate 2 multiple-choice reflection questions based on the current reading.
 * Falls back to generic questions if no API key or if the call fails.
 */
export async function generateReflectionQuestions(
  surahName: string,
  translations: string[],
): Promise<[ReflectionQuestion, ReflectionQuestion]> {
  if (!API_KEY) return fallback(surahName);

  const excerpt = translations.slice(0, 5).join(" ").slice(0, 600);
  const prompt = `You are Noorain, a warm Quran companion. The user just read ${surahName}. Excerpt: "${excerpt}".
Generate exactly 2 short reflection questions to help the user connect with what they read. Each question must have exactly 4 short answer options — they are all valid reflections, not a quiz. Keep options under 8 words each.
Return ONLY valid JSON: [{"question":"...","options":["...","...","...","..."]},{"question":"...","options":["...","...","...","..."]}]`;

  try {
    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
      }),
    });
    if (!res.ok) return fallback(surahName);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return fallback(surahName);
    const qs = JSON.parse(match[0]) as ReflectionQuestion[];
    if (qs.length >= 2 && qs[0].options?.length === 4) return [qs[0], qs[1]];
    return fallback(surahName);
  } catch {
    return fallback(surahName);
  }
}

function fallback(surahName: string): [ReflectionQuestion, ReflectionQuestion] {
  return [
    {
      question: `What stood out most to you from ${surahName}?`,
      options: [
        "A verse that moved me",
        "The overall theme",
        "A reminder I needed",
        "I want to re-read it",
      ],
    },
    {
      question: "How are you feeling after reading?",
      options: [
        "Peaceful and grateful",
        "Reflective and thoughtful",
        "Motivated to do better",
        "Still processing it",
      ],
    },
  ];
}
