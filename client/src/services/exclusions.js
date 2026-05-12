import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { getDb } from './database.js';

/**
 * Returns the set of excluded package names. Sets are cheap to look up
 * during eligible-pool filtering on every spin.
 */
export async function getExclusions() {
  const db = await getDb();
  const res = await db.query('SELECT package_name FROM excluded_games');
  return new Set((res.values ?? []).map((r) => r.package_name));
}

/**
 * Returns full exclusion rows including reason + excluded-at timestamp.
 * Used by the Manage Games screen.
 */
export async function getExclusionsDetailed() {
  const db = await getDb();
  const res = await db.query(
    `SELECT package_name, reason, excluded_at_ms FROM excluded_games`,
  );
  return (res.values ?? []).map((r) => ({
    packageName: r.package_name,
    reason: r.reason,
    excludedAtMs: r.excluded_at_ms,
  }));
}

export async function exclude(packageName, reason = null) {
  const db = await getDb();
  await db.run(
    `INSERT INTO excluded_games (package_name, reason, excluded_at_ms)
     VALUES (?, ?, ?)
     ON CONFLICT(package_name) DO UPDATE SET reason = excluded.reason, excluded_at_ms = excluded.excluded_at_ms`,
    [packageName, reason, Date.now()],
  );
  await persistIfWeb();
}

export async function unexclude(packageName) {
  const db = await getDb();
  await db.run('DELETE FROM excluded_games WHERE package_name = ?', [packageName]);
  await persistIfWeb();
}

async function persistIfWeb() {
  if (Capacitor.getPlatform() !== 'web') return;
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  await sqlite.saveToStore('mystery-choice');
}
