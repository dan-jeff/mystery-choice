import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { getDb } from './database.js';
import { getSetting } from './settings.js';
import { DEFAULTS } from './settings-defaults.js';

const HISTORY_LENGTH_KEY = 'historyLength';

/**
 * Record a spin result. Returns the inserted row id.
 *
 * @param {{ winner: object, weightScore: number, breakdown: object, fallbackUsed: boolean }} result
 * @param {number} [nowMs]
 */
export async function recordSpin(result, nowMs = Date.now()) {
  const db = await getDb();
  const { winner, weightScore, breakdown, fallbackUsed } = result;

  const res = await db.run(
    `INSERT INTO spins
       (package_name, app_name, weight_score, breakdown_json, fallback_used, spun_at_ms)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      winner.packageName,
      winner.appName,
      weightScore ?? null,
      breakdown ? JSON.stringify(breakdown) : null,
      fallbackUsed ? 1 : 0,
      nowMs,
    ],
  );

  const insertedId = res.changes?.lastId ?? null;
  await pruneByRetention();
  await persistIfWeb();
  return insertedId;
}

/**
 * Mark an existing spin row as launched at the given time.
 */
export async function markLaunched(spinId, launchedAtMs = Date.now()) {
  const db = await getDb();
  await db.run(
    `UPDATE spins SET launched = 1, launched_at_ms = ? WHERE id = ?`,
    [launchedAtMs, spinId],
  );
  await persistIfWeb();
}

/**
 * Page through history, newest first.
 */
export async function getRecentSpins(limit = 50, offset = 0) {
  const db = await getDb();
  const res = await db.query(
    `SELECT id, package_name, app_name, weight_score, breakdown_json,
            fallback_used, spun_at_ms, launched, launched_at_ms
       FROM spins
      ORDER BY spun_at_ms DESC
      LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return (res.values ?? []).map(rowToSpin);
}

/**
 * Most-recent N spins, used by the engine to compute recency/frequency
 * components without paging.
 */
export async function getEngineHistory(maxN = 200) {
  return getRecentSpins(maxN, 0);
}

/**
 * Aggregate stats. Optionally bounded by a date range.
 */
export async function getStats({ fromMs, toMs } = {}) {
  const db = await getDb();
  const whereClauses = [];
  const params = [];
  if (fromMs !== undefined) {
    whereClauses.push('spun_at_ms >= ?');
    params.push(fromMs);
  }
  if (toMs !== undefined) {
    whereClauses.push('spun_at_ms <= ?');
    params.push(toMs);
  }
  const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const totalRes = await db.query(`SELECT COUNT(*) AS n FROM spins ${where}`, params);
  const total = totalRes.values?.[0]?.n ?? 0;

  const topRes = await db.query(
    `SELECT package_name, app_name, COUNT(*) AS spins
       FROM spins ${where}
      GROUP BY package_name
      ORDER BY spins DESC
      LIMIT 5`,
    params,
  );
  const mostSpun = (topRes.values ?? []).map((r) => ({
    packageName: r.package_name,
    appName: r.app_name,
    spins: r.spins,
  }));

  const bottomRes = await db.query(
    `SELECT package_name, app_name, COUNT(*) AS spins
       FROM spins ${where}
      GROUP BY package_name
      ORDER BY spins ASC
      LIMIT 5`,
    params,
  );
  const leastSpun = (bottomRes.values ?? []).map((r) => ({
    packageName: r.package_name,
    appName: r.app_name,
    spins: r.spins,
  }));

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentRes = await db.query(
    `SELECT COUNT(*) AS n FROM spins WHERE spun_at_ms >= ?`,
    [sevenDaysAgo],
  );
  const last7Days = recentRes.values?.[0]?.n ?? 0;

  return { total, mostSpun, leastSpun, last7Days };
}

/**
 * Wipe every spin row. Used by the Settings → Data → Delete-all path (007).
 */
export async function clearAll() {
  const db = await getDb();
  await db.run('DELETE FROM spins');
  await persistIfWeb();
}

/**
 * Export rows in chronological order (oldest first) as a JSON string.
 */
export async function exportJson() {
  const all = await getAllSpinsChronological();
  return JSON.stringify(all, null, 2);
}

/**
 * Export rows as CSV (RFC 4180 escaping). Hand-rolled — no library.
 */
export async function exportCsv() {
  const all = await getAllSpinsChronological();
  const header = ['timestamp', 'package_name', 'app_name', 'weight_score', 'launched'];
  const rows = all.map((s) => [
    new Date(s.spunAtMs).toISOString(),
    s.packageName,
    s.appName,
    s.weightScore ?? '',
    s.launched ? '1' : '0',
  ]);
  return [header, ...rows].map((cols) => cols.map(escapeCsv).join(',')).join('\r\n');
}

// ---------- internals ----------

async function getAllSpinsChronological() {
  const db = await getDb();
  const res = await db.query(
    `SELECT id, package_name, app_name, weight_score, breakdown_json,
            fallback_used, spun_at_ms, launched, launched_at_ms
       FROM spins
      ORDER BY spun_at_ms ASC`,
  );
  return (res.values ?? []).map(rowToSpin);
}

async function pruneByRetention() {
  const limit = await getSetting(HISTORY_LENGTH_KEY, DEFAULTS.historyLength);
  if (!Number.isFinite(limit) || limit <= 0) return;
  const db = await getDb();
  await db.run(
    `DELETE FROM spins
      WHERE id IN (
        SELECT id FROM spins ORDER BY spun_at_ms DESC LIMIT -1 OFFSET ?
      )`,
    [limit],
  );
}

function rowToSpin(r) {
  let breakdown = null;
  if (r.breakdown_json) {
    try {
      breakdown = JSON.parse(r.breakdown_json);
    } catch {
      breakdown = null;
    }
  }
  return {
    id: r.id,
    packageName: r.package_name,
    appName: r.app_name,
    weightScore: r.weight_score,
    breakdown,
    fallbackUsed: r.fallback_used === 1,
    spunAtMs: r.spun_at_ms,
    launched: r.launched === 1,
    launchedAtMs: r.launched_at_ms,
  };
}

function escapeCsv(value) {
  const s = String(value ?? '');
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function persistIfWeb() {
  if (Capacitor.getPlatform() !== 'web') return;
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  await sqlite.saveToStore('mystery-choice');
}
