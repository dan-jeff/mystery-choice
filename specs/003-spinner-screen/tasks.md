# 003 — Spinner screen — Tasks

## Group A — Component scaffolding

- [ ] **T200 [P]** Create `client/src/components/spinner/config.js` exporting `SPIN_DURATION_MS`, `FULL_ROTATIONS`, `MAX_VISIBLE_SLOTS`.
- [ ] **T201 [P]** Create `client/src/components/spinner/Background.jsx` — full-bleed Tailwind gradient.
- [ ] **T202 [P]** Create `client/src/components/spinner/SpinButton.jsx` taking `{ state, onClick }`, rendering "Spin" / "Spinning…" / "Spin again" by state.
- [ ] **T203** Create `client/src/components/spinner/SpinnerWheel.jsx` per [plan §Animation]:
  - Accepts `games`, `spinningTo` (index), `onSpinComplete`.
  - Drives `requestAnimationFrame` with ease-out-quad.
  - Renders game icons in a circular layout via `transform: rotate(...) translateY(...)`.
  - Snaps to the target slot on completion, fires `onSpinComplete`.
- [ ] **T204** Create `client/src/components/spinner/ResultCard.jsx` taking `{ game, onLaunch, onSpinAgain }`; "Launch" CTA emits a console log + invokes `onLaunch` (real launch is 005).

## Group B — Hooks & state machine

- [ ] **T210** Create `client/src/hooks/useSpin.js` per [plan §State machine].
  - State: `idle | spinning | result`.
  - On `spin()`: pick winner via `pickGame()` from 004 (stub `() => games[0]` until 004 lands), transition `idle → spinning`.
  - On `onAnimationEnd()` (callback wired up by `SpinnerScreen`): transition `spinning → result`.
  - On `spinAgain()`: transition `result → spinning`.
- [ ] **T211** Implement `buildVisibleGames(eligible, winner)` from [plan §Visible-game sampling]. Unit-test: winner always present, length min(eligible.length, 12), no duplicates.

## Group C — Screen assembly

- [ ] **T220** Create `client/src/components/spinner/SpinnerScreen.jsx`:
  - Consumes `useGames()` (from 002) and `useSpin()`.
  - Branches: 0 games → `<EmptyState />`; 1 game → `<SingleGameState />`; else → wheel + button + result card.
- [ ] **T221 [P]** Create `EmptyState.jsx` with "Rescan" button calling `useGames().rescan`.
- [ ] **T222 [P]** Create `SingleGameState.jsx` with a "Launch <name>" button (stubbed, see T204).
- [ ] **T223** Update `client/src/App.jsx` to mount `<SpinnerScreen />` at `/`.

## Group D — Haptics

- [ ] **T230** Add `@capacitor/haptics` to `client/package.json`.
- [ ] **T231** Call `Haptics.impact({ style: ImpactStyle.Light })` on spin start, `Haptics.impact({ style: ImpactStyle.Heavy })` on land. Wrap in a `try/catch` for web fallback.

## Group E — Polish & responsive

- [ ] **T240** Verify layout on portrait phone, tablet portrait, tablet landscape. Tailwind responsive utilities should suffice.
- [ ] **T241** Preload all icon `<img>` elements on mount; use `loading="eager"` and a hidden warmup grid to avoid decode jank during spin.
- [ ] **T242** Profile with Chrome DevTools Performance tab — confirm 60 FPS during animation. If not, drop `MAX_VISIBLE_SLOTS` from 12 to 8.

## Group F — Tests

- [ ] **T250 [P]** Unit-test `buildVisibleGames` (T211 also requires this).
- [ ] **T251 [P]** Unit-test `useSpin` state machine with React Testing Library: tap spin → state goes spinning; fire `onAnimationEnd` → state goes result; spin again → state goes spinning.
- [ ] **T252** Visual regression smoke test: full screenshot on Android emulator before/after spin.

## Done when

- Acceptance criteria 1–8 from `spec.md` all pass on the target device.
- Spin completes deterministically at the chosen slot on 20 consecutive trials with a forced winner.
