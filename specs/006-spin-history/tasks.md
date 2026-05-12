# 006 — Spin history — Tasks

## Group A — DB

- [ ] **T500** Add `spins` table + indexes to `database.js` per [plan §DB].
- [ ] **T501** Write a one-time migration from `launches` → `spins` per [plan §Risks]. Drop `launches` table after migration completes.

## Group B — Service

- [ ] **T510** Extend `client/src/services/history.js`:
  - `recordSpin(result)` returning insertedId.
  - `markLaunched(spinId, launchedAtMs)`.
  - `getRecentSpins(limit, offset)`.
  - `getStats(range)`.
  - `clearAll()`.
  - `exportJson()` / `exportCsv()`.
- [ ] **T511** Implement retention: after insert, prune by `historyLength` (from settings; until 007 use HLD default of 100).
- [ ] **T512** Add unit tests covering: insert + read; retention prune; markLaunched updates the right row; stats counts.

## Group C — Hooks

- [ ] **T520 [P]** `useHistory()` — React Query infinite query, 50/page.
- [ ] **T521 [P]** `useStats(range)` — React Query, 30s staleTime.
- [ ] **T522 [P]** `useEngineHistory()` — returns most recent N for the engine consumer. Replace 004 T331's `useHistory` stub.

## Group D — Wire-up to existing features

- [ ] **T530** In `useSpin` (003 T210), on transition `spinning → result`, call `recordSpin(result)` and store the inserted spinId in state.
- [ ] **T531** In `launchGame` (005 T411), accept a `spinId` param and call `markLaunched(spinId, Date.now())` on success. Update 005's existing tests.
- [ ] **T532** Verify the engine's recency/frequency components correctly read the new spins via `useEngineHistory()`.

## Group E — Screens

- [ ] **T540** `HistoryScreen.jsx` with tab/route at `/history`, navigation entry in main shell.
- [ ] **T541** `HistoryList.jsx` virtualised; `HistoryRow.jsx` with icon, name, timestamp, "Launched" badge.
- [ ] **T542** `StatsPanel.jsx` — top 5 most spun, top 5 least spun, last-7-days bar.
- [ ] **T543** `ClearAllModal.jsx` — hold-to-confirm or type "DELETE" pattern.

## Group F — Export

- [ ] **T550 [P]** Add `@capacitor/share` and `@capacitor/filesystem` to deps.
- [ ] **T551 [P]** `ExportSheet.jsx` — choose JSON or CSV, write to tmp file, invoke `Share.share`.
- [ ] **T552** Verify share sheet appears on real device for both formats.

## Done when

- All AC from `spec.md` pass.
- Engine no longer reads from `launches` table.
- 10k-row pseudo-stress test (synthetic insert) loads first page < 200 ms, stats < 100 ms.
