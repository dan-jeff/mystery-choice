# 001 — Foundation — Plan

References: [`../../constitution.md`](../../constitution.md), reference app `/home/dan/Downloads/jellyfin-monitor/` (client conventions only).

## File layout to produce

```
mystery_choice/
├── .gitignore
└── client/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── capacitor.config.json
    ├── index.html
    ├── public/
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── styles/
        │   └── index.css
        ├── components/
        │   └── BootCheck.jsx
        ├── context/
        │   └── AppContext.jsx        — empty provider; populated by 003+
        ├── hooks/
        │   └── useTheme.js           — stub, returns 'dark'
        ├── services/
        │   ├── database.js           — Capacitor SQLite handle + initSchema()
        │   └── capacitor-plugins.js  — registerPlugin() exports
        └── utils/
            └── format.js             — empty for now
```

`.gitignore` covers `node_modules/`, `dist/`, `*.sqlite`, `client/android/.gradle/`, `client/android/app/build/`, `client/android/build/`, `.DS_Store`.

## Dependencies (target versions, aligned with reference app)

`client/package.json` (`"type": "module"`):

| Dep | Version | Why |
|-----|---------|-----|
| `react` | `^18.3.1` | UI |
| `react-dom` | `^18.3.1` | UI |
| `react-router-dom` | `^6.28.0` | Navigation (used by later screens) |
| `@tanstack/react-query` | `^5.59.0` | Async caching |
| `@capacitor/core` | `^8.3.0` | Capacitor runtime |
| `@capacitor/cli` | `^8.3.0` | Capacitor CLI |
| `@capacitor/android` | `^8.3.0` | Android platform |
| `@capacitor-community/sqlite` | `^6.x` | On-device SQLite (single store) |
| `vite` (dev) | `^5.4.0` | Build |
| `@vitejs/plugin-react` (dev) | `^4.3.0` | React plugin |
| `tailwindcss` (dev) | `^3.4.0` | Styling |
| `postcss` (dev) | `^8.4.47` | Styling |
| `autoprefixer` (dev) | `^10.4.20` | Styling |
| `eslint` + `eslint-plugin-react` + `eslint-plugin-react-hooks` (dev) | latest | Lint |

## SQLite setup

`client/src/services/database.js`:

```js
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

const DB_NAME = 'mystery-choice';
let cached;

export async function getDb() {
  if (cached) return cached;
  const sqlite = new SQLiteConnection(CapacitorSQLite);

  if (Capacitor.getPlatform() === 'web') {
    // dev-only fallback: in-memory wasm
    await sqlite.initWebStore();
  }

  const db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
  await db.open();
  await initSchema(db);
  cached = db;
  return db;
}

async function initSchema(db) {
  // The settings table is infrastructure — owned by 001 because every later feature
  // may need to persist a flag or scalar. Business tables (games, spins, …) land in 002+.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key            TEXT PRIMARY KEY,
      value_json     TEXT NOT NULL,
      updated_at_ms  INTEGER NOT NULL
    );
  `);
}
```

A tiny `client/src/services/settings.js` exposes the typed read/write helpers used by every feature:

```js
import { getDb } from './database.js';

export async function getSetting(key, fallback = null) {
  const db = await getDb();
  const res = await db.query('SELECT value_json FROM settings WHERE key = ?', [key]);
  const row = res.values?.[0];
  return row ? JSON.parse(row.value_json) : fallback;
}

export async function setSetting(key, value) {
  const db = await getDb();
  await db.run(
    `INSERT INTO settings (key, value_json, updated_at_ms) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at_ms = excluded.updated_at_ms`,
    [key, JSON.stringify(value), Date.now()]
  );
}

export async function deleteSetting(key) {
  const db = await getDb();
  await db.run('DELETE FROM settings WHERE key = ?', [key]);
}
```

## Boot check

`client/src/components/BootCheck.jsx`:

1. Call `getDb()` to open the database.
2. Run a tiny sanity SQL (`SELECT 1`).
3. Render "Storage: ok" or, on error, the error message.

This proves Capacitor + SQLite + Tailwind + React are all wired correctly.

## Capacitor configuration

`client/capacitor.config.json`:

```json
{
  "appId": "com.mysterychoice.app",
  "appName": "Mystery Choice",
  "webDir": "dist",
  "android": {
    "allowMixedContent": false
  }
}
```

## Hot reload notes

`npm run dev` serves the React app at `http://localhost:5173` for browser-based iteration. For on-device hot reload during early development, document `npx cap run android -l --external` in tasks — points the device at the dev server. Not required for 001 acceptance.

## Risks

- **`@capacitor-community/sqlite` Android setup** has a manual step in some versions (modifying `MainActivity` to register the SQLite plugin). Document precisely in tasks.
- **Capacitor Android Studio dependency.** Building the APK requires the Android SDK; `npx cap add android` is expected to be run by a developer with a local SDK install.
- **Web fallback for SQLite** uses a WASM store that needs an HTTPS context. `npm run dev` will work but you may need to allow the browser to grant persistent storage on first run.
