# 008 — Exclusion list — Tasks

## Group A — DB & service

- [ ] **T700** Add `excluded_games` table to `database.js` per [plan §DB]. Enable `PRAGMA foreign_keys = ON`.
- [ ] **T701** Create `client/src/services/exclusions.js` per [plan §Service].
- [ ] **T702** Tests: exclude → unexclude round-trip; FK cascade when a game row is deleted.

## Group B — Hook

- [ ] **T710** Create `client/src/hooks/useExclusions.js` (React Query: `Set<packageName>`).
- [ ] **T711** Create `client/src/hooks/useEligibleGames.js` per [plan §Hook].
- [ ] **T712** Swap `useSpin` (003 T210) from `useGames()` to `useEligibleGames()`.

## Group C — UI

- [ ] **T720** Extend `ManageGames.jsx` (from 007 T631):
  - Row component shows icon, name, "Excluded" badge.
  - Action menu: Exclude / Include / Toggle isGame.
- [ ] **T721** Add exclusion reason picker — `<select>` with the three presets + free-text fallback.
- [ ] **T722** Show eligible-count chip on `SpinnerScreen` when `eligible.length < games.length`.

## Group D — Verification

- [ ] **T730** Exclude a game → spin 50 times → confirm it's never picked.
- [ ] **T731** Exclude all → spinner shows empty-state with link to Manage Games. AC #3.
- [ ] **T732** Persistence across restart. AC #4.

## Done when

- All AC pass.
- `useSpin` pool source is `useEligibleGames`.
