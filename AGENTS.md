# Firsthand — Agent Context

This file is the source of truth for AI coding agents working on Firsthand.
Read this BEFORE making any changes. The full product spec is in `/docs/SPEC.md`.
The current build state is in `BUILD_PLAN.md`.

---

## What This App Is

Firsthand is a personal mobile app that helps people become more aware of their AI reliance and rebuild their own thinking capabilities. The core loop:

- **Win** — log when you did something yourself
- **Sin** — log when you used AI

The integrity of the log is the product. No deletion. No changing a win to a sin.

Visual reference: `/prototype/firsthand-full.jsx` (a complete React web prototype).
Product spec: `/docs/SPEC.md`.
Build progress and decisions log: `/BUILD_PLAN.md`.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | React Native (Expo SDK 54, TypeScript) | iOS first |
| Navigation | `@react-navigation/native` + `@react-navigation/bottom-tabs` | Custom TabBar component |
| Backend / DB | Supabase (Postgres, Auth, Realtime) | RLS enabled on all tables |
| Auth | Sign in with Apple (iOS + macOS), Google (stubbed in Expo Go) | Apple required for App Store |
| AI | Anthropic API — `claude-sonnet-4-6` | See decision in BUILD_PLAN about Haiku/Sonnet |
| Local storage | `@react-native-async-storage/async-storage` | Offline queue, session persistence |
| State | React hooks + context (no Redux) | |
| Icons | `react-native-svg` | Custom SVG icons in `src/components/icons/` |
| Fonts | `expo-font` + `@expo-google-fonts/{fraunces,dm-sans}` | |

**Always use `npx expo install <package>`, never `npm install` for Expo packages** — it picks the version that matches the SDK.

---

## Project Structure

```
/src
  /screens          — full screens (Home, History, Coach, Onboarding, Auth, Profile)
  /components       — reusable UI (Card, PillButton, Toast, LogModal, TabBar)
    /icons          — SVG icon components
  /hooks            — custom hooks (useAuth, useLogs, useStats, useProfile, useFonts)
  /lib              — service clients and helpers (supabase, anthropic, db, prompts, devConfig, googleSignIn, types)
  /constants        — theme tokens
  /navigation       — RootNavigator and AppNavigator
/docs
  SPEC.md           — full product specification (source of truth)
/prototype
  firsthand-full.jsx — visual/UX reference prototype
AGENTS.md           — this file
BUILD_PLAN.md       — progress tracker, decisions log, prompt log
App.tsx             — entry point, font loading, NavigationContainer wrapper
```

---

## Design System — `src/constants/theme.ts`

All design constants live here. Always import — never hardcode.

### Colours
```typescript
Colors.primary       // #2A5C45 — green, wins, active states, primary actions
Colors.primaryLight  // #E8F2ED — green tint
Colors.amber         // #9C6B1A — AI uses, below-average indicators
Colors.amberLight    // #FDF3E3 — amber tint
Colors.sinBg         // #FAF5EE — sin button / sin log background
Colors.sinBorder     // #E8DDD0 — sin button border
Colors.appBg         // #F7F6F3 — app background
Colors.cardBg        // #FFFFFF — card background
Colors.border        // #F0EEE9 — card borders
Colors.inputBorder   // #E4E0DA — input borders
Colors.textPrimary   // #1A1A1A — primary text
Colors.textSecondary // #555555 — secondary text
Colors.textMuted     // #AAAAAA — muted text
Colors.textHint      // #C4C0BB — placeholder, hint, label text
Colors.white         // #FFFFFF
Colors.black         // #000000 (added by Copilot for shadow tokens)
Colors.streakEmpty   // #EBEBEB — empty streak dot border
Colors.streakToday   // #CCCCCC — today no-win streak dot
Colors.success       // #34C759 — green status indicator
```

### Typography
```typescript
Fonts.serif            // 'Fraunces_400Regular'
Fonts.serifSemiBold    // 'Fraunces_600SemiBold'
Fonts.sans             // 'DMSans_400Regular'
Fonts.sansMedium       // 'DMSans_500Medium'
```

The strings must match the Google Fonts package export names exactly, otherwise the system font falls back silently.

### Other tokens
```typescript
FontSizes — xs:10, sm:11, base:13, md:15, lg:17, xl:21, xxl:24, hero:30, stat:26
Spacing   — xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, screen:22
Radius    — sm:8, md:12, lg:14, xl:20, xxl:22, pill:20, full:9999
```

### Categories
```typescript
DEFAULT_CATEGORIES = ['coding', 'writing', 'planning', 'research', 'other']
type Category = (typeof DEFAULT_CATEGORIES)[number] | (string & {})
```

The `string & {}` trick preserves autocomplete on the known literals while still allowing arbitrary strings.

### Design Rules
- **No emojis anywhere.** SVG icons only.
- **Win button is dominant** — green, large, prominent, with shadow.
- **Sin button is intentionally quieter** — warm sandy tone, no shadow, but never cold or punishing.
- **Cards** use white on `#F7F6F3` background.
- **Borders are very light** (`#F0EEE9`).
- **Green** is reserved for wins, active states, primary actions.
- **Amber** is reserved for sin-related data and below-average indicators.

---

## Data Model

### `LogEntry`
```typescript
interface LogEntry {
  id: string                  // uuid
  user_id: string             // foreign key to profiles
  timestamp: string           // ISO 8601
  type: 'win' | 'sin'
  category: string
  note?: string               // max 200 chars
  context?: 'work' | 'personal'
  duration_mins?: number
  created_at: string
}
```

### `UserProfile`
```typescript
interface UserProfile {
  id: string                  // matches Supabase auth uid
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

### Hard rules — enforced in `src/lib/db.ts`
- **A `deleteLog` function exists in db.ts but is ONLY called from the 30-second undo window in useLogs.** It performs a hard DELETE scoped by both id and user_id. It must never be exposed to users as a manual delete action. No deletion outside the undo window.
- **Type (win/sin) is immutable** after insert.
- **Editable fields only:** `note`, `category`, `context`, `duration_mins`.
- **All updates are scoped by `user_id`** — `updateLog(id, updates, userId)` filters on both `id` and `user_id` to prevent cross-user updates even if RLS were misconfigured.

---

## Existing Hooks (consume, don't recreate)

### `useAuth(): { session, userId, isLoading, signOut }`
- Initial session fetch via `supabase.auth.getSession()`
- Subscribes to `supabase.auth.onAuthStateChange` for updates
- Cleans up subscription on unmount
- `DEV_BYPASS_AUTH` short-circuits to a dev user when `__DEV__` is true

### `useLogs(userId): { logs, isLoading, error, addLog, editLog, refresh }`
- Fetches logs ordered by timestamp desc
- `addLog` writes optimistically with offline queue fallback
- Offline queue: AsyncStorage key `firsthand_offline_queue`
- Flushes queue on mount, on AppState 'change' to active, and on successful add
- Distinguishes network errors (queue + retry) from server errors (revert + rethrow)
- UUID generation: `globalThis.crypto?.randomUUID` with counter-based fallback

### `useStats(logs): { todayLogs, todayWins, todaySins, streak, weekRatio, personalAvg, aboveAverage, streakDots }`
- **Pure** — no network, no side effects
- Uses `Date#setDate()` for DST-safe day arithmetic
- `todayLogs` filters with both `>= startOfToday` and `< startOfTomorrow`
- `streak` = consecutive days with at least one win, alive if today OR yesterday has a win
- `weekRatio` = wins / total over last 7 days, null if no logs in window
- `streakDots` = 7 booleans, Mon–Sun of current week

### `useProfile(userId): { profile, isLoading, updateProfile }`
- Fetches via `getProfile()` on mount
- `updateProfile` accepts `Partial<Omit<UserProfile, 'id' | 'created_at'>>`
- Updates local state optimistically, upserts to Supabase

### `useFonts(): { fontsLoaded, fontError }`
- Loads Fraunces (400, 500, 600) and DM Sans (300, 400, 500)
- App.tsx returns null until `fontsLoaded === true`
- Logs `fontError` once via `useEffect([fontError])`

---

## Existing Components (consume, don't recreate)

| Component | Path | Notes |
|---|---|---|
| `Card` | `src/components/Card.tsx` | White wrapper, border, radius lg, no padding |
| `PillButton` | `src/components/PillButton.tsx` | `variant: 'primary' \| 'amber'`, spring scale animation |
| `Toast` | `src/components/Toast.tsx` | Auto-hides after 2s, uses `useSafeAreaInsets().top + 16` |
| `TabBar` | `src/components/TabBar.tsx` | Custom bottom tab bar, safe area aware |
| `BrainIcon` | `src/components/icons/BrainIcon.tsx` | Win indicator |
| `ChipIcon` | `src/components/icons/ChipIcon.tsx` | AI use indicator |
| `PersonIcon` | `src/components/icons/PersonIcon.tsx` | Profile nav icon |
| `SendIcon` | `src/components/icons/SendIcon.tsx` | Message send button |

---

## Existing Lib (consume, don't recreate)

| File | Purpose |
|---|---|
| `src/lib/supabase.ts` | Typed Supabase client, throws if env vars missing |
| `src/lib/types.ts` | `LogEntry`, `UserProfile`, `LogType`, `LogContext`, `AppState` |
| `src/lib/db.ts` | `getLogs`, `insertLog`, `updateLog`, `deleteLog`, `getProfile`, `upsertProfile` |
| `src/lib/anthropic.ts` | `callClaude(messages, system, maxTokens)` — fetch only, 30s AbortController, model `claude-sonnet-4-5` |
| `src/lib/prompts.ts` | `ONBOARDING_SYSTEM`, `COACH_SYSTEM`, `ONBOARDING_COMPLETE_TOKEN`, `ONBOARDING_HINTS`, `sanitizePromptValue` |
| `src/lib/devConfig.ts` | `DEV_BYPASS_AUTH`, `DEV_USER` — DEV ONLY, must be removed before production |
| `src/lib/googleSignIn.ts` | Stub for Expo Go compatibility — replace with real import in dev build |

---

## Anthropic API Usage

### `callClaude(messages, system, maxTokens = 150): Promise<string>`
- Native fetch, no SDK
- Model: `claude-sonnet-4-5`
- Headers: `Content-Type: application/json`, `anthropic-version: 2023-06-01`
- API key from `process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY` — checked inside the function (deferred from import time)
- 30-second `AbortController` timeout to handle stalled mobile network requests
- Returns the first text content block as a string
- Throws descriptive errors on non-ok response

### `sanitizePromptValue(value): string`
**Always use this** before embedding any user-provided value in a system prompt. Strips control characters and newlines that could be used for prompt injection.

### `COACH_SYSTEM(profile)`
Accepts `string | CoachUserProfile` where `CoachUserProfile` includes `name`, `occupation`, `goal`, `success_definition`. Personalises the coach prompt accordingly.

**Important:** All Anthropic API calls are client-side in v1. A backend proxy (Railway) will be added before any public release. Never log or expose API keys.

---

## Supabase

Client initialised in `src/lib/supabase.ts`. Use it directly — never raw fetch for Supabase operations.

### Auth
- Sign in with Apple: required (App Store policy). Currently gated on `Platform.OS === 'ios'` only — **needs fix to also support `'macos'`**.
- Google: implementation present but stubbed in Expo Go. Real package is `@react-native-google-signin/google-signin`.
- Session: returned by `useAuth`, type is `Session | null` from `@supabase/supabase-js`.

### Sync Strategy
- Offline-first: write to AsyncStorage queue if no connection
- Flush queue to Supabase on reconnect, on app foreground, and after successful adds
- Profile syncs on login and after onboarding completes
- Computed values (streak, ratio) calculated client-side from local data

### Tables
- `profiles` — 1:1 with `auth.users`, `id` is FK with `on delete cascade`
- `logs` — many:1 with `profiles`
- RLS enabled on both. Policies scope all reads/writes by `auth.uid()`.
- Indexes: `logs(user_id)`, `logs(timestamp desc)`, `logs(type)`

---

## Coding Conventions (these emerged from Copilot reviews — follow them)

### TypeScript
- **Strict throughout.** No `any` except in catch blocks, and even there prefer `unknown`.
- Use `Session | null` from `@supabase/supabase-js`, never `any` for session.
- Use the `string & {}` trick to preserve autocomplete on known-literal-or-string union types.
- Never write `Database = any`. Use proper types or omit the generic.

### Error handling
- **Validate env vars descriptively** — throw at module init for things like Supabase URL, defer to call time for things like API keys that might be checked elsewhere.
- **Use `AbortController` with timeout** for all fetch calls. 30s for Anthropic.
- **Distinguish network errors from server errors** in optimistic updates. Network errors queue for retry; server errors revert and rethrow.
- **Use `useEffect([dep])` for side effects on state changes**, not inline in render.

### Supabase
- **Always use `.maybeSingle()`** instead of `.single()` when a row may not exist. `.single()` throws on zero rows; `.maybeSingle()` returns null.
- **Always include `user_id` in update filters** — never trust `id` alone for security.

### React Native
- **Use `useSafeAreaInsets()`** for safe area calculations, never hardcoded top padding.
- **Use `StyleSheet.create()`** rather than inline styles.
- **Pin Expo packages with `~`** not `^` to stay within the SDK compatibility range.
- **Listen to AppState 'change'** to flush offline queues when the app foregrounds.

### Component design
- **Use variant props** (`'primary' | 'amber'`) rather than arbitrary colour strings.
- **Memoize expensive calculations** with `useMemo`.
- **All loading and empty states required** on every data-driven component.
- **Error boundaries on all screens.**

### Dates
- **Use `Date#setDate()`** for day arithmetic, not fixed millisecond offsets — DST-safe.
- After `setDate`, no need to call `setHours(0,0,0,0)` again unless changing.

### Auth flow
- **Pass session from `onAuthStateChange` directly** — don't re-call `getSession()` on every event.

### Design tokens
- **Never hardcode colours, fonts, sizes, or spacing.** Always import from `src/constants/theme.ts`.
- If a new token is needed, add it to theme.ts in the same task.

---

## What Is Explicitly Out of Scope (v1)

Do not implement any of the following unless explicitly added to the build plan:

- Push notifications
- Think-first timer
- Weekly intentions / goals
- Social features
- Streak freeze / grace days
- Data export
- VSCode extension
- Browser extension
- Apple Watch app
- Android-specific code
- Backend API proxy (Phase 7)

---

## DEV ONLY — currently active in the codebase

These items are intentional dev shortcuts that **must be reversed before any production or TestFlight build**:

1. `src/lib/googleSignIn.ts` stub — replace with real import of `@react-native-google-signin/google-signin` once a development build is configured
2. `Platform.OS === 'ios'` Apple gate in `AuthScreen.tsx` — fix to `'ios' || 'macos'`
3. Placeholder Google client IDs in `.env.local` — replace with real ones when Google OAuth is configured

---

## Before Making Any Changes

1. Read `BUILD_PLAN.md` to see current state and what's in flight
2. Read `/docs/SPEC.md` for full product context if making product-impacting changes
3. Check the visual prototype at `/prototype/firsthand-full.jsx` for UI/UX reference
4. Import colours, fonts, sizes, spacing from `src/constants/theme.ts` — never hardcode
5. Check existing hooks, components, and lib files before creating new ones
6. Follow existing patterns in the codebase before introducing new ones
7. One task at a time — do not scope-creep into adjacent features
8. **Always update `BUILD_PLAN.md` as part of the same PR** to reflect what was done

---

## After Making Changes

1. Run `tsc --noEmit` and verify no errors
2. Verify `npx expo start` launches without error
3. Update `BUILD_PLAN.md`:
   - Mark the relevant task as ✅ Done
   - Add an entry to the Jules Prompt Log
   - Update Known Fixes if any were resolved or introduced
4. Provide a clear PR message listing every file changed and the reason
