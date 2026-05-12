# 008 — Exclusion list — Plan

References: HLD §3.3 (ExcludedGame entity).

## DB

```sql
CREATE TABLE IF NOT EXISTS excluded_games (
  package_name      TEXT PRIMARY KEY REFERENCES games(package_name) ON DELETE CASCADE,
  reason            TEXT,
  excluded_at_ms    INTEGER NOT NULL
);
```

Note: `package_name` here references the on-device `games` table. SQLite enforces FK only when `PRAGMA foreign_keys = ON` is set — make sure `database.js` does that on connect.

## Service

`client/src/services/exclusions.js`:

```js
export async function getExclusions() { /* SELECT * FROM excluded_games */ }
export async function exclude(packageName, reason = null) { /* INSERT OR REPLACE */ }
export async function unexclude(packageName) { /* DELETE WHERE */ }
```

## Hook

`useEligibleGames()` (`client/src/hooks/useEligibleGames.js`):

```js
const { games } = useGames();          // from 002
const { exclusions } = useExclusions();
return games.filter(g => !exclusions.has(g.packageName));
```

`useSpin` swaps from `useGames()` to `useEligibleGames()` as the pool source.

## Screen

Adds to the existing "Manage Games" sub-page from 007 (`ManageGames.jsx`):

- Replace the single "isGame" toggle with a row that shows:
  - app icon, name
  - "Excluded" badge if excluded
  - dropdown / popover with: "Include in spinner" / "Exclude" / "Toggle isGame"
- Add a reason picker on exclude (free text or preset: "Too long", "Not in mood", "Other"). Optional.

## Risks

- **Spinner pool size collapse.** If users exclude most games, the engine fallback path (004 AC #7) kicks in. That's correct behaviour but worth surfacing on the spinner screen ("only X eligible games").
