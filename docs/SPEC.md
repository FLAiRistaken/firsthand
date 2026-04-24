# SPEC.md

# Firsthand — Project Specification
> Version 1.0 · Living document · Last updated during planning phase

---

## Overview

**Firsthand** is a personal mobile app that helps people become more aware of their AI reliance and rebuild their own thinking capabilities. The core mechanic is simple: every time you do something yourself, log a win. Every time you reach for AI, log it. Over time the pattern becomes visible.

The tone is warm, honest, and non-preachy. AI is a useful tool — the goal is intentional use, not zero use.

---

## The Problem

People increasingly outsource cognitive tasks to AI — writing, coding, decisions, planning — in ways that quietly erode their own capabilities. This happens reflexively, without awareness. There is no tool that holds you accountable for this or helps you rebuild the habit of thinking for yourself.

The primary user is someone who has noticed this pattern in themselves and wants to do something about it. Developers are a strong secondary target — the cost of AI reliance is concrete and professional for them ("I used to be able to write this myself").

---

## Core Concept

**Wins and sins.** Not just tracking AI use, but counting the reps of doing things yourself. Every win is proof you don't need AI for everything. The score is about accumulation of evidence, not punishment.

**Awareness is the product.** The moment of self-noticing — "I reached for AI again" — is valuable in itself. The app creates structure around that moment without adding friction.

**Frictionless above all else.** The primary interaction must be as fast as possible. Open app, tap one button, done. Everything else is secondary to that loop.

---

## Platform & Stack

| Layer | Choice | Notes |
|---|---|---|
| Mobile framework | React Native | iOS first, Android to follow |
| Backend / DB | Supabase | Auth, Postgres, real-time sync |
| Auth | Sign in with Apple (required), Google (secondary) | Apple required for App Store |
| AI / Coach | Anthropic API — `claude-sonnet-4-5` | Client-side for now, backend later |
| Sync | Offline-first | Queue writes locally, sync on reconnect |

**Future platforms (post-v1):**
- Android
- macOS
- Apple Watch (quick log tap)
- VSCode extension (developer-focused, separate repo)
- Browser extension (separate repo)

---

## Data Model

### Log Entry
```typescript
{
  id: string                  // uuid
  user_id: string             // foreign key → users
  timestamp: string           // ISO 8601
  type: 'win' | 'sin'
  category: string            // from user's category list
  note?: string               // optional, max 200 chars
  context?: 'work' | 'personal'
  duration_mins?: number      // optional, rough estimate
  created_at: string
}
```

### User Profile
```typescript
{
  id: string                  // uuid, matches Supabase auth uid
  name: string                // first name from onboarding
  occupation: string          // from onboarding
  ai_tools_used: string[]     // from onboarding, e.g. ['Claude', 'Copilot']
  primary_uses: string[]      // from onboarding, e.g. ['coding', 'planning']
  goal: string                // verbatim from onboarding Q5
  success_definition: string  // verbatim from onboarding Q6
  custom_categories: string[] // user-added categories beyond defaults
  created_at: string
  onboarded: boolean
}
```

### Computed Values (client-side)
- **Win streak** — consecutive days with at least one win log
- **Win ratio** — wins / total logs over last 7 days, as a percentage
- **Personal average** — win ratio over all time, used as baseline for comparison

---

## Log Entry Rules

- **No deletion** — a win is a win, a sin is a sin. The integrity of the log is the product.
- **Editable fields** — note, category, context, duration_mins
- **Non-editable fields** — type (win/sin), timestamp
- **No changing a win to a sin or vice versa**

---

## Default Categories

```
coding · writing · planning · research · other
```

Users can add their own custom categories. Custom categories are stored in the user profile and persist across devices.

---

## Screens (v1)

### 1. Onboarding
- Runs once on first launch, before the main app is shown
- AI-powered conversational flow — 6 questions, one at a time
- Powered by Anthropic API with a Socratic, warm system prompt
- Progress bar at top showing completion
- On completion: brief "You're all set" confirmation screen, then transition to Home

**Questions (in order):**
1. What's your name?
2. What do you do for work?
3. Which AI tools do you use most?
4. What do you use AI for most day to day?
5. What's one thing you wish you could do without AI?
6. What would success look like for you in a month's time?

**System prompt intent:** Warm, conversational, 1–2 sentences per message, no lists. After Q6, deliver a personalised 2-sentence reflection using their actual answers, then trigger `ONBOARDING_COMPLETE`.

**Profile extraction from answers:**
- Q1 → `name`
- Q2 → `occupation`
- Q3 → `ai_tools_used`
- Q4 → `primary_uses`
- Q5 → `goal`
- Q6 → `success_definition`

---

### 2. Home (primary screen)
The heart of the app. Must feel clean, fast, and focused.

**Layout (top to bottom):**
- Status bar + Firsthand header + profile icon (top right)
- Greeting — "Afternoon, [name]." with dynamic subtitle based on today's activity
- **Two large buttons** — these dominate the screen
  - "I did it myself" — green, prominent, has shadow
  - "I used AI" — warm sandy tone, present but quieter
- Stats row — wins today / AI uses today / streak (compact, single card)
- Ratio + streak card — 7-day own-work % with personal average marker, plus 7-dot streak display
- Today's logs — collapsed by default, expandable with "Today · N logged" header

**Log modal (bottom sheet, slides up on button tap):**
- Title and sub-copy matching the button tapped
- Category pills (defaults + custom) with "+ new" option to add
- Context toggle (work / personal)
- Optional note input
- Cancel / Save buttons

**Design intent:** The green win button should be the dominant visual element. The sin button is intentionally quieter — present and warm, not cold or punishing, but clearly secondary.

---

### 3. History
- Grouped by day (Today, Yesterday, then date labels)
- Today and Yesterday expanded by default, older days collapsed
- Each day header shows: day label, W·A count, mini ratio bar — all tappable to expand/collapse
- Filter pills at top: All / Wins / AI uses
- Each log entry shows: icon, category, context badge (if set), note (if set), time
- Wins tinted green, sins tinted warm sandy

**Edit behaviour:**
- Tap a log entry to edit
- Editable: note, category, context
- Non-editable: type (win/sin), timestamp
- No delete option

---

### 4. Coach
- Socratic AI coach powered by Anthropic API
- **System prompt rules:** One question per turn, never give advice or answers, never tell the user what to do, warm and human, uses the user's name and knows their goal/occupation from profile
- Coach identity bar at top — name, "Only asks questions. Never answers them."
- Quick prompt suggestions shown on first open (disappear once conversation starts)
- Standard chat bubble UI — user messages right (green), coach messages left (white)
- Animated typing indicator while waiting
- Conversation persists within a session; resets between sessions (v1)

---

### 5. Profile / Settings (behind profile icon)
- Not fully designed yet — placeholder for v1
- Should include at minimum: name, occupation, custom categories management, sign out
- Consider: view onboarding answers, reset streak (with confirmation)

---

## Navigation

Three tabs: **Home · History · Coach**

Profile/settings accessed via icon in top-right header, not a tab.

No back navigation needed in v1 — all screens are top-level tabs.

---

## Design System

### Colours
```
Primary green:      #2A5C45
Green light (tint): #E8F2ED
Amber:              #9C6B1A
Amber light:        #FDF3E3
Sin button bg:      #FAF5EE
Sin button border:  #E8DDD0
App background:     #F7F6F3
Card background:    #FFFFFF
Border:             #F0EEE9 (cards), #E4E0DA (inputs)
```

### Typography
```
Headings / numbers: Fraunces (serif) — Google Fonts
Body:               DM Sans — Google Fonts
```

### Key Design Principles
- Buttons are tall and confident, not compact
- Cards use `#FFFFFF` on `#F7F6F3` background — subtle warmth
- Borders are very light, almost invisible
- Green is used sparingly — wins, active states, primary actions only
- Amber used only for sin-related data and below-average indicators
- No emoji in the UI — SVG icons only
- Mobile-first, iOS conventions throughout

### Icons (SVG, custom drawn)
- Brain outline — represents wins / doing it yourself
- Chip/circuit — represents AI use
- Person — profile
- Send arrow — message input
- Question mark in circle — coach identity

---

## Streak Logic

- A streak day = any day with at least one win logged
- Streak counter = consecutive days with at least one win, counting backwards from today
- If today has no wins yet, yesterday still counts (streak still alive)
- If neither today nor yesterday has a win, streak resets to 0
- Displayed as both a number ("5 day streak") and 7-dot visual (Mon–Sun)

---

## Win Ratio

- Calculated as: wins / (wins + sins) × 100, rounded to nearest integer
- Default window: last 7 days
- Personal average = all-time ratio, used as comparison baseline
- Badge shown: "↑ N% above avg" (green) or "↓ N% below avg" (amber)

---

## API Usage

### Onboarding
```
Model: claude-sonnet-4-5
Max tokens: 150
Purpose: Conversational onboarding, profile extraction
Trigger: ONBOARDING_COMPLETE token in response
```

### Coach
```
Model: claude-sonnet-4-5
Max tokens: 120
Purpose: Socratic reflection
Full conversation history sent each turn
System prompt includes: user name, occupation, goal, success_definition
```

**Current approach:** Client-side API calls (key in app config). Backend proxy to be added before any public release.

---

## Sync & Offline

- All log writes attempted immediately to Supabase
- If offline: write to local SQLite / AsyncStorage queue
- On reconnect: flush queue to Supabase in chronological order
- Profile syncs on login and after onboarding completes
- Computed values (streak, ratio) calculated client-side from local data

---

## Out of Scope — v1

The following were considered and deliberately excluded from v1:

- Think-first timer
- Intentions / weekly goals
- Complex scoring systems
- Push notifications
- Social features / sharing
- Streak freeze / grace days
- Data export
- VSCode extension
- Browser extension
- Apple Watch app
- Android build
- Backend API proxy

---

## Open Questions (to resolve during build)

- Does the coach conversation persist between app sessions or reset? (Currently: resets)
- What is the day-one empty state experience before any logs exist?
- Should there be a prompt or nudge to open the coach after a bad day/streak?
- How are custom categories managed in profile settings?
- Should the profile screen show onboarding answers and allow editing them?

---

## Design Reference

UI mockups for Home, History, Coach, and Onboarding screens have been prototyped as React artifacts. The visual language — layout, spacing, colour usage, typography, component style — should be followed closely. Key files:

- `firsthand-home.jsx` — Home screen including log modal
- `firsthand-history.jsx` — History screen with collapsible days and filters
- `firsthand-coach.jsx` — Coach chat screen
- `firsthand-onboarding.jsx` — Onboarding conversational flow

---

## Guiding Principles (for any future decisions)

1. **Frictionless first.** If a feature adds friction to the core log loop, it needs a very strong justification.
2. **Wins over sins.** The app should feel like it's rooting for the user, not judging them.
3. **Awareness is enough.** The app doesn't need to solve the problem — it needs to make the pattern visible.
4. **Honest, not preachy.** AI is useful. The goal is intentional use.
5. **Small and right beats large and wrong.** Ship v1 cleanly, then expand.