# Firsthand — Product Specification

> Version 1.1 · Living document · Updated during build phase

---

## Overview

**Firsthand** is a personal mobile app that helps people become more aware of their AI reliance and rebuild their own thinking capabilities. The core mechanic is simple: every time you do something yourself, log a win. Every time you reach for AI, log it. Over time the pattern becomes visible.

The tone is warm, honest, and non-preachy. AI is a useful tool — the goal is intentional use, not zero use.

---

## The Problem

People increasingly outsource cognitive tasks to AI — writing, coding, decisions, planning — in ways that quietly erode their own capabilities. This happens reflexively, without awareness. There is no tool that holds you accountable for this or helps you rebuild the habit of thinking for yourself.

The primary user is someone who has noticed this pattern in themselves and wants to do something about it. Developers are a strong secondary target — the cost of AI reliance is concrete and professional for them.

---

## Core Concept

**Wins and sins.** Not just tracking AI use, but counting the reps of doing things yourself. Every win is proof you don't need AI for everything. The score is about accumulation of evidence, not punishment.

**Awareness is the product.** The moment of self-noticing — "I reached for AI again" — is valuable in itself. The app creates structure around that moment without adding friction.

**Frictionless above all else.** The primary interaction must be as fast as possible. Open app, tap one button, done. Everything else is secondary to that loop.

---

## Platform & Stack

| Layer | Choice | Notes |
|---|---|---|
| Mobile framework | React Native (Expo SDK 54, TypeScript) | iOS first |
| Navigation | `@react-navigation/native` + bottom tabs | Custom TabBar |
| Backend / DB | Supabase | Auth, Postgres, RLS, realtime |
| Auth | Sign in with Apple (iOS + macOS), Google | Apple required for App Store |
| AI / Coach | Anthropic API — `claude-sonnet-4-5` | Client-side in v1, backend proxy in Phase 7 |
| Sync | Offline-first | AsyncStorage queue, flush on reconnect or foreground |
| Local storage | `@react-native-async-storage/async-storage` | |
| Icons | `react-native-svg` | Custom SVG components |
| Fonts | `expo-font` + Google Fonts (Fraunces, DM Sans) | |

**Future platforms (post-v1):**
- Android
- macOS app
- Apple Watch (quick log tap)
- VSCode extension (developer-focused, separate repo)
- Browser extension (separate repo)

---

## Data Model

### `LogEntry`
```typescript
interface LogEntry {
  id: string                  // uuid
  user_id: string             // foreign key → profiles.id
  timestamp: string           // ISO 8601
  type: 'win' | 'sin'
  category: string            // from default or user's custom list
  note?: string               // optional, max 200 chars
  context?: 'work' | 'personal'
  duration_mins?: number      // optional rough estimate
  created_at: string
}
```

### `UserProfile`
```typescript
interface UserProfile {
  id: string                  // matches Supabase auth uid
  name: string                // first name from onboarding
  occupation: string
  ai_tools_used: string[]
  primary_uses: string[]
  goal: string                // verbatim from onboarding Q5
  success_definition: string  // verbatim from onboarding Q6
  custom_categories: string[]
  created_at: string
  onboarded: boolean
}
```

### Computed Values (client-side)
- **Win streak** — consecutive days with at least one win log
- **Win ratio** — wins / total over last 7 days, as a percentage
- **Personal average** — win ratio over all time, used as comparison baseline
- **Streak dots** — array of 7 booleans, Mon–Sun of current week

---

## Log Entry Rules

- **No deletion** — a win is a win, a sin is a sin. The integrity of the log is the product. Enforced in `src/lib/db.ts` (no `deleteLog` function exists).
- **Editable fields** — `note`, `category`, `context`, `duration_mins`
- **Non-editable fields** — `type` (win/sin), `timestamp`, `id`, `user_id`, `created_at`
- **No changing a win to a sin or vice versa**
- **All updates scoped by `user_id`** — `updateLog(id, updates, userId)` filters on both for security

---

## Default Categories

```
coding · writing · planning · research · other
```

Users can add their own. Custom categories stored in `UserProfile.custom_categories` and persist across devices.

**No limits on custom category count yet** — to be revisited if abuse emerges.

---

## Screens (v1)

### 1. Onboarding
- Runs once on first launch, before main app shown
- AI-powered conversational flow — 6 questions, one at a time
- Powered by Anthropic API with warm, conversational system prompt
- Progress bar at top showing completion (1 of 6, 2 of 6, etc.)
- On completion: personalised 2-sentence reflection, then transition to home

**Questions (in order):**
1. What's your name?
2. What do you do for work?
3. Which AI tools do you use most?
4. What do you use AI for most day to day?
5. What's one thing you wish you could do without AI?
6. What would success look like for you in a month's time?

**System prompt intent:** Warm, conversational, 1–2 sentences per message, no lists. After Q6, deliver a personalised 2-sentence reflection using their actual answers, then trigger `ONBOARDING_COMPLETE_TOKEN`.

**Profile extraction:**
- Q1 → `name` (first word only)
- Q2 → `occupation`
- Q3 → `ai_tools_used` (split on commas)
- Q4 → `primary_uses` (split on commas)
- Q5 → `goal`
- Q6 → `success_definition`

**No tab bar shown during onboarding.** RootNavigator excludes the tab navigator until `onboarded === true`.

---

### 2. Home (primary screen)
The heart of the app. Must feel clean, fast, and focused.

**Layout (top to bottom):**
- Status bar + Firsthand header + profile icon (top right, 34×34 circle)
- Greeting — "{Morning/Afternoon/Evening}, {name}." with dynamic subtitle based on today's activity
- **Two large buttons** — these dominate the screen
  - "I did it myself" — green (`Colors.primary`), prominent, with shadow, ghost BrainIcon background
  - "I used AI" — warm sandy tone (`Colors.sinBg`), no shadow, ghost ChipIcon background, intentionally quieter
- Stats row — wins today / AI uses today / streak (Card, single row, three columns with vertical dividers)
- Ratio + streak card — 7-day own-work % with personal average marker, 7-dot streak display Mon–Sun
- Today's logs — collapsed by default, expandable header "Today · N logged"

**Dynamic subtitle logic:**
- No logs today: "What are you working on today?"
- More wins than sins: "{N} win(s) today. Your brain is working."
- More sins than wins: "{N} AI use(s) today. Awareness is the start."
- Equal and > 0: "Balanced day so far."

**Greeting logic:**
- Hour < 12 → "Morning"
- Hour < 17 → "Afternoon"
- Else → "Evening"

**Log modal (bottom sheet, slides up on button tap):**
- Title and sub-copy matching the button tapped
- Category pills (defaults + custom) with "+ new" option to add
- Context toggle (work / personal)
- Optional note input
- Cancel / Save buttons

**Design intent:** The green win button is the dominant visual element. The sin button is intentionally quieter — present and warm, not cold or punishing, but clearly secondary.

**Toast on save** — appears at top, auto-hides after 2 seconds.

---

### 3. History
- Grouped by day (Today, Yesterday, then weekday + date for older)
- Today and Yesterday expanded by default, older days collapsed
- Each day header: day label, W·A count, mini ratio bar (48px wide) — all tappable to expand/collapse
- Filter pills at top: All / Wins / AI uses
- Each log entry shows: icon, category, context badge (if set), note (if set), time
- Wins tinted green, sins tinted warm sandy

**Edit behaviour:**
- Tap a log entry to open edit modal
- Editable: `note`, `category`, `context`
- Non-editable: `type` (win/sin), `timestamp`
- No delete option

**Empty state:** "Nothing logged yet. Hit one of the big buttons to start."

---

### 4. Coach
- Socratic AI coach powered by Anthropic API via `callClaude` and `COACH_SYSTEM(profile)`
- **System prompt rules:** One question per turn, never give advice or answers, never tell the user what to do, warm and human, uses the user's name and knows their `goal` and `success_definition` from profile
- Coach identity bar at top — "The Coach", "Only asks questions. Never answers them.", green status dot
- Quick prompt suggestions shown on first open, disappear once conversation starts
- Standard chat bubble UI — user messages right (green), coach messages left (white)
- Animated typing indicator while waiting (three pulsing dots)
- **Conversation persists within a session, resets between sessions in v1.** Persistent history is a v2 feature.

**Quick prompts (shown when conversation has only opening message):**
- "I used AI when I didn't need to"
- "I want to talk about a win"
- "I'm struggling with a habit"
- "I feel like I'm getting worse at thinking"

---

### 5. Profile / Settings (behind profile icon)
- Header with name, occupation
- View onboarding answers (read-only display of `goal`, `success_definition`, etc.)
- Edit name and occupation
- Manage custom categories — add, rename, archive (not delete, to preserve historical log integrity)
- Sign out
- "DEV ONLY — bypass active" indicator visible only when `DEV_BYPASS_AUTH` is true
- Version number / build number at bottom

---

## Navigation

**Three tabs:** Home · History · Coach

**Profile/settings** accessed via icon in top-right header, not a tab.

No back navigation needed in v1 — all screens are top-level tabs. Profile is a modal stack push from any tab.

---

## Design System

### Colours (full set in `src/constants/theme.ts`)
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

Available weights: Fraunces 400/500/600, DM Sans 300/400/500.

### Key Design Principles
- Buttons are tall and confident, not compact
- Cards use `#FFFFFF` on `#F7F6F3` background — subtle warmth
- Borders are very light, almost invisible
- Green is used sparingly — wins, active states, primary actions only
- Amber used only for sin-related data and below-average indicators
- No emoji in the UI — SVG icons only
- Mobile-first, iOS conventions throughout

### Icons (custom SVG, in `src/components/icons/`)
- BrainIcon — represents wins / doing it yourself
- ChipIcon — represents AI use
- PersonIcon — profile
- SendIcon — message input

---

## Streak Logic

- A streak day = any day with at least one win logged
- Streak counter = consecutive days with at least one win, counting backwards from today
- If today has no wins yet, yesterday still counts (streak still alive)
- If neither today nor yesterday has a win, streak resets to 0
- Displayed as both a number ("5d") and 7-dot visual (Mon–Sun of current week)

**Implementation detail:** All day arithmetic uses `Date#setDate()` for DST safety, not millisecond offsets.

---

## Win Ratio

- Calculated as: `Math.round(wins / (wins + sins) * 100)`
- Default window: last 7 days (from now)
- Personal average = all-time ratio, used as comparison baseline
- Badge shown: "↑ N% above avg" (green) or "↓ N% below avg" (amber)
- Returns `null` if no logs in the 7-day window — show "Log wins and sins to see your ratio" placeholder

---

## API Usage

### Onboarding
```
Model:      claude-sonnet-4-5
Max tokens: 150
System:     ONBOARDING_SYSTEM (in src/lib/prompts.ts)
Termination: ONBOARDING_COMPLETE_TOKEN appended to final message
```

### Coach
```
Model:      claude-sonnet-4-5
Max tokens: 120
System:     COACH_SYSTEM(profile) — personalised with name, occupation, goal, success_definition
History:    Full conversation sent each turn
```

### Security
- All user-provided values passed into prompts go through `sanitizePromptValue()` first (strips control chars and newlines)
- 30-second `AbortController` timeout on every fetch
- API key checked at call time, not module init (so missing key in dev doesn't crash the app)

**Current approach:** Client-side API calls (key in `.env.local`). Backend proxy on Railway to be added before any public release.

---

## Sync & Offline

- All log writes attempted immediately to Supabase via `useLogs.addLog`
- If offline (network error): write to local AsyncStorage queue (`firsthand_offline_queue`)
- On reconnect: flush queue to Supabase in chronological order
- Profile syncs on login and after onboarding completes
- Computed values (streak, ratio, dots) calculated client-side from local data
- Queue flushes:
  - On `useLogs` mount
  - On AppState 'change' to 'active' (app foreground)
  - After every successful add

**Network errors are queued for retry.** Server errors revert the optimistic update and rethrow to the caller.

---

## Auth Flow

1. User opens app
2. `RootNavigator` checks `useAuth().session`
3. No session → `AuthScreen`
4. Session but `profile.onboarded === false` → `OnboardingScreen`
5. Session and onboarded → `AppNavigator` (tab bar)

Transitions handled by `supabase.auth.onAuthStateChange` subscription in `RootNavigator`.

**Sign in with Apple:** Native via `expo-apple-authentication`, exchanges identity token with Supabase via `signInWithIdToken({ provider: 'apple' })`.

**Sign in with Google:** Native via `@react-native-google-signin/google-signin`, exchanges idToken with Supabase via `signInWithIdToken({ provider: 'google' })`. Currently stubbed for Expo Go compatibility.

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
- Persistent coach history across sessions
- Profanity / abuse filters on custom categories
- Server-side timezone handling

---

## Decisions Made During Build (additions to v1.0)

These were decided during the build phase and are now part of the spec:

1. **PillButton API** — uses `variant: 'primary' | 'amber'` not arbitrary colour strings.
2. **Custom categories on profile, not separate table** — simpler, fewer queries.
3. **Categories cannot be deleted, only archived** — preserves historical log integrity (e.g., a log tagged "old-category" still shows correctly).
4. **DEV_BYPASS_AUTH** — gated on `__DEV__ && true` so cannot accidentally activate in production.
5. **Google Sign In stubbed in Expo Go** — real package requires native code, restored when development build is configured.
6. **Anthropic API key check deferred to call time** — module init throw was crashing dev environments without keys.
7. **`updateLog` requires userId param** — security defence-in-depth even with RLS in place.
8. **All offline queue flushing happens automatically** — no manual sync UI needed in v1.

---

## Open Questions (to resolve during remaining build)

These came up during the build and are not yet resolved:

1. **Editing UX in History** — tap to open edit modal? Long-press? Swipe action? (Recommend: tap to open edit modal, matching iOS conventions.)
2. **What happens to the streak when timezone changes** — user travels, midnight rolls over differently? (Recommend: trust device local time in v1, document as v2 issue.)
3. **Note length validation** — spec says max 200 chars, is the UI enforcing this with a counter?
4. **Custom category limit** — should there be one? (Recommend: no hard limit in v1, monitor.)
5. **Coach context on recent logs** — should coach know what user has logged recently, or only the static profile? (Recommend: static profile only in v1, recent logs in v2.)
6. **Profile screen edits to onboarding answers** — read-only or editable? (Recommend: editable but only specific fields like name, occupation, goal. Success definition stays read-only as it's a moment-in-time commitment.)
7. **Privacy policy and terms** — auth screen references both with links. URLs needed before Phase 7. (Recommend: simple GitHub Pages site for now.)
8. **Anthropic API key strategy** — every dev needs one for now. (Recommend: document in README, use Anthropic billing alerts to catch runaway usage.)

---

## Guiding Principles (for any future decisions)

1. **Frictionless first.** If a feature adds friction to the core log loop, it needs a strong justification.
2. **Wins over sins.** The app should feel like it's rooting for the user, not judging them.
3. **Awareness is enough.** The app doesn't need to solve the problem — it needs to make the pattern visible.
4. **Honest, not preachy.** AI is useful. The goal is intentional use.
5. **Small and right beats large and wrong.** Ship v1 cleanly, then expand.
6. **The integrity of the log is the product.** No deletion. No type changes. Ever.
