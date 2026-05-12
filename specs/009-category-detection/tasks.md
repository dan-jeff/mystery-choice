# 009 — Category detection — Tasks

## Group A — Schema

- [ ] **T800** Add `ALTER TABLE games` migrations per [plan §Schema additions]. Place in `client/src/services/database.js` as additive migrations (or in `migrations/002-categories.sql` if you've adopted the migrations folder pattern).

## Group B — Native

- [ ] **T810** Extend `GameDetector.java` (002) to read `ApplicationInfo.category` and map per [plan §Native side]. Return `category: String?` per game.
- [ ] **T811** Update Java tests for the new mapping cases.

## Group C — Heuristic

- [ ] **T820** Create `client/src/services/category-detection.js` with `KEYWORDS` and `inferCategory(label)`.
- [ ] **T821** Tests: feed the curated 30-game label set, assert ≥ 80% accuracy. Codify the set as a fixture (`fixtures/category-test-set.json`).

## Group D — Integration

- [ ] **T830** Update `rescan()` in 002's `game-detection.js`: take `nativeCategory ?? inferCategory(appName)` and write `detected_category`.
- [ ] **T831** Update `getCachedGames()` to compute the effective `category` via `COALESCE(user_category, detected_category, 'OTHER')` in the SQL.
- [ ] **T832** Add `setUserCategory(packageName, category)` to `game-detection.js`.

## Group E — Hook & filter

- [ ] **T840 [P]** `useCategoryFilter()` hook, persisted via the `settings` table key `category_filter_v1` (`setSetting` / `getSetting` from 001).
- [ ] **T841 [P]** Update `useEligibleGames()` (008) to chain the category filter per [plan §Hook & filter].

## Group F — UI

- [ ] **T850 [P]** `CategoryBadge.jsx` — pill component, colour by category.
- [ ] **T851 [P]** Embed badge in `HistoryRow.jsx`, `ManageGames` row, `ResultCard`.
- [ ] **T852** `CategoryChips.jsx` — chip toggles on `SpinnerScreen` header.
- [ ] **T853** Category override `<select>` in `ManageGames` row.

## Group G — Verification

- [ ] **T860** Accuracy of ≥ 80% on the 30-game fixture. AC #1.
- [ ] **T861** Override → rescan → override preserved. AC #2.
- [ ] **T862** Filter behaviour: chips narrow pool, clearing chips restores. AC #3.

## Done when

- All AC pass.
- Accuracy result recorded in PR description.
