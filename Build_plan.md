# Firsthand — Build Plan & Progress

> Tracks build order, completed tasks, and what's coming next.
> Updated by Jules as part of each task. Do not edit manually outside that flow.

| 3.7 | Undo window (30s) | ✅ Done | Hard delete within 30s window only, undo toast in HomeScreen |

---

## Orchestration Setup

Two-layer AI workflow:
- **Orchestrator (Claude in chat)** — planning, design decisions, writing Jules prompts, reviewing output
- **Builder (Jules / Antigravity)** — executing tasks in the repo, writing code, running SQL
- **Reviewer (GitHub Copilot)** — reviewing every PR before merge

All Jules prompts are written by the Orchestrator. Copilot reviews every PR. Orchestrator approves merges.

---

## Build Order

### ✅ Phase 0 — Foundation
| # | Task | Status | Notes |
|---|---|---|---|
| 0.1 | Repo created and scaffolded | ✅ Done | Expo SDK 54, TypeScript |
| 0.2 | AGENTS.md added | ✅ Done | Strengthened in handoff session |
| 0.3 | docs/SPEC.md populated | ✅ Done | Strengthened in handoff session |
| 0.4 | prototype/firsthand-full.jsx added | ✅ Done | Full working web prototype |
| 0.5 | Theme constants | ✅ Done | All design tokens in `src/constants/theme.ts` |
| 0.6 | Font loading hook | ✅ Done | `src/hooks/useFonts.ts` — Fraunces + DM Sans |
| 0.7 | Supabase client + types | ✅ Done | `src/lib/supabase.ts`, `src/lib/types.ts` |
| 0.8 | Database schema | ✅ Done | `profiles` + `logs` tables, RLS, indexes |
| 0.9 | DB helper functions | ✅ Done | `src/lib/db.ts` — getLogs, insertLog, updateLog, getProfile, upsertProfile. NO delete. |
| 0.10 | Navigation shell | ✅ Done | Custom TabBar, screen placeholders, RootNavigator with onboarding gate, auth state listener |

---

### ✅ Phase 1 — Authentication & Core Infrastructure
| # | Task | Status | Notes |
|---|---|---|---|
| 1.1 | Auth screen | ✅ Done | Apple + Google. Apple gate fix pending. Google stubbed for Expo Go. |
| 1.2 | Auth context / session hook | ✅ Done | `src/hooks/useAuth.ts` — DEV_BYPASS_AUTH active |
| 1.3 | Anthropic client | ✅ Done | `src/lib/anthropic.ts` — fetch only, AbortController, model `claude-sonnet-4-5` |
| 1.4 | Prompt constants | ✅ Done | `src/lib/prompts.ts` — sanitizePromptValue helper, CoachUserProfile type |
| 1.5 | Shared UI components | ✅ Done | Card, PillButton (variant prop), Toast, BrainIcon, ChipIcon, PersonIcon, SendIcon |
| 1.6 | Business logic hooks | ✅ Done | useAuth, useLogs (offline queue + AppState listener), useStats (DST-safe), useProfile |
| 1.7 | Dev auth bypass | ✅ Done | `src/lib/devConfig.ts` — `DEV_BYPASS_AUTH = __DEV__ && true` |
| 1.8 | Google Sign In stub | ✅ Done | `src/lib/googleSignIn.ts` — for Expo Go compatibility |
| 1.9 | Email/password auth | ✅ Done | Added to AuthScreen for dev testing and as production fallback |

---

### 🔄 Phase 2 — Onboarding (in flight)
| # | Task | Status | Notes |
|---|---|---|---|
| 2.1 | Onboarding screen | ✅ Done | Includes sign-in link on Q1, account creation final step |
| 2.2 | Profile creation on complete | ✅ Done | Written after signUp at end of onboarding |

---

### 🔄 Phase 3 — Home Screen (in flight)
| # | Task | Status | Notes |
|---|---|---|---|
| 3.1 | Home screen layout | ✅ Done | Greeting, two buttons, stats row |
| 3.2 | Log modal | ✅ Done | Bottom sheet — category, context, note |
| 3.3 | Streak dots component | ✅ Done | 7-day visual |
| 3.4 | Ratio bar component | ✅ Done | 7-day own work % with personal avg |
| 3.5 | Today's log list | ✅ Done | Collapsible, reverse chronological |
| 3.6 | Offline queue | ✅ Done | Implemented in useLogs — AsyncStorage queue, flushes on reconnect and app foreground |
| 3.7 | Undo window (30s) | ✅ Done | Hard delete within 30s window only, undo toast in HomeScreen |

---

### 🔲 Phase 4 — History Screen
| # | Task | Status | Notes |
|---|---|---|---|
| 4.1 | History screen layout | ✅ Done | Grouped by day, collapsible day headers, mini ratio bar per day |
| 4.2 | Filter pills | ✅ Done | All / Wins / AI uses |
| 4.3 | Log entry edit | ✅ Done | Edit note, category, context only — no type change, no delete |

---

### 🔲 Phase 5 — Coach Screen
| # | Task | Status | Notes |
|---|---|---|---|
| 5.1 | Coach screen layout | ✅ Done | Chat UI, coach identity bar |
| 5.2 | Anthropic API integration | ✅ Done | Uses `callClaude` and `COACH_SYSTEM(profile)` |
| 5.3 | Quick prompts | ✅ Done | Shown on first open, disappear after first user message |

---

### 🔲 Phase 6 — Profile Screen
| # | Task | Status | Notes |
|---|---|---|---|
| 6.1 | Profile screen | ✅ Done | Name, occupation, custom categories management, view onboarding answers, sign out |

---

### 🔲 Phase 7 — Polish & Pre-launch
| # | Task | Status | Notes |
|---|---|---|---|
| 7.1 | Empty states | 🔲 Pending | All screens need explicit empty states |
| 7.2 | Error boundaries | ✅ Done | All main screens (Home, History, Coach, Onboarding) wrapped |
| 7.3 | Loading states | 🔲 Pending | All data-driven components |
| 7.4 | Anthropic API backend proxy | 🔲 Pending | Move API calls server-side — host on Railway |
| 7.5 | App icon + splash screen | 🔲 Pending | Firsthand green dot identity |
| 7.6 | Apple Developer account | 🔲 Pending | Required for real Apple Sign In + TestFlight |
| 7.7 | Development build via EAS | 🔲 Pending | Removes Expo Go limitations, enables Google Sign In |
| 7.8 | Privacy policy + terms | 🔲 Pending | Auth screen references these — need real URLs |
| 7.9 | TestFlight build | 🔲 Pending | First real device test |
| 7.10 | App Store submission | 🔲 Pending | |
| 7.11 | First-launch tutorial | 🔲 Pending | 4-step overlay after onboarding transition — highlights Home buttons, History, Coach. Shown once, stored in AsyncStorage |
| 7.12 | Dead code cleanup | ✅ Done | Removed non-existent `log.cancelled` filter from `getLogs` |

---

## Known Fixes Required

Listed in priority order. Each is small enough to bundle with the next relevant Jules task.

| File / Area | Issue | Fix |
|---|---|---|
| `BUILD_PLAN.md` (Decisions Log) | Said model is Haiku, but code is Sonnet after Copilot's revert | Code is `claude-sonnet-4-5`. Decisions Log updated below. |
| `OnboardingScreen / ProfileContext` | Brief onboarding flicker during account creation — onAuthStateChange fires before setProfile completes | Add `isCreatingAccount` flag to ProfileContext to suppress routing during account creation |
| `src/screens/AuthScreen.tsx` | Apple Sign In gate | ✅ Fixed — `'ios' \|\| 'macos'` |
| `src/screens/AuthScreen.tsx` | Google env var crash on render | ✅ Fixed — deferred to button press |
| `src/lib/devConfig.ts` | DEV_BYPASS_AUTH active | ✅ Fully removed |
| `src/lib/googleSignIn.ts` | Stubbed for Expo Go | Replace with real `@react-native-google-signin/google-signin` once EAS dev build configured |
| `.env.local` | Google client IDs are placeholders | Replace once Google Sign In configured |
| `src/lib/anthropic.ts` | Sonnet model string | ✅ Fixed — `claude-sonnet-4-6` |
| `src/screens/CoachScreen.tsx` | Haiku model string | ✅ Fixed — `claude-haiku-4-5-20251001` |
| `src/lib/db.ts` | `getLogs` filters on non-existent `log.cancelled` field | ✅ Fixed — Removed dead filter |
| `src/lib/db.ts` | `setLogCancelled` does hard delete despite name | ✅ Fixed — Renamed to `deleteLog` for clarity |
| `src/screens/CoachScreen.tsx` | Auto-scroll doesn't reach bottom of last message | Investigate `scrollToEnd` timing — Phase 7 polish |
| `src/screens/CoachScreen.tsx` | API error shows fake fallback question | Show honest error message — Phase 7.10 |
| `src/components/LogModal.tsx` (and EditLogModal) | Note `maxLength` not enforced | Add `maxLength={200}` and counter — Phase 7.9 |
| Profile screen | Custom categories list grows unbounded in UI | Soft cap 20 visible — Phase 7.13 |
| ProfileContext | `isCreatingAccount` flag wired up correctly? | Audit during Phase 7 — set in `try`, cleared in `finally`, checked in RootNavigator |

---

## Key Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Framework | React Native (Expo SDK 54) | iOS first, cross-platform later |
| Database / Auth | Supabase | Auth, RLS, typed client, realtime |
| Hosting (future backend) | Railway | Already paid for, ideal for Anthropic proxy |
| AI model | `claude-sonnet-4-5` | Reverted from Haiku by Copilot review. Sonnet's quality matters for the onboarding reflection moment. Revisit if cost becomes an issue. |
| Fonts | Fraunces (serif) + DM Sans | Warm, distinctive, not generic |
| No log deletion | Enforced in `db.ts` | Integrity of the log is the product |
| No win→sin editing | Enforced in `updateLog` types | Same reason |
| Coach resets per session | v1 decision | Persistent history is a v2 feature |
| Client-side Anthropic calls | v1 only | Backend proxy required before public launch (Phase 7) |
| Offline queue | AsyncStorage | Flushes on reconnect, app foreground, and after successful adds |
| Apple Sign In gate | iOS + macOS | Android/web not supported. macOS gate fix pending. |
| `PillButton` colour API | `variant: 'primary' \| 'amber'` | Type-safe, prevents arbitrary colour strings |
| Auth bypass | `__DEV__ && true` | Cannot accidentally activate in production builds |
| Custom categories | Stored on profile, not as separate table | Simpler, fewer queries |
| Streak logic | "Alive" if today OR yesterday has a win | Avoids penalising users for not opening the app on a single day |
| Apple Developer account | Deferred to Phase 7 | Don't pay $99 until ready for TestFlight |
| Testing surface | Expo Go for now, dev build later | DEV_BYPASS_AUTH and Google stub make Expo Go viable |

---

## Out of Scope — v1

Do not build any of the following until explicitly added to the build plan:

- Push notifications
- Think-first timer
- Weekly intentions / goals
- Social features
- Streak freeze / grace days
- Data export
- VSCode extension
- Browser extension
- Apple Watch app
- Android build (iOS first)
- Backend API proxy (Phase 7)

---

## Jules Prompt Log

| # | Prompt | Outcome |
|---|---|---|
| 12 | Profile screen + AppNavigator stack | ✅ Merged |
| 01 | Theme constants + font loading | ✅ Merged — Copilot fixed font key strings, `Category` type with `string & {}` |
| 02 | Supabase client + types + DB schema + helpers | ✅ Merged — Copilot fixed `.maybeSingle()`, `updateLog` userId param, removed `Database = any` |
| 03 | Navigation shell + tab bar + screen placeholders | ✅ Merged — Copilot fixed unused imports + `onAuthStateChange` subscription |
| 04 | Auth screen (Apple + Google) | ✅ Merged — Copilot fixed platform gate (iOS + macOS), session type, loading scope; Google env-var error handled gracefully |
| 05 | Anthropic client + prompts | ✅ Merged — Copilot added `AbortController`, `sanitizePromptValue`, typed interfaces, reverted Haiku→Sonnet |
| 06 | Shared UI components | ✅ Merged — Copilot fixed safe area insets, `PillButton` variant prop, added `Colors.black` |
| 07 | Business logic hooks | ✅ Merged — Copilot fixed DST-safe dates, `isNetworkError`, AppState listener, UUID fallback |
| 07b | DEV_BYPASS_AUTH | ✅ Merged via Antigravity — `__DEV__ && true` pattern |
| 07c | Google Sign In stub | ✅ Merged via Antigravity — Expo Go compatibility |
| 07d | Email/password auth | ✅ Merged |
| 07e | Remove DEV_BYPASS_AUTH | ✅ Merged |
| 07f | AuthScreen design fix + missing theme tokens | ✅ Merged |
| 08 | Onboarding screen | ✅ Merged |
| 09 | Home screen + LogModal | ✅ Merged |
| 10 | History screen | ✅ Merged |
| 11 | Coach screen | ✅ Merged |
| 12 | Profile screen | 🔲 Pending — prompt ready in handoff document |
| 13 | ProfileContext — shared profile state | ✅ Merged |

| 09 | Home screen + LogModal component | ✅ Merged |
| 09b | Undo window + deleteLog | ✅ Merged |
| 09c | Undo expiry error propagation | ✅ Merged |
| 14 | Fix stale session routing bug | ✅ Merged |
| 15 | Onboarding-first flow + sign-in bug fix | ✅ Merged |
| 16 | AI model flexibility + Haiku for Coach | ✅ Merged |
| 17 | Model string updates (Sonnet 4.6, Haiku dated) | ✅ Merged |
| 18 | Error boundaries — all main screens | ✅ Merged |
| 19 | CI expansion — typecheck on all PRs + expo-doctor | ✅ Merged |

### Hotfixes via Antigravity (smaller, surgical changes)
- RLS DELETE policy added to logs table (resolved silent 204 undo bug)
- `EXPO_PUBLIC_SUPABASE_URL` had `/rest/v1` appended — fixed
- `addLog` race condition fixed (removed `fetchLogs()` after success)
- Offline queue `pendingDeleteTimestamps` ref to prevent undone-log re-insertion
- ProfileContext silent sign-out removed (was incorrectly signing out new users)
- `isCreatingAccount` flag added to ProfileContext
- **HF-01**: Model string updates (Sonnet 4.6, Haiku dated) — ✅ Merged
- **HF-02**: Dead code cleanup — getLogs filter + deleteLog rename — ✅ Merged

---

## Notes for Future Sessions

- All Jules prompts are written by the Orchestrator (Claude in chat)
- Always paste Copilot review comments back to Orchestrator before merging
- Jules agents can run in parallel when touching different folders
- BUILD_PLAN.md should be updated by Jules as part of each task
- Prototype at `prototype/firsthand-full.jsx` is the visual source of truth
- Full spec at `docs/SPEC.md` is the product source of truth
- AGENTS.md in repo root is the agent context file — keep it current
- When in doubt about a convention, search how it's done elsewhere in the codebase first
