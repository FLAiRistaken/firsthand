# Firsthand — Build Plan & Progress

> This file tracks the build order, completed tasks, and what's coming next.
> Updated by Jules as part of each task. Do not edit manually.

---

## Orchestration Setup

This project is being built using a two-layer AI workflow:
- **Orchestrator (Claude)** — planning, design decisions, writing Jules prompts, reviewing output
- **Builder (Jules / GitHub Copilot)** — executing tasks in the repo, writing code, running SQL

All Jules prompts are written by the Orchestrator. Copilot reviews every PR before merge.

---

## Build Order

### ✅ Phase 0 — Foundation
| # | Task | Status | Notes |
|---|---|---|---|
| 0.1 | Repo created and scaffolded | ✅ Done | Expo TypeScript template via Copilot |
| 0.2 | AGENTS.md added | ✅ Done | Agent context file in repo root |
| 0.3 | docs/SPEC.md populated | ✅ Done | Full product specification |
| 0.4 | prototype/firsthand-full.jsx added | ✅ Done | Full working React prototype |
| 0.5 | Theme constants | ✅ Done | `src/constants/theme.ts` — includes Colors.black added by Copilot |
| 0.6 | Font loading hook | ✅ Done | `src/hooks/useFonts.ts` — Fraunces + DM Sans |
| 0.7 | Supabase client + types | ✅ Done | `src/lib/supabase.ts`, `src/lib/types.ts` |
| 0.8 | Database schema | ✅ Done | `profiles` + `logs` tables, RLS enabled |
| 0.9 | DB helper functions | ✅ Done | `src/lib/db.ts` — getLogs, insertLog, updateLog, getProfile, upsertProfile. No delete. |
| 0.10 | Navigation shell | ✅ Done | Tab bar, screen placeholders, onboarding gate, auth state listener |

---

### ✅ Phase 1 — Authentication & Core Infrastructure
| # | Task | Status | Notes |
|---|---|---|---|
| 1.1 | Auth screen | ✅ Done | Apple (iOS + macOS*) + Google. *macOS gate fix pending — see Known Fixes |
| 1.2 | Auth context / session hook | ✅ Done | `src/hooks/useAuth.ts` |
| 1.3 | Anthropic client | ✅ Done | `src/lib/anthropic.ts` — fetch only, 30s timeout, AbortController, claude-haiku-4-5 |
| 1.4 | Prompt constants | ✅ Done | `src/lib/prompts.ts` — sanitizePromptValue, CoachUserProfile type |
| 1.5 | Shared UI components | ✅ Done | Card, PillButton, Toast, BrainIcon, ChipIcon, PersonIcon, SendIcon |
| 1.6 | Business logic hooks | ✅ Done | useAuth, useLogs (offline queue), useStats (DST-safe), useProfile |

---

### 🔲 Phase 2 — Onboarding
| # | Task | Status | Notes |
|---|---|---|---|
| 2.1 | Onboarding screen | 🔲 Next | AI-powered, 6 questions, Anthropic API |
| 2.2 | Profile creation on complete | 🔲 Pending | Write profile to Supabase on ONBOARDING_COMPLETE |

---

### 🔲 Phase 3 — Home Screen
| # | Task | Status | Notes |
|---|---|---|---|
| 3.1 | Home screen layout | 🔲 Pending | Greeting, two buttons, stats row |
| 3.2 | Log modal | 🔲 Pending | Bottom sheet — category, context, note |
| 3.3 | Streak dots component | 🔲 Pending | 7-day visual |
| 3.4 | Ratio bar component | 🔲 Pending | 7-day own work % with personal avg |
| 3.5 | Today's log list | 🔲 Pending | Collapsible, reverse chronological |
| 3.6 | Offline queue | ✅ Done | Implemented in useLogs — AsyncStorage queue, flushes on reconnect and app foreground |

---

### 🔲 Phase 4 — History Screen
| # | Task | Status | Notes |
|---|---|---|---|
| 4.1 | History screen layout | 🔲 Pending | Grouped by day, collapsible |
| 4.2 | Filter pills | 🔲 Pending | All / Wins / AI uses |
| 4.3 | Log entry edit | 🔲 Pending | Edit note, category, context only — no type change, no delete |

---

### 🔲 Phase 5 — Coach Screen
| # | Task | Status | Notes |
|---|---|---|---|
| 5.1 | Coach screen layout | 🔲 Pending | Chat UI, coach identity bar |
| 5.2 | Anthropic API integration | 🔲 Pending | Uses callClaude from src/lib/anthropic.ts |
| 5.3 | Quick prompts | 🔲 Pending | Shown on first open, disappear after first message |

---

### 🔲 Phase 6 — Profile Screen
| # | Task | Status | Notes |
|---|---|---|---|
| 6.1 | Profile screen | 🔲 Pending | Name, occupation, custom categories, sign out |

---

### 🔲 Phase 7 — Polish & Pre-launch
| # | Task | Status | Notes |
|---|---|---|---|
| 7.1 | Empty states | 🔲 Pending | All screens need empty states |
| 7.2 | Error boundaries | 🔲 Pending | All screens |
| 7.3 | Loading states | 🔲 Pending | All data-driven components |
| 7.4 | Anthropic API backend proxy | 🔲 Pending | Move API calls server-side — host on Railway |
| 7.5 | App icon + splash screen | 🔲 Pending | Firsthand green dot identity |
| 7.6 | TestFlight build | 🔲 Pending | First real device test |
| 7.7 | App Store submission | 🔲 Pending | |

---

## Known Fixes Required

| File | Issue | Fix |
|---|---|---|
| `src/screens/AuthScreen.tsx` | Apple Sign In gated on `Platform.OS === 'ios'` only | Change to `Platform.OS === 'ios' \|\| Platform.OS === 'macos'` |
| `src/screens/AuthScreen.tsx` | Expo Go crash on Google Sign-In import | Google Sign In stubbed for Expo Go compatibility. Restore @react-native-google-signin/google-signin import when development build is configured. |

---

## Key Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Framework | React Native (Expo) | iOS first, cross-platform later |
| Database / Auth | Supabase | Auth, RLS, typed client — perfect for mobile |
| Hosting (future backend) | Railway | Already paid for, ideal for Anthropic proxy server |
| AI model | claude-haiku-4-5 | Speed and cost — upgrade onboarding to Sonnet if quality insufficient after testing |
| Fonts | Fraunces (serif) + DM Sans | Warm, distinctive, not generic |
| No log deletion | Enforced | Integrity of the log is the product |
| No win→sin editing | Enforced | Same reason |
| Coach resets per session | v1 decision | Persistent history is a v2 feature |
| Client-side Anthropic calls | v1 only | Backend proxy required before public launch (Phase 7) |
| Offline queue | AsyncStorage | Flushes on reconnect and app foreground via AppState listener |
| Apple Sign In gate | iOS + macOS | Android/web not supported — fix pending in AuthScreen |
| PillButton | variant prop (primary/amber) | Type-safe, prevents arbitrary colour strings |

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
| 01 | Theme constants + font loading | ✅ Merged — Copilot fixed font key strings and Category type |
| 02 | Supabase client + types + DB schema + helpers | ✅ Merged — Copilot fixed maybeSingle(), updateLog userId param |
| 03 | Navigation shell + tab bar + screen placeholders | ✅ Merged — Copilot fixed unused imports + auth state subscription |
| 04 | Auth screen (Apple + Google) | ✅ Merged — Copilot fixed platform gate, session type, loading scope |
| 05 | Anthropic client + prompts | ✅ Merged — Copilot added AbortController, sanitizePromptValue, typed interfaces |
| 06 | Shared UI components | ✅ Merged — Copilot fixed safe area insets, PillButton variant prop |
| 07 | Business logic hooks | ✅ Merged — Copilot fixed DST-safe dates, isNetworkError, AppState listener |
| 08 | Onboarding screen | 🔲 Next |

---

## Notes for Future Sessions

- All Jules prompts are written by the Orchestrator (Claude at claude.ai)
- Always paste Copilot review comments back to Orchestrator before merging
- Jules agents can run in parallel when touching different folders
- BUILD_PLAN.md should be updated by Jules as part of each task
- Prototype at `prototype/firsthand-full.jsx` is the visual source of truth
- Full spec at `docs/SPEC.md` is the product source of truth
- AGENTS.md in repo root is the agent context file — keep it current