export type NoorTier = "dead" | "low" | "neutral" | "good" | "peak";

export type NoorMoodResult = {
  mood: string;
  asset: string;
  message: string;
  tier: NoorTier;
  sadaqahTrigger?: boolean;
};

export const TIER_GLOW_COLOR: Record<NoorTier, string> = {
  dead: "#9CA3AF",
  low: "#F87171",
  neutral: "#FBBF24",
  good: "#34D399",
  peak: "#FDE68A",
};

export function getNoorMood(score: number): NoorMoodResult {
  if (score === 0)
    return { mood: "Dead", asset: "Dead.png", message: "...", tier: "dead" };
  if (score <= 10)
    return {
      mood: "Barf",
      asset: "Barf.png",
      message: "I miss you.",
      tier: "low",
    };
  if (score <= 20)
    return {
      mood: "Sad",
      asset: "Sad.png",
      message: "I miss you.",
      tier: "low",
    };
  if (score <= 25)
    return {
      mood: "Disappointed & Sad",
      asset: "Disappointed & Sad.png",
      message: "It's okay. Come back.",
      tier: "low",
    };
  if (score <= 30)
    return {
      mood: "Disappointed",
      asset: "Disappointed.png",
      message: "It's okay. Come back.",
      tier: "low",
    };
  if (score <= 35)
    return {
      mood: "Angry",
      asset: "Angry.png",
      message: "I needed you yesterday.",
      tier: "neutral",
    };
  if (score <= 40)
    return {
      mood: "Nervous",
      asset: "Nervous.png",
      message: "Uhh... are you okay? I'm here.",
      tier: "neutral",
    };
  if (score <= 45)
    return {
      mood: "Confused",
      asset: "Confused.png",
      message: "Uhh... are you okay? I'm here.",
      tier: "neutral",
    };
  if (score <= 50)
    return {
      mood: "Bored",
      asset: "Bored.png",
      message: "Just one page. That's all.",
      tier: "neutral",
    };
  if (score <= 55)
    return {
      mood: "Finger biting",
      asset: "Finger biting.png",
      message: "Just one page. That's all.",
      tier: "neutral",
    };
  if (score <= 60)
    return {
      mood: "Puff",
      asset: "Puff.png",
      message: "You came back! Let's get it.",
      tier: "good",
    };
  if (score <= 65)
    return {
      mood: "Waving",
      asset: "Waving.png",
      message: "You came back! Let's get it.",
      tier: "good",
    };
  if (score <= 70)
    return {
      mood: "Winking",
      asset: "Winking.png",
      message: "We're doing it. Gotta keep going.",
      tier: "good",
    };
  if (score <= 75)
    return {
      mood: "Cute",
      asset: "Cute.png",
      message: "We're actually doing it. Gotta keep going.",
      tier: "good",
    };
  if (score <= 80)
    return {
      mood: "Groovy",
      asset: "Groovy.png",
      message: "So this is what it feels like.",
      tier: "good",
    };
  if (score <= 85)
    return {
      mood: "Excited_Childlike",
      asset: "Excited_Childlike.png",
      message: "I'm so happy right now.",
      tier: "good",
    };
  if (score <= 88)
    return {
      mood: "Tongue out",
      asset: "Tongue out.png",
      message: "I'm so happy right now.",
      tier: "good",
    };
  if (score <= 90)
    return {
      mood: "Cool",
      asset: "Cool.png",
      message: "So this is what it feels like.",
      tier: "peak",
    };
  if (score <= 93)
    return {
      mood: "Rock & Roll",
      asset: "Rock & roll.png",
      message: "I'm swimming in barakah. Let's give some away.",
      tier: "peak",
    };
  if (score <= 95)
    return {
      mood: "Rock & Roll 2",
      asset: "Rock & roll 2.png",
      message: "I'm swimming in barakah. Let's give some away.",
      tier: "peak",
    };
  if (score <= 98)
    return {
      mood: "Hugs",
      asset: "Hugs.png",
      message: "I gave on your behalf today.",
      sadaqahTrigger: true,
      tier: "peak",
    };
  return {
    mood: "Kissy face",
    asset: "Kissy face.png",
    message: "I'm the happiest I've been in years!",
    sadaqahTrigger: true,
    tier: "peak",
  };
}
