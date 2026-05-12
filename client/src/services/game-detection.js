import { Capacitor, registerPlugin } from '@capacitor/core';
import { getDb } from './database.js';

// Web fallback: returns a small fixture so the spinner is testable in `npm
// run dev` without a Capacitor host. On Android the native plugin (002)
// overrides this.
const GameDetector = registerPlugin('GameDetector', {
  web: () => ({
    async getInstalledGames() {
      return {
        games: WEB_FIXTURE,
        scannedAt: Date.now(),
      };
    },
  }),
});

const WEB_FIXTURE = [
  { packageName: 'com.example.zelda', appName: 'Tears of the Kingdom', isGame: true, firstInstallTime: 0, lastUpdateTime: 0 },
  { packageName: 'com.example.tetris', appName: 'Tetris Effect', isGame: true, firstInstallTime: 0, lastUpdateTime: 0 },
  { packageName: 'com.example.celeste', appName: 'Celeste', isGame: true, firstInstallTime: 0, lastUpdateTime: 0 },
  { packageName: 'com.example.stardew', appName: 'Stardew Valley', isGame: true, firstInstallTime: 0, lastUpdateTime: 0 },
  { packageName: 'com.example.hades', appName: 'Hades', isGame: true, firstInstallTime: 0, lastUpdateTime: 0 },
  { packageName: 'com.example.gris', appName: 'GRIS', isGame: true, firstInstallTime: 0, lastUpdateTime: 0 },
  { packageName: 'com.example.monstertrain', appName: 'Monster Train', isGame: true, firstInstallTime: 0, lastUpdateTime: 0 },
  { packageName: 'com.example.balatro', appName: 'Balatro', isGame: true, firstInstallTime: 0, lastUpdateTime: 0 },
  { packageName: 'com.example.intoit', appName: 'Into the Breach', isGame: true, firstInstallTime: 0, lastUpdateTime: 0 },
  { packageName: 'com.example.slaythespire', appName: 'Slay the Spire', isGame: true, firstInstallTime: 0, lastUpdateTime: 0 },
];

/**
 * Read the cached game list from SQLite. Only rows the user considers a
 * game come back (user override wins; otherwise the heuristic flag).
 */
export async function getCachedGames() {
  const db = await getDb();
  const res = await db.query(
    `SELECT package_name, app_name, icon_base64, detected_is_game, user_is_game,
            detected_category, user_category, first_install_ms, last_update_ms
       FROM games
      WHERE COALESCE(user_is_game, detected_is_game) = 1
      ORDER BY app_name COLLATE NOCASE ASC`,
  );
  return (res.values ?? []).map(rowToGame);
}

/**
 * Read every detected app (games + non-games). Used by the Manage Games
 * screen so the user can flip "is a game" on apps the heuristic missed.
 */
export async function getAllInstalled() {
  const db = await getDb();
  const res = await db.query(
    `SELECT package_name, app_name, icon_base64, detected_is_game, user_is_game,
            detected_category, user_category, first_install_ms, last_update_ms
       FROM games
      ORDER BY app_name COLLATE NOCASE ASC`,
  );
  return (res.values ?? []).map(rowToGame);
}

/**
 * Invokes the Capacitor plugin and upserts every returned row. Any row
 * whose last_seen_ms predates the scan is deleted (uninstalled apps).
 */
export async function rescan() {
  const { games, scannedAt } = await GameDetector.getInstalledGames();
  const db = await getDb();

  for (const g of games) {
    await db.run(
      `INSERT INTO games
         (package_name, app_name, icon_base64, detected_is_game, detected_category,
          first_install_ms, last_update_ms, last_seen_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(package_name) DO UPDATE SET
         app_name           = excluded.app_name,
         icon_base64        = excluded.icon_base64,
         detected_is_game   = excluded.detected_is_game,
         detected_category  = excluded.detected_category,
         first_install_ms   = excluded.first_install_ms,
         last_update_ms     = excluded.last_update_ms,
         last_seen_ms       = excluded.last_seen_ms`,
      [
        g.packageName,
        g.appName,
        g.iconBase64 ?? null,
        g.isGame ? 1 : 0,
        g.category ?? null,
        g.firstInstallTime ?? 0,
        g.lastUpdateTime ?? 0,
        scannedAt,
      ],
    );
  }

  // Prune rows from previous scans that didn't show up this time.
  await db.run('DELETE FROM games WHERE last_seen_ms < ?', [scannedAt]);
  await persistIfWeb();
  return { scannedAt, total: games.length };
}

/**
 * Set or clear the per-game "is a game" override.
 *
 * @param {string} packageName
 * @param {boolean|null} value  true/false to override; null to clear.
 */
export async function setUserIsGame(packageName, value) {
  const db = await getDb();
  const sqlValue = value === null ? null : value ? 1 : 0;
  await db.run(
    `UPDATE games SET user_is_game = ? WHERE package_name = ?`,
    [sqlValue, packageName],
  );
  await persistIfWeb();
}

/**
 * Set or clear the per-game category override.
 *
 * @param {string} packageName
 * @param {string|null} category  one of the spec's category strings, or null
 *                                to clear the override.
 */
export async function setUserCategory(packageName, category) {
  const db = await getDb();
  await db.run(
    `UPDATE games SET user_category = ? WHERE package_name = ?`,
    [category, packageName],
  );
  await persistIfWeb();
}

// ---------- helpers ----------

function rowToGame(r) {
  const isGame = r.user_is_game !== null && r.user_is_game !== undefined
    ? r.user_is_game === 1
    : r.detected_is_game === 1;
  const category = r.user_category ?? r.detected_category ?? null;
  return {
    packageName: r.package_name,
    appName: r.app_name,
    iconBase64: r.icon_base64 ?? null,
    isGame,
    category,
    firstInstallTime: r.first_install_ms ?? 0,
    lastUpdateTime: r.last_update_ms ?? 0,
  };
}

async function persistIfWeb() {
  if (Capacitor.getPlatform() !== 'web') return;
  const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  await sqlite.saveToStore('mystery-choice');
}
