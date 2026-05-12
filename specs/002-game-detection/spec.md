# 002 — Game detection

**Status:** Draft
**Phase:** MVP
**Depends on:** 001-foundation

## Goal

Detect all games installed on the user's Android device, store metadata (name, package, icon, install date) locally, and surface the resulting list to the rest of the app.

## Why

The spinner has nothing to spin without a list of games. Detection has to be fast, accurate, and resilient to OEM weirdness — many casual users care more about "did it find my games?" than any other feature.

## User stories

- **As a user**, the first time I open the app I see the spinner populated with all games installed on my phone, with no manual setup.
- **As a user**, if I install a new game and reopen the app, the new game appears in the list within one launch (or one pull-to-refresh).
- **As a user**, if the system can't detect everything, I can add a game manually by picking from a full list of all installed apps.
- **As a user**, when I deny the `QUERY_ALL_PACKAGES` permission, I get a clear explanation of why it's needed and a single button to retry the prompt.

## Scope

In scope:

- Capacitor plugin (Java/Kotlin) that exposes `getInstalledGames()` returning `[{ packageName, appName, iconBase64, isGame, firstInstallTime, lastUpdateTime }]`.
- "Is a game" heuristic: apps with `ApplicationInfo.FLAG_IS_GAME` (deprecated post-26), apps whose `applicationCategory == CATEGORY_GAME`, and apps with a `<category android:name="android.intent.category.GAME">` intent filter.
- Permissions flow: request `QUERY_ALL_PACKAGES` at first launch, with an in-app explainer screen before the system prompt.
- Manual override: a UI surface (covered in 007-settings later — for 002, just expose the data) for the user to mark non-game apps as games and vice versa.
- Local caching: detection result persisted to on-device SQLite so the spinner can show the previous list while a fresh scan runs in the background.
- Pull-to-refresh and an explicit "Rescan" entry point.

Out of scope:

- The actual settings UI for manual overrides (lives in 007).
- Category detection (lives in 009).
- Server-side mirroring of the game list.

## Acceptance criteria

1. On a fresh install of the app, the first scan completes within 2 seconds on a Pixel 4a class device with ~80 installed apps.
2. Re-opening the app uses the cached list immediately (< 200 ms), then refreshes in the background.
3. The detection result includes the app's launcher icon, encoded for direct display in `<img>` tags without further network calls.
4. If the user denies `QUERY_ALL_PACKAGES`, the explainer screen shows what's missing and a "Retry" button that re-prompts. The app remains usable with whatever it could detect.
5. Re-scanning after installing a new game finds it without a full app restart.
6. The "Is a game" heuristic correctly classifies a curated test set of 20 known popular Android games (e.g. Genshin, Candy Crush, Clash Royale, Among Us, Pokémon GO).
7. The user can manually toggle any installed app's "is a game" status; the override survives rescans and app restarts.

## Open questions / NEEDS CLARIFICATION

- **NEEDS CLARIFICATION:** How long should a stale cache be considered valid before forcing a foreground rescan? Default proposal: serve cache immediately on launch, rescan asynchronously, replace within ~1 s.
- **NEEDS CLARIFICATION:** Do we want the user to see a "scanning…" state on first launch, or fade in the spinner once results arrive? Default proposal: branded loading screen on cold first-ever launch, silent background refresh thereafter.
- **NEEDS CLARIFICATION:** Should icons be stored as base64 in SQLite (simple, larger DB) or as files on disk with paths in SQLite (faster scans, more I/O ops)? Default proposal: base64 for v1, revisit if DB exceeds ~5 MB on realistic devices.
