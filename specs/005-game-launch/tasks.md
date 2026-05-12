# 005 — Game launch — Tasks

## Group A — Native plugin

- [ ] **T400** Create `client/android/app/src/main/java/com/mysterychoice/app/Launcher.java` per [plan §Capacitor plugin]. Annotate with `@CapacitorPlugin(name = "Launcher")`.
- [ ] **T401** Implement Tier 1, Tier 2, Tier 3 logic with the `ok()` / `fail()` helpers.
- [ ] **T402** Register `Launcher` in `MainActivity.java` (`registerPlugin(Launcher.class);`).
- [ ] **T403** Unit-test the Java logic with mocked `PackageManager` and `ResolveInfo`. Cases: tier 1 success, tier 1 null→tier 2 success, tier 1 null→tier 2 null→error.

## Group B — JS service

- [ ] **T410** Add `Launcher` to `client/src/services/capacitor-plugins.js`.
- [ ] **T411** Create `client/src/services/launcher.js` per [plan §React service].
- [ ] **T412** Add `launches` table to `client/src/services/database.js` `initSchema()` per [plan §DB schema addition].
- [ ] **T413** Create `client/src/services/history.js` (initial cut) exporting `recordLaunch(game)`. 006 extends this file.

## Group C — UI wiring

- [ ] **T420** Update `ResultCard.jsx` (from 003 T204) to call `launchGame()` and handle error state per [plan §UI integration].
- [ ] **T421** Add an inline `<LaunchError />` sub-component rendering `error` + a "Pick another" CTA that calls `spinAgain()`.
- [ ] **T422** Update `SingleGameState.jsx` (from 003 T222) to also call `launchGame()` and surface errors the same way.
- [ ] **T423** Add a busy state to the Launch button so it can't double-fire while the Intent is starting.

## Group D — Verification

- [ ] **T430** On a real device, spin → land on game → tap Launch → game opens directly (no chooser). Confirm AC #1, #3.
- [ ] **T431** Uninstall a game between scan and launch (manually) → tap Launch → confirm error path + "Pick another" works. AC #2.
- [ ] **T432** Spin same game twice in a row (force via test) → both launches succeed. AC #6.
- [ ] **T433** Confirm `launches` table receives a row per successful launch via SQLite browser / debug log. AC #4.
- [ ] **T434** Test on Android 10, 12, 14 devices. Note OEM toast behaviour in PR description. AC #7.

## Group E — Polish

- [ ] **T440 [P]** Add a tiny success haptic on launch (light impact). Respect haptic setting.
- [ ] **T441 [P]** Make sure pressing back from the launched game returns to the spinner with the result card still visible. AC #5.

## Done when

- Acceptance criteria 1–7 from `spec.md` are demonstrated on at least one device.
- The `launches` table accumulates rows correctly.
- The Java unit tests for the three-tier fallback pass.
