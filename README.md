<div align="center">

# Noorain
**He's your Quran companion. His happiness literally depends on you.**

*I built this for the Qur'an Foundation Hackathon · May 2026*

[**Live App →**](https://noorain-app.vercel.app)

</div>

---

## The Idea

Millions of Muslims try their best to read consistently during Ramadan. A couple of weeks after, that consistency is mostly gone.

Noorain wants to help fix that by ... **needing you**

---

Noorain is a small companion character who lives on your home screen. His emotional state made of 23 distinct mood expressions (from Dead to Kissy Face) is entirely determined by your Quran reading consistency. When Noorain reaches peak happiness, he donates sadaqah to real children on your behalf. Courtsey of partner charities.

---

## Features

- **23 mood states** — all driven by your reading streak
- **Full Quran reader** — word-by-word Arabic + transliteration + translation
- **Reflection questions** — Noorain asks you about what you just read
- **Sadaqah mechanic** — reach peak happiness and Noorain donates meals in your name
- **Friday donations** — streak-scaled sadaqah every Friday
- **Audio per ayah** — full recitation playback
- **Tafsir** — tap any verse for Ibn Kathir commentary
- **Quran Foundation OAuth** — sign in with your Quran.com account to sync reading activity

---

## Tech Stack

- **React + Vite + TypeScript**
- **Framer Motion** — character animations, mood transitions
- **Gemini API** — reflection questions post-reading
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
