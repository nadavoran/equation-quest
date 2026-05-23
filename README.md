# 🧮 EquationQuest

> **Math adventures for curious kids**

A mobile-first Progressive Web App (PWA) that makes learning math fun through colourful block animations, adaptive difficulty, and rewarding celebrations.

---

## 🎮 What Is It?

EquationQuest is a math game designed for kids aged 5+. Kids solve equations by typing the answer, while animated Numberblocks-style coloured towers bring the numbers to life. Each correct answer triggers a unique animation that *shows* how the math works — not just whether the answer is right.

---

## ✨ Features

### 🧱 Visual Block Animations
Each operation has its own success animation:
- **Addition** → towers merge into one combined tower
- **Subtraction** → blocks fly away revealing the result
- **Multiplication** → shows groups of blocks, then merges into a single tower
- **Division** → splits blocks into equal groups
- **Negatives** → positive and negative towers shown side-by-side

### 🧠 Adaptive Difficulty
- Three levels: Easy / Medium / Hard
- Adjusts automatically based on streak and wrong answers
- Visual speedometer-style gauge shows current difficulty

### 💡 Smart Hints
Progressive hints that teach real strategies:
- Break into tens and ones
- "Hero with Zero" rounding
- Count-up strategy for subtraction
- Repeated addition for multiplication
- Think-multiplication-backwards for division

### 🏆 Streak Celebrations
- 🔥 5 in a row — fire overlay + bugle fanfare
- ⚡ 10 in a row — lightning overlay + full flourish
- 👑 20 in a row — crown overlay + epic two-part fanfare + triple confetti burst

### 🔊 Sound Effects
All synthesised with Web Audio API — no audio files needed:
- ✅ Correct chime (C-major arpeggio)
- ❌ Wrong buzz (descending pulse)
- 🎵 Background ambient music (C pentatonic melody loop with bass)
- 🏆 Milestone fanfares

### 📊 Stats & History
- Total solved, accuracy %, best streak, today's count
- Full history with attempt details, retry any equation
- Difficulty gauge on every history entry

### ⚙️ Customisation
- Name + animal avatar (12 options)
- 6 colour themes with live preview
- Max number range (10 → 1000)
- Numbers per equation (2–5, varies randomly)
- Simple fractions toggle
- Sound on/off

### 📱 PWA — Install on Any Device
- Works offline after first load
- "Add to Home Screen" on iOS and Android
- No app store needed

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run in development (local)
npm run dev

# Run with phone access (same WiFi)
npm run dev -- --host

# Build for production
npm run build
```

---

## 🎨 Generating Icons

To use your own custom icon:

1. Create a **1024×1024 PNG** — save as `public/icon-master.png`
2. Install sharp (one-time): `npm install -D sharp`
3. Run: `node scripts/generate-icons.mjs`

This generates all sizes for iOS, Android, and PWA automatically.

---

## 📄 License

MIT © [Noran Adan](https://github.com/nadavoran)
