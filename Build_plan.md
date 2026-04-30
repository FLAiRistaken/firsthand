# Firsthand — Build Plan & Progress

> Tracks build order, completed tasks, and what's coming next.
> Updated by Jules as part of each task. Do not edit manually outside that flow.
> Last comprehensive review: April 2026.

---

## Orchestration Setup

Three-layer AI workflow:
- **Orchestrator (Claude in chat)** — planning, design decisions, writing Jules prompts, reviewing output
- **Builder (Jules / Antigravity)** — executing tasks in the repo, writing code, running SQL
- **Reviewer (CodeRabbit primary, Copilot when available)** — reviewing every PR before merge

All Jules prompts are written by the Orchestrator. CodeRabbit reviews every PR. Orchestrator approves merges.

---

## Build Order

### ✅ Phase 0 — Foundation
| # | Task | Status | Notes |
|---|---|---|---|
| 0.1 | Repo created and scaffolded | ✅ Done | Expo SDK 54, TypeScript |
| 0.2 | AGENTS.md added | ✅ Done | Strengthened in handoff session |
| 0.3 | docs/SPEC.md populated | ✅ Done | Updated v1.2 in Apr 2026 review |
| 0.4 | prototype/firsthand-full.jsx added | ✅ Done | Drift expected — Phase 7 to refresh |
| 0.5 | Theme constants | ✅ Done | All design tokens in `src/constants/theme.ts` |
| 0.6 | Font loading hook | ✅ Done | `src/hooks/useFonts.ts` — Fraunces + DM Sans |
| 0.7 | Supabase client + types | ✅ Done | `src/lib/supabase.ts`, `src/lib/types.ts` |
| 0.8 | Database schema | ✅ Done | `profiles` + `logs` tables, RLS for SELECT/INSERT/UPDATE/DELETE, indexes |
| 0.9 | DB helper functions | ✅ Done | `getLogs`, `insertLog`, `updateLog`, `getProfile`, `upsertProfile`, `setLogCancelled` (hard delete, see decisions log) |
| 0.10 | Navigation shell | ✅ Done | Custom TabBar, screen placeholders, RootNavigator with onboarding gate, auth state listener |

---

### ✅ Phase 1 — Authentication & Core Infrastructure
| # | Task | Status | Notes |
|---|---|---|---|
| 1.1 | Auth screen | ✅ Done | Apple + Google + Email/password. Apple gate now `'ios' \|\| 'macos'`. Google still stubbed for Expo Go. |
| 1.2 | Auth context / session hook | ✅ Done | `src/hooks/useAuth.ts` — plain hook (singleton supabase client makes context unnecessary) |
| 1.3 | Anthropic client | ✅ Done | `src/lib/anthropic.ts` — fetch only, AbortController, optional model param |
| 1.4 | Prompt constants | ✅ Done | `src/lib/prompts.ts` — sanitizePromptValue, ONBOARDING_SYSTEM, COACH_SYSTEM |
| 1.5 | Shared UI components | ✅ Done | Card, PillButton (variant prop), Toast, BrainIcon, ChipIcon, PersonIcon, SendIcon |
| 1.6 | Business logic hooks | ✅ Done | useAuth, useLogs (offline queue + AppState listener + pendingDeleteTimestamps ref), useStats (DST-safe), useProfile (re-export) |
| 1.7 | Dev auth bypass | ✅ Done | DEV_BYPASS_AUTH **fully removed** from codebase |
| 1.8 | Google Sign In stub | ✅ Done | Still stubbed pending EAS dev build |
| 1.9 | Email/password auth | ✅ Done | Primary auth path during dev — added to AuthScreen |

---

### ✅ Phase 2 — Onboarding
| # | Task | Status | Notes |
|---|---|---|---|
| 2.1 | Onboarding screen | ✅ Done | AI-powered, 6 questions, fade-in account creation step at end. "Sign in" link top-right of Q1 only. |
| 2.2 | Profile creation on complete | ✅ Done | Direct `upsertProfile + setProfile` after `signUp` to avoid React state propagation race |
| 2.3 | Onboarding-first architecture | ✅ Done | App launches into Onboarding without auth. Returning users sign in via Q1 link. |

---

### ✅ Phase 3 — Home Screen
| # | Task | Status | Notes |
|---|---|---|---|
| 3.1 | Home screen layout | ✅ Done | Greeting with name, dynamic subtitle, two log buttons |
| 3.2 | Log modal | ✅ Done | Bottom sheet — category, context, note |
| 3.3 | Streak dots component | ✅ Done | 7-day visual, today index `(getDay()+6)%7` |
| 3.4 | Ratio bar component | ✅ Done | 7-day own work %, badge hidden when ratioDiff is zero |
| 3.5 | Today's log list | ✅ Done | Collapsible, reverse chronological |
| 3.6 | Offline queue | ✅ Done | AsyncStorage queue, flushes on reconnect/foreground/post-add. `pendingDeleteTimestamps` ref prevents undone-log re-insertion |
| 3.7 | Undo window (30s) | ✅ Done | Hard delete via `setLogCancelled`, `useRef` timer, optimistic state update |

---

### ✅ Phase 4 — History Screen
| # | Task | Status | Notes |
|---|---|---|---|
| 4.1 | History screen layout | ✅ Done | Grouped by day, collapsible day headers, mini ratio bar per day |
| 4.2 | Filter pills | ✅ Done | All / Wins / AI uses |
| 4.3 | Log entry edit | ✅ Done | EditLogModal — note, category, context only. No type or timestamp change. |

---

### ✅ Phase 5 — Coach Screen
| # | Task | Status | Notes |
|---|---|---|---|
| 5.1 | Coach screen layout | ✅ Done | Chat UI, coach identity bar |
| 5.2 | Anthropic API integration | ✅ Done | `callClaude` with `claude-haiku-4-5` model + `COACH_SYSTEM(profile)` |
| 5.3 | Quick prompts | ✅ Done | Shown until first user message |
| 5.4 | 20-message session cap | ✅ Done | In-memory only, resets on app close |

---

### 🔄 Phase 6 — Profile Screen
| # | Task | Status | Notes |
|---|---|---|---|
| 6.1 | Profile screen | ✅ Done (prompt 12) | Inline edit name/occupation/goal, read-only success_definition, custom category management, sign out, modal in AppNavigator stack |

---

### 🔲 Phase 7 — Polish & Pre-launch (Re-prioritised April 2026)
| # | Task | Status | Notes |
|---|---|---|---|
| 7.1 | Apple Developer account ($99/yr) | 🔲 Pending | **MOVED UP** — unblocks everything else |
| 7.2 | EAS development build | 🔲 Pending | Removes Expo Go limitations, enables real Apple Sign In testing |
| 7.3 | Railway backend proxy + model string updates | 🔲 Pending | Move Anthropic API server-side. Bundle: update Sonnet to `claude-sonnet-4-6`, Haiku to `claude-haiku-4-5-20251001` |
| 7.4 | Privacy policy + Terms (GitHub Pages) | 🔲 Pending | Required for App Store + Apple Sign In |
| 7.5 | Account deletion path | 🔲 Pending | **NEW** — App Store + GDPR requirement. Profile screen "Delete account" with confirmation, cascading delete of profile + logs + auth user |
| 7.6 | Data export (CSV) | 🔲 Pending | **NEW** — GDPR requirement. Profile screen download all logs as CSV |
| 7.7 | Error boundaries | 🔲 Pending | All screens — moved up because crashes are worse than missing empty states |
| 7.8 | Empty states + loading states audit | 🔲 Pending | Combined — UX-completeness work |
| 7.9 | Note 200-char enforcement | 🔲 Pending | **NEW** — `maxLength={200}` on TextInput + counter when within 20 of limit |
| 7.10 | Coach error UI | 🔲 Pending | **NEW** — when Anthropic fails, show "Coach is having trouble" not fake fallback question |
| 7.11 | Coach session persistence (in-memory only currently) | 🔲 Pending | **NEW** — persist messages to AsyncStorage to survive app backgrounding |
| 7.12 | Dead code cleanup | 🔲 Pending | **NEW** — `getLogs` filters on `log.cancelled` field that doesn't exist on schema |
| 7.13 | Custom category display cap | 🔲 Pending | **NEW** — soft cap 20 visible, "Show all" expansion for 21+ |
| 7.14 | App icon + splash screen | 🔲 Pending | Firsthand green dot identity |
| 7.15 | First-launch tutorial | 🔲 Pending | **DEFERRED** — TestFlight users tell you if needed |
| 7.16 | Anthropic billing alerts | 🔲 Pending | **NEW** — set tight monthly limit on Anthropic console |
| 7.17 | Sentry crash reporting | 🔲 Pending | **NEW** — free tier, essential for TestFlight |
| 7.18 | TestFlight build | 🔲 Pending | First real device test |
| 7.19 | App Store submission | 🔲 Pending | |

---

## Known Fixes Required

| File / Area | Issue | Fix |
|---|---|---|
| `src/screens/AuthScreen.tsx` | Apple Sign In gate | ✅ Fixed — `'ios' \|\| 'macos'` |
| `src/screens/AuthScreen.tsx` | Google env var crash on render | ✅ Fixed — deferred to button press |
| `src/lib/devConfig.ts` | DEV_BYPASS_AUTH active | ✅ Fully removed |
| `src/lib/googleSignIn.ts` | Stubbed for Expo Go | Replace with real `@react-native-google-signin/google-signin` once EAS dev build configured |
| `.env.local` | Google client IDs are placeholders | Replace once Google Sign In configured |
| `src/lib/anthropic.ts` | Sonnet model is `claude-sonnet-4-5` | Update to `claude-sonnet-4-6` (current production Sonnet) — bundle into Phase 7.3 |
| `src/screens/CoachScreen.tsx` | Haiku model is `claude-haiku-4-5` | Update to versioned `claude-haiku-4-5-20251001` — bundle into Phase 7.3 |
| `src/lib/db.ts` | `getLogs` filters on non-existent `log.cancelled` field | Remove dead filter — Phase 7.12 |
| `src/lib/db.ts` | `setLogCancelled` does hard delete despite name | Rename to `deleteLog` for clarity — minor refactor |
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
| AI model — Onboarding | `claude-sonnet-4-5` (currently); `claude-sonnet-4-6` (target) | Quality matters for personalised reflection moment |
| AI model — Coach | `claude-haiku-4-5` (currently); `claude-haiku-4-5-20251001` (target versioned) | Coach is rigid by design — Haiku sufficient and 5x cheaper |
| Fonts | Fraunces (serif) + DM Sans | Warm, distinctive, not generic |
| **No log deletion** | Enforced at architecture level | Integrity of the log is the product |
| **30-second undo via hard delete** | `setLogCancelled` does real DELETE | Different from "no deletion" — a fat-finger save isn't a real log |
| **No win→sin editing** | Enforced in `updateLog` types | Same integrity reason |
| Coach resets per session | v1 decision | Persistent history is v2 feature |
| Coach session message cap | 20 messages | Cost protection without hampering real use |
| Client-side Anthropic calls | v1 only | Backend proxy required before TestFlight (Phase 7.3) |
| Offline queue | AsyncStorage with `pendingDeleteTimestamps` | Flushes on reconnect, foreground, post-add |
| Apple Sign In gate | iOS + macOS | Android/web not supported |
| `PillButton` colour API | `variant: 'primary' \| 'amber'` | Type-safe |
| Custom categories | Stored on profile, not separate table | Simpler, fewer queries |
| **Custom category "archive"** | Actually a remove (string still on past logs) | Pragmatic — past logs preserve the category text |
| Streak logic | Alive if today OR yesterday has a win | Avoids penalising users for missing one day |
| **Onboarding-first architecture** | App launches to Onboarding, not Auth | UX win — users invest before account commitment |
| **ProfileContext for shared state** | Single source of truth | useAuth doesn't need it (Supabase singleton); Profile does |
| **isCreatingAccount flag** | Suppresses routing flicker during account creation | Prevents brief Onboarding flash after signUp |
| **`useProfile()` takes no arguments** | Re-exports from ProfileContext | All callers read shared state, no userId param |
| Email confirmations OFF | Supabase auth setting | Faster dev iteration. Revisit before App Store. |
| **RLS DELETE policy on logs** | Required for undo to work | A 204 with no row removal = missing RLS DELETE policy |
| Apple Developer account | Phase 7 (now moved up to first) | Don't pay $99 until ready, but: it unblocks everything |

---

## Out of Scope — v1

Do not build any of the following until explicitly added to the build plan:

- Push notifications (v2)
- Think-first timer
- Weekly intentions / goals
- Social / sharing features
- Streak freeze / grace days (v2 candidate)
- VSCode extension (v3+)
- Browser extension (v3+)
- Apple Watch app (v3+)
- Android build
- Persistent coach history across sessions (v2)
- Coach context on recent logs (v2 — first thing after launch)
- Cohort comparisons
- Skill-rebuilding curriculum (speculative)

---

## Jules Prompt Log

| # | Prompt | Outcome |
|---|---|---|
| 01 | Theme constants + font loading | ✅ Merged |
| 02 | Supabase client + types + DB schema + helpers | ✅ Merged |
| 03 | Navigation shell + tab bar + screen placeholders | ✅ Merged |
| 04 | Auth screen (Apple + Google) | ✅ Merged |
| 05 | Anthropic client + prompts | ✅ Merged |
| 06 | Shared UI components | ✅ Merged |
| 07 | Business logic hooks | ✅ Merged |
| 07b | DEV_BYPASS_AUTH (Antigravity) | ✅ Merged |
| 07c | Google Sign In stub (Antigravity) | ✅ Merged |
| 07d | Email/password auth | ✅ Merged |
| 07e | Remove DEV_BYPASS_AUTH | ✅ Merged |
| 07f | AuthScreen design fix + missing theme tokens | ✅ Merged |
| 08 | Onboarding screen (AI-powered) | ✅ Merged |
| 09 | Home screen + LogModal | ✅ Merged |
| 09b | Undo window + deleteLog | ✅ Merged |
| 09c | Undo expiry error propagation | ✅ Merged |
| 10 | History screen + EditLogModal | ✅ Merged |
| 11 | Coach screen + 20-message cap | ✅ Merged |
| 12 | Profile screen + AppNavigator stack | ✅ Merged  |
| 13 | ProfileContext — shared profile state | ✅ Merged |
| 14 | Fix stale session routing bug | ✅ Merged |
| 15 | Onboarding-first flow + sign-in bug fix | ✅ Merged |
| 16 | AI model flexibility + Haiku for Coach | ✅ Merged |

### Hotfixes via Antigravity (smaller, surgical changes)
- RLS DELETE policy added to logs table (resolved silent 204 undo bug)
- `EXPO_PUBLIC_SUPABASE_URL` had `/rest/v1` appended — fixed
- `addLog` race condition fixed (removed `fetchLogs()` after success)
- Offline queue `pendingDeleteTimestamps` ref to prevent undone-log re-insertion
- ProfileContext silent sign-out removed (was incorrectly signing out new users)
- `isCreatingAccount` flag added to ProfileContext

---

## Notes for Future Sessions

- All Jules prompts are written by the Orchestrator (Claude in chat)
- Always paste CodeRabbit (and Copilot if available) review comments back to Orchestrator before merging
- Jules agents can run in parallel **only when touching different folders/files**
- BUILD_PLAN.md should be updated by Jules as part of each task
- Prototype at `prototype/firsthand-full.jsx` is the visual source of truth, but expect drift — Phase 7 will refresh it
- Full spec at `docs/SPEC.md` is the product source of truth
- AGENTS.md in repo root is the agent context file — keep it current
- When in doubt about a convention, search how it's done elsewhere in the codebase first
- **Lesson learned:** if you ever see DELETE returning 204 with the row still in DB, **check Supabase RLS policies first** before any code investigation
