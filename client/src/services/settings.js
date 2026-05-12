import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { getDb } from './database.js';

export async function getSetting(key, fallback = null) {
  const db = await getDb();
  const res = await db.query('SELECT value_json FROM settings WHERE key = ?', [key]);
  const row = res.values?.[0];
  if (!row) return fallback;
  try {
    return JSON.parse(row.value_json);
  } catch {
    return fallback;
  }
}

export async function setSetting(key, value) {
  const db = await getDb();
  await db.run(
    `INSERT INTO settings (key, value_json, updated_at_ms) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at_ms = excluded.updated_at_ms`,
    [key, JSON.stringify(value), Date.now()],
  );
  await persistIfWeb();
}

export async function deleteSetting(key) {
  const db = await getDb();
  await db.run('DELETE FROM settings WHERE key = ?', [key]);
  await persistIfWeb();
}

export async function getAllSettings() {
  const db = await getDb();
  const res = await db.query('SELECT key, value_json FROM settings');
  const out = {};
  for (const row of res.values ?? []) {
    try {
      out[row.key] = JSON.parse(row.value_json);
    } catch {
      // skip malformed row
    }
  }
  return out;
}

async function persistIfWeb() {
  if (Capacitor.getPlatform() !== 'web') return;
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  await sqlite.saveToStore('mystery-choice');
}
