<div align="center">

# Noorain 🌙
**Your Quran companion. His happiness depends on you.**

*Quran Foundation Hackathon · May 2026*

[**Live App →**](https://noorain-app.vercel.app)

</div>

---

## The Idea

Millions of Muslims read consistently during Ramadan. By May, that's mostly gone — not because they don't want to read, but because there's **no one waiting for them**.

Noorain fixes that.

**Every other Quran app says:** *"Here is your reward for reading."*  
**Noorain says:** *"Someone needs you."*

Noorain is a small companion character who lives on your home screen. His emotional state — 23 distinct mood expressions from Dead to Kissy Face — is entirely determined by your Quran reading consistency. When Noorain reaches peak happiness, he donates sadaqah to real children on your behalf.

---

## Features

- **23 mood states** — from Dead to Kissy Face, all driven by your reading streak
- **Full Quran reader** — word-by-word Arabic + transliteration + translation
- **AI reflection questions** (Gemini) — Noorain asks you about what you just read
- **Voice goodbye** — say "Assalam Alaikum" to leave the reading session
- **Sadaqah mechanic** — reach peak happiness and Noorain donates meals in your name
- **Friday donations** — streak-scaled sadaqah every Friday
- **Audio per ayah** — full recitation playback
- **Tafsir bottom sheet** — tap any verse for Ibn Kathir commentary
- **Quran Foundation OAuth** — sign in with your Quran.com account to sync reading activity

---

## Tech Stack

- **React + Vite + TypeScript**
- **Framer Motion** — character animations, mood transitions
- **Gemini API** — AI reflection questions post-reading
- **Quran Foundation APIs** — content (verses, audio, tafsir) + user (bookmarks, sessions, activity)
- **Quran Foundation OAuth 2.0 + PKCE** — authentication
- **Vercel** — hosting + serverless token exchange

---

## Run Locally

```bash
npm install
cp .env.example .env.local
# Fill in VITE_QURAN_CLIENT_ID and VITE_GEMINI_API_KEY
npm run dev
```

---

*Built with love. In memory of Noorain, the cat. 🐈*
