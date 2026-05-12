# 005 — Game launch

**Status:** Draft
**Phase:** MVP
**Depends on:** 002-game-detection, 003-spinner-screen

## Goal

When the user taps "Launch" on the result card, the chosen game opens directly — or, if direct launch fails, falls back gracefully without leaving the user stuck.

## Why

A spinner that doesn't actually launch the game is a toy. Direct launch (no Android Intent chooser, no extra tap) is what makes the app feel polished and worth paying for.

## User stories

- **As a user**, I tap "Launch" and the chosen game opens. No chooser, no further taps.
- **As a user**, if the game can't be launched (uninstalled between detection and launch, no launcher Intent, OEM weirdness), I see a clear error and a "Try again" or "Pick another" option.
- **As a user**, the app records that the launch happened (so the weighting engine treats it as "played").
- **As a developer**, I can swap the launch mechanism (e.g. add a delay, add a "are you sure" prompt) via a single service.

## Scope

In scope:

- Capacitor plugin method `launch(packageName)` returning `{ success, error? }`.
- Three-tier fallback:
  1. `PackageManager.getLaunchIntentForPackage(pkg)` → `startActivity` with `FLAG_ACTIVITY_NEW_TASK`.
  2. If that returns `null`: query for `<intent-filter><category="android.intent.category.GAME"/></intent-filter>` activities and start the first match.
  3. If still nothing: surface an error and let the user pick "Try another spin".
- Recording the launch event into the on-device DB (a precursor to the full history spec in 006 — for 005, just an append to a `launches` table).
- The result-card "Launch" button (stubbed in 003) wired to the real implementation.

Out of scope:

- The full spin/history record schema (lands in 006); 005 writes a minimal `launches` row.
- Tracking the duration of the resulting play session (needs `PACKAGE_USAGE_STATS`, deferred).
- "Recently launched" UI surfaces — show in 006.

## Acceptance criteria

1. Tapping "Launch" on the result card opens the chosen game's main activity in under 500 ms on a Pixel 4a class device.
2. If the game has been uninstalled since detection, the error path triggers within 500 ms with a "Game no longer installed" message and a "Pick another" button that resets the spinner.
3. The error path *does not* show the system Intent chooser.
4. Each successful launch writes a row to the `launches` table.
5. Returning to the app via the system back button leaves the spinner on the result card (not freshly idle).
6. Launching the same game twice in a row works (no stale-Intent caching issue).
7. On Android 12+ devices, launches do not trigger the "App is asking to switch" toast for at least 9 out of 10 launches (some OEMs always show this; document the limitation).

## Open questions / NEEDS CLARIFICATION

- **NEEDS CLARIFICATION:** When the user returns to the app, should the result card stay (spec proposes #5) or reset to idle? Default proposal: stay until they spin again — gives users a chance to launch again if they want.
- **NEEDS CLARIFICATION:** Should we attempt to detect when a launch *actually* succeeded (vs. just `startActivity` returning without exception)? On Android that's surprisingly hard without `PACKAGE_USAGE_STATS`. Default proposal: assume success unless `startActivity` throws.
