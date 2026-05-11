# Rawdah — Product Requirements Document v2
**Quran Foundation Hackathon Submission**
Version 2.0 | May 2026

---

## 1. Overview

### 1.1 Product Name
**Rawdah** (روضة) — Arabic for "garden." But the garden in this app is not plants. It's Noor.

### 1.2 One-Line Description
Meet Noor — your Quran companion. Read consistently and Noor thrives. Noor thriving means real sadaqah in the world, on your behalf.

### 1.3 The Problem
Millions of Muslims reconnect with the Quran during Ramadan. By May, that connection is mostly gone. Not because they don't want to read — but because there is no compelling reason to open it *today*. No consequence. No one waiting. No one who needs them.

### 1.4 The Solution
Rawdah introduces **Noor** (نور — Light) — a companion character who lives on your home screen and whose emotional state is entirely determined by your Quran reading consistency. Noor is not a pet. Noor is not a streak counter. Noor is someone who needs you. When you read, Noor is happy. When you stop, Noor dims. And when Noor reaches peak happiness — sustained consistent reading — Noor does sadaqah in the real world on your behalf.

The emotional hook is inverted from every other Quran app:
- Every other app says: **"here is your reward for reading."**
- Rawdah says: **"someone needs you."**

### 1.5 Why Noor, Why Now
The character uses expressive blob/jelly face illustrations (23 distinct mood states) that are visually contemporary, instantly readable, and emotionally resonant. Seeing **Dead Noor** on your home screen hits differently than a streak at zero. You don't feel like you failed a habit. You feel like you let someone down. That distinction drives return behavior.

### 1.6 Hackathon Fit
| Judging Criteria | Points | How Rawdah Scores |
|---|---|---|
| Impact on Quran Engagement | 30 | Noor creates emotional accountability that outlasts Ramadan |
| Product Quality & UX | 20 | Character-driven UI, Islamic aesthetic, delightful animations |
| Technical Execution | 20 | Clean React app, real API integration, no backend needed |
| Innovation & Creativity | 15 | First Quran app with a companion whose wellbeing depends on your reading |
| Effective API Use | 15 | Content APIs (verses, audio, tafsir) + User APIs (bookmarks, activity) |

---

## 2. Target User

**Primary:** Muslims post-Ramadan who read consistently during Ramadan but have lapsed.

**User Persona:**
> Fatima, 28, Abuja. Completed 10 Juz during Ramadan. It's now mid-May. She hasn't opened the Quran since Eid. She feels guilty but not guilty enough to open an app that shows her a streak counter at zero. She needs something that pulls her back — not with shame, but with care.

**Key behavioral insight:** Fatima will not respond to guilt directed at herself. She will respond to knowing that something she loves needs her. The mechanic must externalize the consequence onto Noor, not onto her.

---

## 3. Noor — The Companion

### 3.1 Who is Noor?
Noor is a small, expressive character who lives on the Rawdah home screen. Noor has no fixed gender — the user names Noor during onboarding and may think of Noor however they wish. Noor's entire emotional life is determined by the user's Quran reading consistency.

Noor is not a gamification mascot. Noor is presented as a *friend* — someone the Quran brought into your life, whose light depends on the light you bring to the Quran.

### 3.2 The Mood System — All 23 States Mapped

Noor's mood is calculated from a **Mood Score** (0–100) that updates daily based on reading activity.

**Mood Score Rules:**
- Read 1+ pages today: +15 points (capped at 100)
- Complete a Juz today: +25 points bonus
- Miss a day: -20 points
- Miss 2 consecutive days: -30 points
- Miss 5+ consecutive days: score floors at 0 (Dead)
- Score recovers but never jumps more than +15 per day (Noor heals slowly, like a real relationship)

| Mood Score | Noor's State | Asset File | What Noor Does |
|---|---|---|---|
| 0 | **Dead** | Dead.png | Completely flat. Eyes closed. Just lying there. |
| 1–10 | **Barf** | Barf.png | Feeling sick. Visibly unwell. |
| 11–20 | **Sad** | Sad.png | Drooping. Low energy. |
| 21–25 | **Disappointed & Sad** | Disappointed & Sad.png | Sad but trying. |
| 26–30 | **Disappointed** | Disappointed.png | Flat expression. Waiting. |
| 31–35 | **Angry** | Angry.png | Where have you been. |
| 36–40 | **Nervous** | Nervous.png | Anxious. Fidgeting. |
| 41–45 | **Confused** | Confused.png | Uncertain. Something feels off. |
| 46–50 | **Bored** | Bored.png | Flat but present. Needs more. |
| 51–55 | **Finger biting** | Finger biting.png | Anticipating. Hopeful. |
| 56–60 | **Puff** | Puff.png | Puffed up with cautious optimism. |
| 61–65 | **Waving** | Waving.png | Sees you. Happy you're here. |
| 66–70 | **Winking** | Winking.png | Playful. Comfortable. |
| 71–75 | **Cute** | Cute.png | Warm and happy. Glowing softly. |
| 76–80 | **Groovy** | Groovy.png | In a good rhythm. Vibing. |
| 81–85 | **Excited / Childlike** | Excited_Childlike.png | Pure joy. Bouncing. |
| 86–88 | **Tongue out** | Tongue out.png | Carefree and happy. |
| 89–90 | **Cool** | Cool.png | Fully himself. Confident. |
| 91–93 | **Rock & Roll** | Rock & roll.png | Peak energy. On fire. |
| 94–95 | **Rock & Roll 2** | Rock & roll 2.png | Even more on fire. |
| 96–98 | **Hugs** | Hugs.png | Overflowing with love. Arms open. **Sadaqah trigger.** |
| 99–100 | **Kissy face** | Kissy face.png | Maximum Noor. Pure light. **Sadaqah milestone unlocked.** |

### 3.3 Sadaqah Triggers
Sadaqah is triggered at two points:
1. **Score reaches 96+ (Hugs)** for the first time in a streak cycle
2. **Juz completion** — regardless of score

When sadaqah triggers:
- Full-screen Noor celebration (Kissy face / Hugs asset, animated)
- Message: *"Noor is so full of light, he gave on your behalf."*
- Donation counter increments: *"3 meals donated to children in Gaza."*
- Sponsor attribution shown
- Shareable card generated

**Sadaqah is mocked for the hackathon demo** — counter increments in localStorage, no real payment. Post-hackathon: partnership with Islamic Relief, Penny Appeal, or similar.

### 3.4 Noor's Messages
Noor sends short messages that appear on the home screen beneath him. These are not push notifications — they're ambient text that appears when you open the app.

| Mood State | Noor's Message |
|---|---|
| Dead | *"..."* |
| Barf / Sad | *"I miss you."* |
| Disappointed | *"It's okay. Come back."* |
| Angry | *"I needed you yesterday."* |
| Nervous | *"Are you okay? I'm here."* |
| Bored | *"One page. That's all."* |
| Waving | *"You came back! Let's read."* |
| Cute / Groovy | *"We're doing it. Keep going."* |
| Excited | *"Noor is so happy right now."* |
| Cool / Rock & Roll | *"This is what it feels like."* |
| Hugs / Kissy face | *"So much barakah. Let's give some away."* |

### 3.5 Onboarding
Three screens only:

**Screen 1:** "Meet Noor." — Show Noor in Waving state. "Noor lives here. His light comes from yours."

**Screen 2:** "How does it work?" — Simple: "Read Quran → Noor gets happier → Noor does sadaqah for you." Three icons. No more explanation.

**Screen 3:** "Where did you stop?" — Let user select their last Surah/Juz, or start from Al-Fatiha. This sets the bookmark in localStorage.

No sign-up. No email. Straight into the app.

---

## 4. Core Features (Build for Real)

### 4.1 Home Screen — Noor's World
- Noor displayed large, centered, animated (subtle breathing/idle loop)
- Current mood state asset displayed
- Mood message beneath Noor
- Streak counter (small, secondary — not the hero)
- Sadaqah total: "🤲 X meals donated"
- Large CTA button: **"Read with Noor"** → opens Reader at last bookmark
- Mood score bar (optional — could be hidden and just show the face)

### 4.2 The Reader
Clean, focused Quran reading experience.

- Browse by Surah or Juz
- Arabic text (Uthmani script, large)
- Word-by-word English translation beneath each Arabic word
- Transliteration toggle
- Tap any word → bottom sheet with root meaning
- Audio playback per ayah (reciter selectable)
- Repeat ayah N times (user sets number)
- Bookmark current position → saves to localStorage
- **"Done for today"** button at bottom → triggers Noor mood update + animation on home screen

### 4.3 Juz Milestone Screen
Triggered on Juz completion:

```
—————————————————————————————
  ✦  الجزء الأول مكتمل  ✦

  [Noor: Kissy face, animated]

  "Noor gave a meal to a child
   in your name today."

  [Sponsored by Islamic Relief]

  بَارَكَ اللهُ فِيكَ

  [ Share ]     [ Keep Reading ]
—————————————————————————————
```

### 4.4 Tafsir Sheet
- Long-press any ayah → bottom sheet
- Shows short tafsir (Ibn Kathir or Muyassar via API)
- Clean, dismissible

### 4.5 Surah / Juz Browser
- List all 114 Surahs + toggle to 30 Juz view
- Each shows completion status
- Tap to navigate

---

## 5. Mocked Features

| Feature | Mocked As | Real Version |
|---|---|---|
| Sadaqah donation | localStorage counter, increments per milestone | NGO API (Islamic Relief) |
| Sponsor | Static design asset | Paid partnership |
| Shareable card | Static designed image | Dynamic og:image |
| Push notifications | UI shown in screens, not wired | Service Worker / FCM |

---

## 6. API Integration

### 6.1 Quran Foundation Content APIs
Base URL: `https://api.qurancdn.com/api/qdc`

| API | Endpoint | Used For |
|---|---|---|
| Chapters | `GET /chapters?language=en` | Surah list |
| Verses by Chapter | `GET /verses/by_chapter/{n}?words=true&translations=131` | Word-by-word reader |
| Verses by Page | `GET /verses/by_page/{n}?words=true&translations=131` | Page mode |
| Verses by Juz | `GET /verses/by_juz/{n}?words=true` | Juz tracking |
| Audio | `GET /recitations/{id}/by_ayah/{key}` | Ayah audio playback |
| Tafsir | `GET /tafsirs/{id}/by_ayah/{key}` | Tafsir bottom sheet |
| Juz List | `GET /juzs` | Milestone detection |

Key params:
- `words=true` → word-by-word data
- `translations=131` → Saheeh International
- `word_fields=text_uthmani,transliteration` → Arabic + transliteration

### 6.2 User-Related APIs (where possible, localStorage fallback)

| API | Used For | localStorage Key |
|---|---|---|
| Bookmarks | Save reading position | `rawdah_bookmark` |
| Reading Sessions | Track daily activity | `rawdah_activity` |
| Streak | Power Noor's mood score | `rawdah_streak` |
| Collections | Track completed Juz | `rawdah_completed_juz` |

### 6.3 localStorage Schema

```javascript
{
  "rawdah_noor": {
    "moodScore": 72,
    "currentMood": "Cute",
    "lastUpdated": "2026-05-11"
  },
  "rawdah_bookmark": {
    "surah": 2,
    "ayah": 45,
    "page": 8,
    "juz": 1,
    "lastRead": "2026-05-11T14:30:00Z"
  },
  "rawdah_streak": {
    "current": 5,
    "longest": 12,
    "lastReadDate": "2026-05-11",
    "history": ["2026-05-07", "2026-05-08", "2026-05-09", "2026-05-10", "2026-05-11"]
  },
  "rawdah_completed_juz": [1, 2],
  "rawdah_sadaqah": {
    "meals": 3,
    "completedJuz": [1, 2],
    "lastDonationDate": "2026-05-10"
  },
  "rawdah_onboarded": true,
  "rawdah_start_position": {
    "surah": 1,
    "juz": 1
  }
}
```

---

## 7. Mood Score Algorithm

```javascript
function updateMoodScore(currentScore, todayActivity) {
  const { pagesRead, juzCompleted } = todayActivity;
  let newScore = currentScore;

  if (pagesRead >= 1) {
    newScore += 15;
    if (juzCompleted) newScore += 25;
  } else {
    // Check consecutive missed days
    const missedDays = getConsecutiveMissedDays();
    if (missedDays >= 5) return 0; // Dead
    if (missedDays >= 2) newScore -= 30;
    else newScore -= 20;
  }

  return Math.max(0, Math.min(100, newScore));
}

function getNoorMood(score) {
  if (score === 0) return { mood: 'Dead', asset: 'Dead.png', message: '...' };
  if (score <= 10) return { mood: 'Barf', asset: 'Barf.png', message: 'I miss you.' };
  if (score <= 20) return { mood: 'Sad', asset: 'Sad.png', message: 'I miss you.' };
  if (score <= 25) return { mood: 'Disappointed & Sad', asset: 'Disappointed & Sad.png', message: "It's okay. Come back." };
  if (score <= 30) return { mood: 'Disappointed', asset: 'Disappointed.png', message: "It's okay. Come back." };
  if (score <= 35) return { mood: 'Angry', asset: 'Angry.png', message: 'I needed you yesterday.' };
  if (score <= 40) return { mood: 'Nervous', asset: 'Nervous.png', message: "Are you okay? I'm here." };
  if (score <= 45) return { mood: 'Confused', asset: 'Confused.png', message: "Are you okay? I'm here." };
  if (score <= 50) return { mood: 'Bored', asset: 'Bored.png', message: 'One page. That\'s all.' };
  if (score <= 55) return { mood: 'Finger biting', asset: 'Finger biting.png', message: "One page. That's all." };
  if (score <= 60) return { mood: 'Puff', asset: 'Puff.png', message: "You came back! Let's read." };
  if (score <= 65) return { mood: 'Waving', asset: 'Waving.png', message: "You came back! Let's read." };
  if (score <= 70) return { mood: 'Winking', asset: 'Winking.png', message: "We're doing it. Keep going." };
  if (score <= 75) return { mood: 'Cute', asset: 'Cute.png', message: "We're doing it. Keep going." };
  if (score <= 80) return { mood: 'Groovy', asset: 'Groovy.png', message: "This is what it feels like." };
  if (score <= 85) return { mood: 'Excited_Childlike', asset: 'Excited_Childlike.png', message: "Noor is so happy right now." };
  if (score <= 88) return { mood: 'Tongue out', asset: 'Tongue out.png', message: "Noor is so happy right now." };
  if (score <= 90) return { mood: 'Cool', asset: 'Cool.png', message: "This is what it feels like." };
  if (score <= 93) return { mood: 'Rock & Roll', asset: 'Rock & roll.png', message: "So much barakah. Let's give some away." };
  if (score <= 95) return { mood: 'Rock & Roll 2', asset: 'Rock & roll 2.png', message: "So much barakah. Let's give some away." };
  if (score <= 98) return { mood: 'Hugs', asset: 'Hugs.png', message: "Noor gave on your behalf today. 🤲", sadaqahTrigger: true };
  return { mood: 'Kissy face', asset: 'Kissy face.png', message: "Maximum light. Maximum barakah.", sadaqahTrigger: true };
}
```

---

## 8. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React (Vite) | Fast setup, component-friendly |
| Styling | Tailwind CSS | Rapid UI |
| Animation | Framer Motion | Noor idle animations, mood transitions |
| Character Assets | PNG (your Canva exports) | Already have all 23 states |
| Audio | HTML5 Audio API | No extra dependencies |
| State | React Context + localStorage | No backend |
| API calls | fetch() | Clean, no dependencies |
| Arabic Font | Amiri | Beautiful Uthmani rendering |
| Latin Font | Inter | Clean, readable |

---

## 9. Design Principles

**Noor's visual world:**
- Warm, softly lit — sand tones, warm whites, gentle shadows
- Noor is always centered and large on the home screen — he is the hero, not a widget
- Mood transitions are animated (crossfade between states, ~300ms)
- Noor has a subtle idle animation even when static (gentle float/bob)
- The reader screen is calm and separate — Noor doesn't appear there. Reading is a private moment.

**Tone of voice:**
- Noor speaks in first person, briefly
- Never preachy, never guilt-tripping the *user* — the consequence is on Noor, not on them
- Warm, not saccharine
- Arabic phrases used sparingly and meaningfully (بَارَكَ اللهُ فِيكَ at milestones only)

**The one rule:** A non-Muslim should open this app and immediately feel it was made with love by someone who believes in what they built.

---

## 10. Demo Video Script (2–3 Minutes)

**00:00–00:15 — The Problem**
Black screen. Text only. *"Ramadan ended 6 weeks ago. You haven't opened the Quran since."* Pause. *"Nothing brought you back."*

**00:15–00:30 — Meet Noor**
App opens. Noor on screen — Sad state. Drooping. His message: *"I miss you."* Voiceover: *"This is Noor. His light comes from yours."*

**00:30–01:15 — The Reader**
User taps "Read with Noor." Clean reader screen. Arabic text. Word-by-word translation beneath each word. Tap a word — meaning appears. Audio plays. Ayah repeats. User reads a page. Taps "Done for today."

**01:15–01:35 — Noor Reacts**
Return to home screen. Noor transitions from Sad → Waving (animated). Message changes: *"You came back! Let's read."* Mood bar ticks up slightly.

**01:35–02:00 — The Milestone**
Time-lapse of 7 days. Noor transitions: Waving → Cute → Groovy → Excited → Rock & Roll → Hugs. Full-screen: *"Noor gave a meal to a child in Gaza on your behalf."* Counter: *"3 meals donated."* Shareable card appears.

**02:00–02:15 — The Return (Missed Day)**
User misses a day. Noor drops to Nervous. Message: *"Are you okay? I'm here."* Not shame. Care.

**02:15–02:30 — Close**
Noor in Cute state, waving. *"Rawdah. Keep Noor's light on."*

---

## 11. Out of Scope (Do Not Build)

- User accounts or login
- Real payment / NGO integration
- Backend of any kind
- Push notifications (design only)
- Social features
- Hifz tools
- Prayer times
- Multi-language UI

**Rule: if it's not in the demo video, it does not need to work.**

---

## 12. Build Priority Order

**Phase 1 — Noor Core (Days 1–3)**
1. Home screen with Noor character displayed
2. Mood score logic in localStorage
3. Mood → asset mapping (all 23 states)
4. Noor idle animation
5. Streak tracking (read today = +15 score)

**Phase 2 — Reader (Days 4–6)**
6. Verse display with word-by-word (Quran Foundation Content API)
7. Audio playback per ayah
8. Bookmark to localStorage
9. "Done for today" button → triggers mood update + Noor animation

**Phase 3 — Milestones (Day 7–8)**
10. Juz completion detection
11. Milestone full-screen with Noor (Kissy face / Hugs)
12. Sadaqah counter increment (localStorage)
13. Shareable card (static design)

**Phase 4 — Polish (Day 9)**
14. Tafsir bottom sheet (Tafsir API)
15. Surah / Juz browser
16. Onboarding 3-screen flow
17. Demo video recording

---

## 13. Asset Reference

All 23 Noor mood assets (from Canva_elements.zip):

```
Angry.png              Barf.png               Bored.png
Confused.png           Cool.png               Cute.png
Dead.png               Disappointed & Sad.png  Disappointed.png
Excited_Childlike.png  Finger biting.png      Groovy.png
Hugs.png               Kissy face.png         Nervous.png
Puff.png               Rock & roll 2.png      Rock & roll.png
Sad.png                Shocked.png            Tongue out.png
Waving.png             Winking.png
```

Note: **Shocked.png** is unassigned in the current mood map — reserve for a surprise milestone (e.g. user reads 5 pages in one day, Noor is shocked/delighted).

---

*PRD v2 — Rawdah / Noor Companion System*
*Quran Foundation Hackathon — Provision Capital Launch, May 2026*
*Deadline: May 20, 2026*
