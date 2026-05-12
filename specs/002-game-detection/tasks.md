# 002 — Game detection — Tasks

## Group A — On-device SQLite setup

- [ ] **T100** Add `@capacitor-community/sqlite` to `client/package.json` and follow its Android setup (add to `MainActivity.java` if not auto-registered).
- [ ] **T101** Create `client/src/services/database.js` that:
  - Opens (or creates) a SQLite DB named `mystery-choice.db`.
  - Exposes `getDb()` returning the connection, with a one-time `initSchema()` that runs the `CREATE TABLE games ...` statement from [plan §On-device data].
  - Handles both web (sql.js fallback for `npm run dev`) and Android targets.
- [ ] **T102** Add a `services/database.test.js` that creates an in-memory DB and verifies the schema and basic upsert behaviour.

## Group B — Capacitor plugin `GameDetector`

- [ ] **T110** Scaffold the plugin under `client/android/app/src/main/java/com/mysterychoice/app/GameDetector.java`. Annotate with `@CapacitorPlugin(name = "GameDetector")`.
- [ ] **T111** Implement `getInstalledGames(PluginCall call)` per [plan §Capacitor plugin]: query `PackageManager`, apply the 3-step heuristic, base64-encode icons, return `JSObject` shaped as the contract describes.
- [ ] **T112** Add `<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />` to `client/android/app/src/main/AndroidManifest.xml`.
- [ ] **T113** Register the plugin in `MainActivity.java` (`registerPlugin(GameDetector.class);`).
- [ ] **T114** Create `client/src/services/capacitor-plugins.js` re-exporting `GameDetector` via `registerPlugin('GameDetector')` from `@capacitor/core`.
- [ ] **T115** Unit-test the heuristic in Java with mocked `ApplicationInfo`s against 6 fixtures (1 per heuristic rule + 2 negative + 1 ambiguous → exercises priority order).

## Group C — React service layer

- [ ] **T120 [P]** Create `client/src/services/game-detection.js` with `getCachedGames`, `getAllInstalled`, `rescan`, `toggleIsGame` per [plan §React-side service].
- [ ] **T121 [P]** Create `client/src/hooks/useGames.js` wrapping the service with React Query: `useGames()` returns `{ games, isLoading, isRescanning, rescan }`.
- [ ] **T122** Write `services/game-detection.test.js` covering: first-scan inserts all rows; second scan upserts and deletes rows missing from the new result; `toggleIsGame(pkg, true)` flips `user_is_game` and the next `getCachedGames()` reflects it; `toggleIsGame(pkg, null)` clears the override.

## Group D — Permissions explainer

- [ ] **T130 [P]** Create `client/src/components/PermissionsExplainer.jsx`: full-screen card explaining why the app needs broad app visibility, with a single "Continue" CTA.
- [ ] **T131 [P]** Wire it into `App.jsx`: shown only on cold start when `useGames().games.length === 0` and the user hasn't acknowledged it before (track via `setSetting('permissions_acknowledged_v1', true)` against the `settings` table from 001).
- [ ] **T132** Visual QA on Android emulator at API 26, 30, 34.

## Group E — Cache + rescan UX

- [ ] **T140** Implement the cache-first pattern in `useGames`: return cached rows immediately, kick off a background `rescan()` if the cache is older than 60 s or empty.
- [ ] **T141** Implement stale-row pruning in `rescan()`: after upserts, `DELETE FROM games WHERE last_seen_ms < :scanStart`.
- [ ] **T142** Expose `rescan` via a "Rescan games" entry in a temporary dev toolbar (`client/src/components/DevToolbar.jsx`, only rendered when `import.meta.env.DEV`). The real entry point lands in 007.

## Group F — Verification

- [ ] **T150** Build a debug APK, install on a real device, verify:
  1. First launch shows the explainer.
  2. After "Continue", spinner placeholder shows N games detected within 2 s.
  3. Install a new game, reopen the app, confirm it appears.
  4. Uninstall a game, reopen the app, confirm it disappears.
- [ ] **T151** Run the heuristic against the curated set of 20 popular games (spec AC #6) — record results in a table in the PR description.

## Done when

- All Group A–F tasks checked off.
- Acceptance criteria 1–7 from `spec.md` pass.
- Heuristic coverage table for the 20-game test set is included in the merge PR.
