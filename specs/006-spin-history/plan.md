# 006 — Spin history — Plan

References: HLD §7, [`../004-weighted-random-engine/plan.md`](../004-weighted-random-engine/plan.md).

## DB

Extend `client/src/services/database.js` `initSchema()`:

```sql
CREATE TABLE IF NOT EXISTS spins (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  package_name    TEXT NOT NULL,
  app_name        TEXT NOT NULL,
  weight_score    REAL,
  breakdown_json  TEXT,                          -- serialized engine breakdown
  fallback_used   INTEGER NOT NULL DEFAULT 0,
  spun_at_ms      INTEGER NOT NULL,
  launched        INTEGER NOT NULL DEFAULT 0,    -- updated by 005 success path
  launched_at_ms  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_spins_time ON spins(spun_at_ms DESC);
CREATE INDEX IF NOT EXISTS idx_spins_package ON spins(package_name);
```

Retention: after each insert, if `COUNT(*) > historyLength`, delete the oldest `(count - historyLength)` rows.

## Service

`client/src/services/history.js` (extends the file created in 005):

- `recordSpin(result)` — inserts a row at result time, returns the new row id.
- `markLaunched(spinId, launchedAtMs)` — called by 005's `launchGame` instead of inserting into `launches` directly. The `launches` table becomes redundant; keep it for migration safety or drop in this spec — see decision below.
- `getRecentSpins(limit, offset)` — paginated read.
- `getStats({ from, to })` — returns `{ total, mostSpun, leastSpun, last7Days }`.
- `clearAll()` — wipes `spins` (and `launches` if retained).
- `exportJson()` / `exportCsv()` — return strings; UI handles share.

**Decision:** drop `launches` introduced in 005, fold it into `spins.launched + spins.launched_at_ms`. Update 005's `recordLaunch` to call `markLaunched(currentSpinId, now)` instead. Update plan/tasks of 005 in the merge PR. (Add an item in this spec's tasks to enact that change.)

## Hooks

- `useHistory()` — returns `{ spins, loadMore, refresh }` with React Query infinite query.
- `useStats(range)` — returns `{ data, loading }`.
- `useEngineHistory()` — thin wrapper returning the most recent N rows for the engine (`pickGame` consumer). N = `max(historyLength, 200)` so the engine has enough context.

## Screens

```
client/src/components/history/
├── HistoryScreen.jsx
├── HistoryList.jsx              — virtualised list, 50/page
├── HistoryRow.jsx
├── StatsPanel.jsx               — top-N + last-7-days
├── ClearAllModal.jsx
└── ExportSheet.jsx              — invokes @capacitor/share
```

Add a tab/route at `/history`.

## Export

- JSON: `JSON.stringify(rows, null, 2)`.
- CSV: hand-rolled (no dependency). Escape quotes and newlines per RFC 4180.
- Share via `Share.share({ title, text, files: [...] })` after writing to a tmp file with `Filesystem.writeFile`.

## Risks

- **List performance at 10k rows.** Use a virtualised list — `react-window` or implement a simple windowed list (50 rendered at a time). React Query infinite query handles fetching.
- **Migration from `launches`.** If 005 already shipped to internal testers, write a one-time migration: copy `launches` rows into `spins` with `launched=1, weight_score=null`, then drop `launches`.
