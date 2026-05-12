# 003 — Spinner screen

**Status:** Draft
**Phase:** MVP
**Depends on:** 002-game-detection (data), 004-weighted-random-engine (selection logic)

## Goal

Deliver the central UX of the app: a tappable, animated spinner that picks a game and reveals it dramatically.

## Why

The spinner *is* the product. Everything else is plumbing. The animation has to feel satisfying enough that users want to spin again, even when the random pick was their least favourite game.

## User stories

- **As a user**, I open the app and immediately see a spinner ready to go.
- **As a user**, I tap "Spin" and watch a 2–4 second animation that ends on a specific game.
- **As a user**, I see the chosen game's name and icon clearly after the spin, with a one-tap "Launch" button.
- **As a user**, I can tap "Spin again" without leaving the screen.
- **As a user**, if I have fewer than 2 eligible games, I see a helpful empty/near-empty state instead of a broken spinner.

## Scope

In scope:

- Spinner visualization: a wheel of game icons, rotating, decelerating to land on the chosen game.
- Spin trigger button.
- Result reveal: game icon, app name, "Launch" CTA (button stub — actual launch lands in 005), "Spin again" CTA.
- Empty state: zero games detected (sends user to permissions explainer / rescan).
- Near-empty state: 1 game detected (offer to launch directly, skip the spin).
- Loading state while games are being detected on first launch.
- Haptic vibration on spin end (best-effort, opt-out lives in 007).

Out of scope:

- The actual launch action — `Launch` button only logs intent; wired up in 005.
- Selecting *which* game wins — that's 004. This spec assumes a `pickGame(games)` function exists and is deterministic enough to drive the animation.
- History recording — lands in 006.
- Filters (category, exclusion) — land in 008 and 009.

## Acceptance criteria

1. Spinner reaches 60 FPS steady state during animation on a Pixel 4a class device.
2. Total spin duration is 2.0 s ± 0.2 s (configurable constant) from tap to land.
3. The animation visually lands on the selected game — i.e. the icon under the pointer at rest matches what `pickGame()` returned.
4. The result card shows the winning game's icon, name, and a "Launch" CTA within 300 ms of spin end.
5. Tapping "Spin again" re-runs the animation without any visible page transition.
6. With 0 games detected, the spinner is replaced by an empty-state card pointing the user to the permissions explainer or "Rescan" button.
7. With exactly 1 eligible game, the spin button shows "Launch <Game>" instead and bypasses the animation.
8. The screen layout is responsive: at portrait phone, tablet portrait, and tablet landscape, the spinner is centred and the action button is reachable with the thumb.

## Open questions / NEEDS CLARIFICATION

- **NEEDS CLARIFICATION:** Visual style — wheel of icons (classic carnival spinner), card shuffle, slot machine? Default proposal: wheel of icons, dark theme, neon accent. Confirm with a Figma mockup before T203.
- **NEEDS CLARIFICATION:** Should the result auto-launch after a delay (e.g. 3-second countdown), or always require an explicit "Launch" tap? Default proposal: explicit tap; auto-launch can be a Setting in 007.
- **NEEDS CLARIFICATION:** With > 30 eligible games, do we render all of them on the wheel or sample? Default proposal: sample 12 around the winning game; the *visualisation* doesn't need to match the *selection pool* size 1:1.
