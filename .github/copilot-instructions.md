# Firsthand — Copilot Review Instructions

## Project
React Native iOS app (Expo SDK 54, TypeScript strict). Supabase for auth and DB.
Anthropic API for AI features. No Redux — React hooks and context only.

## Design system
- All colours from `src/constants/theme.ts` — never hardcode hex values
- All fonts from `src/constants/theme.ts` Fonts and FontSizes — never hardcode sizes
- All spacing from `src/constants/theme.ts` Spacing and Radius — never hardcode px values
- Violations of the above are always a blocking comment

## Component rules
- All styles in `StyleSheet.create()` — no inline style objects except for dynamic values
- Dynamic styles (e.g. computed widths, animated transforms) may be inline in a style array
- Safe area insets must be handled on every screen-level component
- Custom SVG icons only — no emoji in UI

## Hooks and data
- Never reimplement logic that exists in `useAuth`, `useLogs`, `useStats`, `useProfile`
- `updateLog` must always include `userId` as a parameter
- Supabase queries use `.maybeSingle()` not `.single()` — `.single()` throws on no rows
- All user-provided values passed into Anthropic prompts must go through `sanitizePromptValue()`

## TypeScript
- `any` type is never acceptable — flag every instance
- `catch (error: unknown)` with type narrowing, never `catch (error: any)`
- All async functions must have explicit return types

## Security
- Flag any `EXPO_PUBLIC_*` env var used in a context that would be bundled into the client
- Flag any Anthropic API call without an AbortController timeout
- Flag any Supabase query that filters on id alone without also filtering on user_id

## Integrity rules (product-critical)
- There must be no `deleteLog` or equivalent function — no log deletion ever
- `updateLog` must never allow changing the `type` field (win → sin or vice versa)
- Flag any code that bypasses these constraints