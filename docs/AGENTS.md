# Firsthand — Agent Context

This file is for AI coding agents (Jules, Copilot, etc.) working on the Firsthand codebase.
Read this before making any changes. The full product specification is in `/docs/SPEC.md`.

---

## What This App Is

Firsthand is a personal mobile app that helps people become more aware of their AI reliance
and rebuild their own thinking capabilities. The core loop is simple:

- **Win** — log when you did something yourself
- **Sin** — log when you used AI

No deletion of logs. No changing a win to a sin. The integrity of the log is the product.

Full concept, data model, and feature spec: `/docs/SPEC.md`
Visual reference prototype: `/prototype/firsthand-full.jsx`

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native (Expo SDK, TypeScript) |
| Navigation | Expo Router (file-based routing) |
| Backend / DB | Supabase (Postgres, Auth, Realtime) |
| Auth | Sign in with Apple (required), Google (secondary) |
| AI | Anthropic API — `claude-sonnet-4-5` |
| Storage | AsyncStorage (offline queue) |
| State | React hooks + context (no Redux) |

---

## Project Structure

```
/src
  /screens          — full screens (Home, History, Coach, Onboarding)
  /components       — reusable UI components
  /hooks            — custom React hooks (useAuth, useLogs, etc.)
  /lib              — external service clients (supabase.ts, anthropic.ts)
  /constants        — theme.ts, categories.ts, etc.
/docs
  SPEC.md           — full product specification (source of truth)
/prototype
  firsthand-full.jsx — visual/UX reference prototype
AGENTS.md           — this file
```

---

## Design System

All design constants live in `src/constants/theme.ts`. Always import from there — never hardcode colours or fonts.

### Colours
```typescript
primary: '#2A5C45'       // green — wins, active states, primary actions
primaryLight: '#E8F2ED'  // green tint
amber: '#9C6B1A'         // AI uses, below-average indicators
amberLight: '#FDF3E3'    // amber tint
sinBg: '#FAF5EE'         // sin button / sin log background
sinBorder: '#E8DDD0'     // sin button border
appBg: '#F7F6F3'         // app background
cardBg: '#FFFFFF'        // card background
border: '#F0EEE9'        // card borders
inputBorder: '#E4E0DA'   // input borders
```

### Typography
```typescript
// Headings and numbers
fontSerif: 'Fraunces'    // Google Font — loaded via expo-font

// Body and UI
fontSans: 'DM Sans'      // Google Font — loaded via expo-font
```

### Key Design Rules
- No emoji anywhere — SVG icons only
- Win button is always dominant — green, large, prominent
- Sin button is intentionally quieter — warm sandy tone, not cold or punishing
- Cards use white on `#F7F6F3` background
- Borders are very light (`#F0EEE9`)
- Green used only for wins, active states, and primary actions
- Amber used only for sin-related data and below-average indicators

---

## Data Model

### Log Entry
```typescript
interface LogEntry {
  id: string
  user_id: string
  timestamp: string        // ISO 8601
  type: 'win' | 'sin'
  category: string
  note?: string            // max 200 chars
  context?: 'work' | 'personal'
  duration_mins?: number
  created_at: string
}
```

### User Profile
```typescript
interface UserProfile {
  id: string
  name: string
  occupation: string
  ai_tools_used: string[]
  primary_uses: string[]
  goal: string
  success_definition: string
  custom_categories: string[]
  created_at: string
  onboarded: boolean
}
```

### Log Entry Rules
- **No deletion** of log entries ever
- **No changing** type (win/sin) after creation
- **Editable fields:** note, category, context, duration_mins only

---

## Key Business Logic

### Streak Calculation
- A streak day = any day with at least one win logged
- Consecutive days counting backwards from today
- If today OR yesterday has a win, streak is still alive
- If neither today nor yesterday has a win, streak = 0

### Win Ratio
- `Math.round(wins / (wins + sins) * 100)`
- Window: last 7 days
- Personal average = all-time ratio (used as comparison baseline)

### Default Categories
```typescript
['coding', 'writing', 'planning', 'research', 'other']
```
Users can add custom categories — stored in `UserProfile.custom_categories`.

---

## Screens (v1)

| Screen | File | Notes |
|---|---|---|
| Onboarding | `src/screens/Onboarding.tsx` | AI-powered, 6 questions, runs once |
| Home | `src/screens/Home.tsx` | Two buttons dominate, stats below |
| History | `src/screens/History.tsx` | Grouped by day, collapsible, filterable |
| Coach | `src/screens/Coach.tsx` | Socratic AI, only asks questions |
| Profile | `src/screens/Profile.tsx` | Placeholder for v1 |

Navigation: bottom tab bar — Home, History, Coach. Profile via icon in header.

---

## Anthropic API Usage

### Onboarding
```typescript
model: 'claude-sonnet-4-5'
max_tokens: 150
// System prompt: warm conversational onboarding, 6 questions
// Termination token: ONBOARDING_COMPLETE
```

### Coach
```typescript
model: 'claude-sonnet-4-5'
max_tokens: 120
// System prompt: Socratic coach, one question per turn, never gives answers
// Personalised with: user name, occupation, goal, success_definition
```

**Important:** API calls are client-side in v1. A backend proxy will be added before any public release. Never log or expose API keys.

---

## Supabase

Client initialised in `src/lib/supabase.ts`. Use the typed client throughout — never use raw fetch for Supabase operations.

### Auth
- Sign in with Apple: required (App Store policy)
- Google: secondary option
- Session management via Supabase Auth helpers for Expo

### Sync Strategy
- Offline-first: write to AsyncStorage queue if no connection
- Flush queue to Supabase on reconnect, in chronological order
- Profile syncs on login and after onboarding completes
- All computed values (streak, ratio) calculated client-side from local data

### Tables
- `profiles` — user profile data (1:1 with auth.users)
- `logs` — all win/sin log entries (many:1 with profiles)

---

## Coding Conventions

- **TypeScript strictly** — no `any`, no implicit types
- **Functional components only** — no class components
- **Named exports** for components, default exports for screens
- **Hooks** for any logic shared across components
- **No inline styles** in React Native — use StyleSheet.create()
- **Error boundaries** on all screens
- **Loading and empty states** required on every data-driven component
- Follow existing patterns in the codebase before introducing new ones

---

## What Is Explicitly Out of Scope (v1)

Do not implement any of the following unless explicitly instructed:

- Push notifications
- Think-first timer
- Weekly intentions / goals
- Social features
- Streak freeze / grace days
- Data export
- VSCode extension
- Browser extension
- Apple Watch app
- Android-specific code (build for iOS first)
- Backend API proxy for Anthropic calls

---

## Before Making Any Changes

1. Read `/docs/SPEC.md` for full product context
2. Check the visual prototype at `/prototype/firsthand-full.jsx` for UI/UX reference
3. Import colours and fonts from `src/constants/theme.ts` — never hardcode
4. Follow existing file and naming patterns in the codebase
5. One task at a time — do not scope-creep into adjacent features