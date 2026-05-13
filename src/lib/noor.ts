export type NoorTier = "dead" | "low" | "neutral" | "good" | "peak";

export type NoorMoodResult = {
  mood: string;
  asset: string;
  /** Shown on the home screen when the user hasn't read yet today */
  message: string;
  /** Shown immediately after the user finishes a reading session */
  messageAfter: string;
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
    return {
      mood: "Dead",
      asset: "Dead.png",
      message: "...",
      messageAfter: "You came back.",
      tier: "dead",
    };
  if (score <= 10)
    return {
      mood: "Barf",
      asset: "Barf.png",
      message: "I haven't been well.",
      messageAfter: "That helped. Thank you.",
      tier: "low",
    };
  if (score <= 20)
    return {
      mood: "Sad",
      asset: "Sad.png",
      message: "I've been waiting.",
      messageAfter: "I felt that. Don't stop.",
      tier: "low",
    };
  if (score <= 25)
    return {
      mood: "Disappointed & Sad",
      asset: "Disappointed & Sad.png",
      message: "I thought you forgot me.",
      messageAfter: "Okay. We can do this.",
      tier: "low",
    };
  if (score <= 30)
    return {
      mood: "Disappointed",
      asset: "Disappointed.png",
      message: "It's been a while.",
      messageAfter: "That's a start. Come back tomorrow.",
      tier: "low",
    };
  if (score <= 35)
    return {
      mood: "Angry",
      asset: "Angry.png",
      message: "Where have you been?",
      messageAfter: "Fine. I forgive you.",
      tier: "neutral",
    };
  if (score <= 40)
    return {
      mood: "Nervous",
      asset: "Nervous.png",
      message: "I wasn't sure you'd come back.",
      messageAfter: "See? That wasn't so hard.",
      tier: "neutral",
    };
  if (score <= 45)
    return {
      mood: "Confused",
      asset: "Confused.png",
      message: "Something feels off between us.",
      messageAfter: "There you are. I was looking for you.",
      tier: "neutral",
    };
  if (score <= 50)
    return {
      mood: "Bored",
      asset: "Bored.png",
      message: "I've just been sitting here.",
      messageAfter: "Okay, I'm listening again.",
      tier: "neutral",
    };
  if (score <= 55)
    return {
      mood: "Finger biting",
      asset: "Finger biting.png",
      message: "I really hope you read today.",
      messageAfter: "Yes. That's what I needed.",
      tier: "neutral",
    };
  if (score <= 60)
    return {
      mood: "Puff",
      asset: "Puff.png",
      message: "I'm starting to feel like myself again.",
      messageAfter: "Keep going. I mean it.",
      tier: "good",
    };
  if (score <= 65)
    return {
      mood: "Waving",
      asset: "Waving.png",
      message: "Oh good, you're here.",
      messageAfter: "We're finding our rhythm.",
      tier: "good",
    };
  if (score <= 70)
    return {
      mood: "Winking",
      asset: "Winking.png",
      message: "I knew you'd show up.",
      messageAfter: "Look at us. Consistent.",
      tier: "good",
    };
  if (score <= 75)
    return {
      mood: "Cute",
      asset: "Cute.png",
      message: "This is becoming our thing.",
      messageAfter: "I love when we do this.",
      tier: "good",
    };
  if (score <= 80)
    return {
      mood: "Groovy",
      asset: "Groovy.png",
      message: "I woke up ready for this.",
      messageAfter: "This is what it's supposed to feel like.",
      tier: "good",
    };
  if (score <= 85)
    return {
      mood: "Excited_Childlike",
      asset: "Excited_Childlike.png",
      message: "Today is going to be a good day.",
      messageAfter: "I'm so proud of us right now.",
      tier: "good",
    };
  if (score <= 88)
    return {
      mood: "Tongue out",
      asset: "Tongue out.png",
      message: "I'm in a great mood and it's because of you.",
      messageAfter: "We are on a roll.",
      tier: "good",
    };
  if (score <= 90)
    return {
      mood: "Cool",
      asset: "Cool.png",
      message: "We don't even have to think about it anymore.",
      messageAfter: "Effortless. That's what this is.",
      tier: "peak",
    };
  if (score <= 93)
    return {
      mood: "Rock & Roll",
      asset: "Rock & roll.png",
      message: "I'm full of barakah and it's overflowing.",
      messageAfter: "I'm about to do something good with this.",
      tier: "peak",
    };
  if (score <= 95)
    return {
      mood: "Rock & Roll 2",
      asset: "Rock & roll 2.png",
      message: "I feel like I could give the whole world something.",
      messageAfter: "The light is real. You made it.",
      tier: "peak",
    };
  if (score <= 98)
    return {
      mood: "Hugs",
      asset: "Hugs.png",
      message: "I gave on your behalf last night. Read again today.",
      messageAfter: "Another meal. Another day. Subhanallah.",
      sadaqahTrigger: true,
      tier: "peak",
    };
  return {
    mood: "Kissy face",
    asset: "Kissy face.png",
    message: "This is what I was made for.",
    messageAfter: "Maximum light. Maximum barakah. بارك الله فيك.",
    sadaqahTrigger: true,
    tier: "peak",
  };
}
