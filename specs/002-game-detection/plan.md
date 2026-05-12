# 002 — Game detection — Plan

References: [`../../constitution.md`](../../constitution.md), [Android `PackageManager` docs](https://developer.android.com/reference/android/content/pm/PackageManager).

## Architecture

Game detection happens on-device only. The flow is:

```
┌──────────────────────────────────────────────────────────┐
│ React app                                                 │
│   ┌─────────────────────────────────────────────────┐    │
│   │ services/game-detection.js                       │    │
│   │   • getCachedGames()    ← SQLite (read-through)  │    │
│   │   • rescan()            ← invokes Capacitor      │    │
│   │   • toggleIsGame(pkg)   ← writes user override   │    │
│   └────────────────┬────────────────────────────────┘    │
│                    │                                       │
│                    ▼                                       │
│   ┌─────────────────────────────────────────────────┐    │
│   │ services/database.js  (on-device SQLite via      │    │
│   │ @capacitor-community/sqlite)                     │    │
│   └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
                     │
                     ▼ (Capacitor bridge)
┌──────────────────────────────────────────────────────────┐
│ Capacitor plugin: GameDetector (Java/Kotlin)              │
│   • getInstalledGames(): JSArray<Game>                    │
│   • Reads PackageManager, filters, encodes icons to base64│
└──────────────────────────────────────────────────────────┘
```

The Node server is not involved in game detection. It will mirror the count via a single anonymous opt-in telemetry hit later (separate spec); detection itself never leaves the device.

## On-device data

A new on-device SQLite database (separate from the Node server's SQLite — that's a different machine entirely). Created via `@capacitor-community/sqlite`. Schema additions in `client/src/services/database.js`:

```sql
CREATE TABLE IF NOT EXISTS games (
  package_name      TEXT PRIMARY KEY,
  app_name          TEXT NOT NULL,
  icon_base64       TEXT,                                -- nullable for memory pressure cases
  detected_is_game  INTEGER NOT NULL DEFAULT 0,          -- bool from heuristic
  user_is_game      INTEGER,                             -- null = no override; 0/1 = explicit user override
  first_install_ms  INTEGER NOT NULL,
  last_update_ms    INTEGER NOT NULL,
  last_seen_ms      INTEGER NOT NULL,                    -- updated on each scan; used to prune uninstalled apps
  created_at_ms     INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_games_is_game ON games(detected_is_game, user_is_game);
```

Effective "is game" predicate at the query layer:

```
isGame = COALESCE(user_is_game, detected_is_game)
```

After each scan, any row whose `last_seen_ms` is older than the scan start is considered uninstalled and deleted.

## Capacitor plugin: `GameDetector`

Lives under `client/android/app/src/main/java/com/mysterychoice/app/GameDetector.java` (registered with Capacitor by `@CapacitorPlugin(name = "GameDetector")`).

### API

```java
@PluginMethod
public void getInstalledGames(PluginCall call) {
  // Reads PackageManager, filters, base64-encodes icons, calls call.resolve(JSObject).
}
```

Returns:

```json
{
  "games": [
    {
      "packageName": "com.miHoYo.GenshinImpact",
      "appName": "Genshin Impact",
      "iconBase64": "iVBORw0KGgoAAAANS...",
      "isGame": true,
      "firstInstallTime": 1714838400000,
      "lastUpdateTime": 1715444800000
    }
  ],
  "scannedAt": 1715520000000
}
```

### Detection heuristic (priority order)

1. `ApplicationInfo.category == CATEGORY_GAME` *(API 26+, reliable for newer apps)*
2. `(ApplicationInfo.flags & FLAG_IS_GAME) != 0` *(deprecated in API 26 but still set by many apps)*
3. Intent filter check: `getLaunchIntentForPackage(pkg)` matches `Intent.CATEGORY_LAUNCHER` AND any of the package's filters declare `category android.intent.category.GAME`.

If any of the above is true → `isGame = true`. Otherwise `false`. Both games and non-games are returned; the user override layer needs the full list.

### Permissions

Manifest: `<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />`.

At runtime, Android 11+ silently allows the query if the permission is in the manifest — there is no runtime prompt for `QUERY_ALL_PACKAGES` itself. But Play Store *review* will reject apps with this permission unless we declare the justification (per HLD §13). The in-app explainer screen ([UI flow](#ui-flow)) is for the user to understand *why* we need broad visibility into their installs, not for runtime consent.

### Icon encoding

`Drawable → Bitmap → PNG → base64`. Adaptive icons rasterised at 144×144 (mdpi @ 3x). Cap base64 length at ~20 KB per icon; skip the icon if it would exceed that and let the UI fall back to a generated initials avatar.

## React-side service

`client/src/services/game-detection.js`:

```js
import { GameDetector } from './capacitor-plugins.js';
import { getDb } from './database.js';

export async function getCachedGames() { /* SELECT ... where isGame=1 */ }
export async function getAllInstalled() { /* SELECT * */ }
export async function rescan() {
  const { games, scannedAt } = await GameDetector.getInstalledGames();
  // upsert into games table; mark scannedAt; delete stale rows
}
export async function toggleIsGame(packageName, value) {
  // UPDATE games SET user_is_game = ? WHERE package_name = ?
}
```

React Query:

```js
useQuery({ queryKey: ['games'], queryFn: getCachedGames, staleTime: 60_000 });
useMutation({ mutationFn: rescan, onSuccess: () => qc.invalidateQueries(['games']) });
```

## UI flow

The dedicated screens (game list, settings) come from later specs. 002 ships:

1. A **first-run explainer screen** (`client/src/components/PermissionsExplainer.jsx`) shown on cold start when the `games` table is empty. Single button: "Continue".
2. A **scanning state** indicator that the `useGames()` hook exposes, consumed by 003-spinner-screen to render a skeleton on first-ever launch.
3. A **pull-to-refresh** trigger wired to `rescan()` from the spinner screen.

## Risks

- **Play Store rejection of `QUERY_ALL_PACKAGES`.** Mitigation in HLD §13 — provide explicit justification, accept the review delay. Spec-level mitigation: nothing structural; we just have to write the justification well.
- **Plugin authoring overhead.** Capacitor plugin scaffold needs `npx @capacitor/cli plugin:generate` or manual setup. Document the steps in `tasks.md`.
- **Icon DB bloat.** 100 games × 15 KB = 1.5 MB. Acceptable. If it grows, switch to file storage (decision deferred).
