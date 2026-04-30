# Firsthand — Product Specification

> Version 1.2 · Living document · Updated April 2026 after Phase 6 substantially complete

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
| Navigation | `@react-navigation/native` + bottom tabs + stack for modals | Custom TabBar; AppNavigator wraps Tab in Stack for Profile modal |
| Backend / DB | Supabase | Auth, Postgres, RLS (SELECT/INSERT/UPDATE/DELETE), realtime |
| Auth | Email/password (primary), Sign in with Apple (iOS + macOS, ready), Google (stubbed) | Apple required for App Store |
| AI / Coach | Anthropic API | Onboarding: `claude-sonnet-4-5` (target: `claude-sonnet-4-6`). Coach: `claude-haiku-4-5` (target: `claude-haiku-4-5-20251001`). Client-side in v1, backend proxy in Phase 7 |
| Sync | Offline-first | AsyncStorage queue, flush on reconnect or foreground |
| Local storage | `@react-native-async-storage/async-storage` | |
| Icons | `react-native-svg` | Custom SVG components |
| Fonts | `expo-font` + Google Fonts (Fraunces, DM Sans) | |
| Code review | CodeRabbit (primary), GitHub Copilot (when available) | `.coderabbit.yaml` config + `.github/copilot-instructions.md` |

**Future platforms (post-v1):**
- Android
- macOS app
- Apple Watch (quick log tap) — v3 candidate
- VSCode extension (developer-focused, separate repo) — v3 candidate
- Browser extension (separate repo) — v3 candidate

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
  note?: string               // optional, max 200 chars (enforced in UI Phase 7.9)
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
  success_definition: string  // verbatim from onboarding Q6 (read-only after onboarding)
  custom_categories: string[]
  created_at: string
  onboarded: boolean
}
```

### Computed Values (client-side)
- **Win streak** — consecutive days with at least one win log
- **Win ratio** — wins / total over last 7 days, as a percentage
- **Personal average** — win ratio over all time, used as comparison baseline
- **Ratio diff** — `weekRatio - personalAvg` — badge hidden when zero
- **Streak dots** — array of 7 booleans, Mon–Sun of current week (today index `(getDay()+6)%7`)

---

## Log Entry Rules

- **No deletion of past logs.** A win is a win, a sin is a sin. The integrity of the log is the product.
- **Exception: 30-second undo window.** Immediately after creating a log, a toast appears with an "Undo" button. Tapping it within 30 seconds **hard-deletes** the row from Supabase. After 30 seconds the log is permanent. This is implemented via the `setLogCancelled` function in `db.ts` (despite the name, it does a real DELETE — name is technical debt).
- **Editable fields** — `note`, `category`, `context`, `duration_mins`
- **Non-editable fields** — `type` (win/sin), `timestamp`, `id`, `user_id`, `created_at`
- **No changing a win to a sin or vice versa**
- **All updates scoped by `user_id`** — `updateLog(id, updates, userId)` filters on both for security defence-in-depth (RLS already enforces this server-side)

---

## Default Categories

```
coding · writing · planning · research · other
```

Users can add their own. Custom categories stored in `UserProfile.custom_categories` and persist across devices.

**Limits:**
- 30 character max per category name
- Trimmed and lowercased on add
- Duplicate detection (against defaults + existing custom)
- No hard count limit, but UI displays max 20 with "Show more" expansion (Phase 7.13)

**"Archiving" is actually a remove** — when a user removes a custom category, it's spliced out of `custom_categories[]`. Past logs that used the category still display correctly because the category string lives on the log row, not as a foreign key. There is no archived list — past logs preserve the category text.

---

## Architecture Decisions (Required Reading)

These are non-negotiable architectural decisions made during the build. Do not undo without explicit discussion.

### 1. Onboarding-first, not auth-first

The app launches into Onboarding without requiring authentication. New users complete 6 questions, see a personalised AI reflection, and only then create their account at the end of onboarding. This is a UX win — users invest in the product before being asked for their email.

Returning users who deleted and reinstalled the app see a "Sign in" link in the top-right corner of question 1 only. This is the escape hatch.

### 2. ProfileContext owns profile state

Every component that needs profile data reads from `useProfile()` (no arguments), which re-exports from `useProfileContext()`. There must only ever be ONE `<ProfileProvider>` in the tree, mounted in `RootNavigator`. This avoids the stale-state bug that occurs when multiple instances of `useProfile(userId)` create independent state copies.

`useAuth` doesn't need a context — Supabase's client is a singleton, so all hook instances stay synchronised through `onAuthStateChange`.

### 3. `isCreatingAccount` flag in ProfileContext

Set to `true` at the start of `handleCreateAccount`, cleared in the `finally` block. RootNavigator checks this flag in its `isScreenLoading` calculation to suppress routing decisions during the brief window where session is set but profile is still being written. Without this, the user sees a flicker back to Onboarding before transitioning to Home.

### 4. `addLog` does not call `fetchLogs()` after success

It updates state directly to swap the optimistic temp-ID entry for the server-confirmed entry. Re-fetching here causes race conditions with `deleteLog` if the user undoes a log immediately after creating it.

### 5. Offline queue with `pendingDeleteTimestamps` ref

Logs queued offline can be undone before they sync. The `pendingDeleteTimestamps` ref tracks logs that have been deleted but may still exist in the queue. `flushOfflineQueue` filters against this set before processing.

### 6. RLS DELETE policy on logs is required

The undo bug spent over an hour debugging in initial build. The symptom: DELETE returning 204 with the row still present in the database. The cause: missing RLS DELETE policy. **If you ever see this pattern again, check Supabase RLS policies first.**

```sql
CREATE POLICY "Users can delete own logs"
ON logs FOR DELETE
USING (auth.uid() = user_id);
```

---

## Screens (v1)

### 1. Onboarding
- Runs first on app launch — no auth required
- AI-powered conversational flow — 6 questions, one at a time
- Powered by Anthropic API with warm, conversational system prompt
- Progress bar at top showing completion (1 of 6, 2 of 6, etc.)
- "Sign in" link in top-right of question 1 only — for returning users
- On Q6 completion: personalised 2-sentence reflection
- After reflection: account creation form fades in (email + password + create button)
- On account creation: `signUp` then direct `upsertProfile + setProfile` to bypass React state propagation timing issues

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
- Q6 → `success_definition` (read-only after onboarding)

---

### 2. Home (primary screen)
The heart of the app. Must feel clean, fast, and focused.

**Layout (top to bottom):**
- Status bar + Firsthand header + PersonIcon button (top right, 34×34 circle, opens Profile modal)
- Greeting — "{Morning/Afternoon/Evening}, {name}." with dynamic subtitle based on today's activity
- **Two large buttons** — these dominate the screen
  - "I did it myself" — green (`Colors.primary`), prominent, with shadow, ghost BrainIcon background
  - "I used AI" — warm sandy tone (`Colors.sinBg`), no shadow, ghost ChipIcon background, intentionally quieter
- Stats row — wins today / AI uses today / streak (Card, single row, three columns with vertical dividers)
- Ratio + streak card — 7-day own-work %, badge hidden when ratioDiff is zero, 7-dot streak display Mon–Sun
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
- Category pills (defaults + custom) with "+ new" option
- Context toggle (work / personal)
- Optional note input (200 char max — Phase 7.9 to enforce in UI)
- Cancel / Save buttons

**Undo toast (after save):**
- Card-style toast at top of screen
- Shows category + "Tap undo to remove it"
- 30-second timer (`useRef`)
- "Undo" button — calls `deleteLog`, hard-deletes the row from Supabase
- Auto-dismisses after 30 seconds

**Design intent:** The green win button is the dominant visual element. The sin button is intentionally quieter — present and warm, not cold or punishing, but clearly secondary.

---

### 3. History
- Grouped by day (Today, Yesterday, then weekday + date for older)
- Today and Yesterday expanded by default, older days collapsed
- Each day header: day label, W·A count, mini ratio bar (48px wide) — all tappable to expand/collapse
- Filter pills at top: All / Wins / AI uses
- Each log entry shows: icon, category, context badge (if set), note (if set), time
- Wins tinted green, sins tinted warm sandy

**Edit behaviour:**
- Tap a log entry to open `EditLogModal`
- Editable: `note`, `category`, `context`
- Non-editable: `type` (win/sin), `timestamp`
- No delete option (the 30-second undo window is the only deletion path)

**Empty state:** "Nothing logged yet. Hit one of the big buttons to start."

---

### 4. Coach
- Socratic AI coach powered by Anthropic API via `callClaude` and `COACH_SYSTEM(profile)`
- Uses `claude-haiku-4-5` model — sufficient for one-question-per-turn rigid format
- **System prompt rules:** One question per turn, never give advice or answers, never tell the user what to do, warm and human, uses the user's name and knows their `goal` and `success_definition` from profile
- Coach identity bar at top — "The Coach", "Only asks questions. Never answers them.", green status dot
- Quick prompt suggestions shown on first open, disappear once conversation starts
- Standard chat bubble UI — user messages right (green), coach messages left (white)
- Animated typing indicator while waiting (three pulsing dots, staggered)
- **20-message session cap** — graceful fallback message when reached
- **Conversation persists within a session, resets when app is killed and reopened.** Persistent history is a v2 feature.

**Quick prompts (shown when conversation has only opening message):**
- "I used AI when I didn't need to"
- "I want to talk about a win"
- "I'm struggling with a habit"
- "I feel like I'm getting worse at thinking"

---

### 5. Profile / Settings (modal stack push)
Accessed via PersonIcon button in Home, History, or Coach headers.

**Sections:**
- **Header:** Avatar with PersonIcon, inline-editable name (Fraunces), inline-editable occupation
- **Your goals:** Inline-editable goal, read-only success_definition with caption "Set during onboarding — locked in"
- **AI tools:** Display-only pills showing `ai_tools_used` from onboarding
- **Custom categories:** Default categories shown as display-only pills. Custom categories with long-press to remove (with confirmation alert). Add new with 30-char limit + duplicate check.
- **Account:** Sign out button with confirmation. (Phase 7.5: Delete account button. Phase 7.6: Export my data button.)
- **Footer:** "Firsthand v0.1.0" + build identifier

**No DEV_BYPASS_AUTH banner** — that flag was fully removed from the codebase.

---

### 6. First-launch tutorial (Phase 7 — possibly deferred)

A 4-step overlay shown once after the user completes onboarding and lands on Home for the first time.

**Steps:**
1. Home — "Tap the green button every time you do something yourself"
2. Log modal — "Categorise it briefly. Notes are optional."
3. History tab — "See your pattern over time"
4. Coach tab — "Talk through your AI habits here"

Implementation: semi-transparent overlay with a spotlight cutout and a short label, advancing on tap. Stored in AsyncStorage so it never repeats.

**Decision pending:** TestFlight users will tell you whether the tutorial is actually needed. Don't build polish before validating the core loop.

---

## Navigation

**Three tabs:** Home · History · Coach

**Profile/settings** accessed via PersonIcon in top-right header (modal stack push from any tab).

**AppNavigator structure:**
```
RootNavigator (auth + onboarding gate)
├── ProfileProvider (when session exists)
│   ├── AuthScreen (no session)
│   ├── OnboardingScreen (session, !profile.onboarded)
│   └── AppNavigator (Stack)
│       ├── Tabs (Tab.Navigator)
│       │   ├── Home
│       │   ├── History
│       │   └── Coach
│       └── Profile (modal presentation)
```

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

**Implementation details:**
- All day arithmetic uses `Date#setDate()` for DST safety, not millisecond offsets
- Today index in streak dots: `(new Date().getDay() + 6) % 7` — maps Sun=0..Sat=6 to Mon=0..Sun=6
- Trusts device local time in v1. Timezone-aware streaks are a v2 issue.

---

## Win Ratio

- Calculated as: `Math.round(wins / (wins + sins) * 100)`
- Default window: last 7 days (from now)
- Personal average = all-time ratio, used as comparison baseline
- `ratioDiff` = `weekRatio - personalAvg`
- Badge shown when `ratioDiff !== null && ratioDiff !== 0`:
  - `ratioDiff > 0`: "↑ N% above avg" (green)
  - `ratioDiff < 0`: "↓ N% below avg" (amber)
- `weekRatio` returns `null` if no logs in the 7-day window — show "Log wins and sins to see your ratio" placeholder
- Personal-average baseline only meaningful after ~10 days of usage — until then, badge often hidden

---

## API Usage

### Onboarding
```
Model:      claude-sonnet-4-5 (target: claude-sonnet-4-6)
Max tokens: 150
System:     ONBOARDING_SYSTEM (in src/lib/prompts.ts)
Termination: ONBOARDING_COMPLETE_TOKEN appended to final message
```

### Coach
```
Model:      claude-haiku-4-5 (target: claude-haiku-4-5-20251001)
Max tokens: 120
System:     COACH_SYSTEM(profile) — personalised with name, occupation, goal, success_definition
History:    Full conversation sent each turn (capped at 20 user messages)
```

### Security
- All user-provided values passed into prompts go through `sanitizePromptValue()` first (strips control chars and newlines)
- 30-second `AbortController` timeout on every fetch
- API key checked at call time, not module init (so missing key in dev doesn't crash the app)
- `callClaude` accepts optional `model` parameter (defaults to Sonnet, Coach overrides to Haiku)

**Current approach:** Client-side API calls (key in `.env.local`). **Backend proxy on Railway must be added before TestFlight** — TestFlight counts as shipped for API key exposure purposes.

---

## Sync & Offline

- All log writes attempted immediately to Supabase via `useLogs.addLog`
- Optimistic update with temp ID — replaced with server-confirmed entry on success
- If offline (network error): write to local AsyncStorage queue (`firsthand_offline_queue`)
- On reconnect: flush queue to Supabase in chronological order
- Profile syncs on login and after onboarding completes
- Computed values (streak, ratio, dots) calculated client-side from local data
- Queue flushes:
  - On `useLogs` mount
  - On AppState 'change' to 'active' (app foreground)
  - After every successful add
- `pendingDeleteTimestamps` ref tracks undone logs to prevent re-insertion from queue

**Network errors are queued for retry. Server errors (4xx/5xx with status code) revert the optimistic update and rethrow to the caller.**

---

## Auth Flow

1. App launches → RootNavigator checks `useAuth().session`
2. **No session** → Onboarding (returning users sign in via Q1 link)
3. **Session + `profile.onboarded === true`** → AppNavigator (tabs)
4. **Session + `profile.onboarded === false`** → Onboarding (resume)
5. **Session + no profile (broken state)** → Onboarding + silent `signOut` via `useEffect`

All transitions handled by `supabase.auth.onAuthStateChange` subscription combined with `ProfileContext` state.

**Sign in with Apple:** Native via `expo-apple-authentication`, exchanges identity token with Supabase via `signInWithIdToken({ provider: 'apple' })`. Gated on `Platform.OS === 'ios' || Platform.OS === 'macos'`.

**Sign in with Google:** Currently stubbed for Expo Go compatibility. Real implementation requires `@react-native-google-signin/google-signin` and EAS development build.

**Email/password:** Primary path during dev. `supabase.auth.signInWithPassword` and `supabase.auth.signUp`. Email confirmations are disabled in Supabase Auth settings for dev (revisit before App Store).

---

## Out of Scope — v1

The following were considered and deliberately excluded from v1:

- Push notifications (v2)
- Think-first timer
- Intentions / weekly goals
- Complex scoring systems
- Social features / sharing
- Streak freeze / grace days (v2 candidate)
- Data export (Phase 7 — App Store requirement)
- Account deletion (Phase 7 — App Store requirement)
- VSCode extension (v3 candidate)
- Browser extension (v3 candidate)
- Apple Watch app (v3 candidate)
- Android build
- Persistent coach history across sessions (v2)
- Coach context on recent logs (v2 — first feature post-launch)
- Profanity / abuse filters on custom categories
- Server-side timezone handling

---

## Decisions Made During Build

These were decided during the build phase and are now part of the spec. Some were originally in the v1.0 spec; many were added during Phases 2-6.

**Architecture:**
1. **Onboarding-first, not auth-first** — UX win. Account creation at end of onboarding.
2. **ProfileContext for shared profile state** — single source of truth, no stale instances.
3. **`useProfile()` takes no arguments** — re-exports from ProfileContext, all callers read shared state.
4. **`useAuth` is a plain hook** — Supabase client singleton makes context unnecessary.
5. **`isCreatingAccount` flag** — suppresses routing flicker during account creation.
6. **`addLog` does not call `fetchLogs()` after success** — direct state update prevents race conditions.
7. **Offline queue uses `pendingDeleteTimestamps` ref** — prevents re-insertion of undone logs.

**Product:**
8. **30-second undo via hard delete** — different from "no log deletion" rule. Fat-finger errors aren't real logs.
9. **Custom category "archive" is actually a remove** — past logs preserve the category text on the row.
10. **Coach uses Haiku, Onboarding uses Sonnet** — quality split based on task requirements.
11. **Coach has 20-message session cap** — cost protection, resets when app is killed.
12. **Categories cannot be deleted from defaults** — display-only.

**Technical:**
13. **DEV_BYPASS_AUTH fully removed** — was `__DEV__ && true`, now eliminated.
14. **Custom categories on profile, not separate table** — simpler, fewer queries.
15. **`PillButton` API** — `variant: 'primary' | 'amber'`, type-safe.
16. **`updateLog` requires userId param** — security defence-in-depth even with RLS.
17. **`setLogCancelled` does hard delete** — function name is technical debt, intent is delete.
18. **All offline queue flushing happens automatically** — no manual sync UI in v1.
19. **Email confirmations OFF in Supabase** — dev convenience, revisit before App Store.
20. **RLS policies for SELECT/INSERT/UPDATE/DELETE all required** — DELETE often forgotten.

---

## Resolved Open Questions

1. **Editing UX in History** — Resolved: tap to open EditLogModal.
2. **Custom category limit** — Resolved: 30 char max per name. No hard count limit but soft display cap of 20.
3. **Coach context on recent logs** — Deferred to v2 (first feature post-launch).
4. **Profile screen edits** — Resolved: name, occupation, goal editable. success_definition read-only.
5. **Note length validation** — In progress: 200 char limit added to spec, UI enforcement Phase 7.9.

## Still Open

1. **Streak across timezones** — v1 trusts device local time. v2 stores timezone on profile.
2. **Privacy policy + Terms** — Phase 7.4 (GitHub Pages site).
3. **Anthropic API key strategy** — Phase 7.3 (Railway proxy).
4. **First-launch tutorial** — Build only if TestFlight users say it's needed.

---

## Guiding Principles (for any future decisions)

1. **Frictionless first.** If a feature adds friction to the core log loop, it needs a strong justification.
2. **Wins over sins.** The app should feel like it's rooting for the user, not judging them.
3. **Awareness is enough.** The app doesn't need to solve the problem — it needs to make the pattern visible.
4. **Honest, not preachy.** AI is useful. The goal is intentional use.
5. **Small and right beats large and wrong.** Ship v1 cleanly, then expand.
6. **The integrity of the log is the product.** No deletion of past logs (the 30-second undo window is the only exception). No type changes. Ever.
7. **When in doubt, check RLS.** Many silent Supabase failures are RLS policy gaps.
