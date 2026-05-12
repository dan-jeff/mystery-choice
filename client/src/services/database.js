import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'mystery-choice';
let dbPromise;

export async function getDb() {
  if (dbPromise) return dbPromise;
  dbPromise = openAndInit();
  return dbPromise;
}

async function openAndInit() {
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  const platform = Capacitor.getPlatform();

  if (platform === 'web') {
    await sqlite.initWebStore();
  }

  let db;
  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;
  if (isConn) {
    db = await sqlite.retrieveConnection(DB_NAME, false);
  } else {
    db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
  }

  await db.open();
  await initSchema(db);

  if (platform === 'web') {
    // Persist the WASM-backed DB to IndexedDB so writes survive refreshes.
    await sqlite.saveToStore(DB_NAME);
  }

  return db;
}

async function initSchema(db) {
  // Schema is forward-only (constitution §3). All v1 tables live here as
  // CREATE TABLE IF NOT EXISTS; once shipped, additive changes go to
  // services/migrations/NNN-description.sql.

  // 001: infrastructure
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key            TEXT PRIMARY KEY,
      value_json     TEXT NOT NULL,
      updated_at_ms  INTEGER NOT NULL
    );
  `);

  // 006: spin history
  await db.execute(`
    CREATE TABLE IF NOT EXISTS spins (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      package_name    TEXT NOT NULL,
      app_name        TEXT NOT NULL,
      weight_score    REAL,
      breakdown_json  TEXT,
      fallback_used   INTEGER NOT NULL DEFAULT 0,
      spun_at_ms      INTEGER NOT NULL,
      launched        INTEGER NOT NULL DEFAULT 0,
      launched_at_ms  INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_spins_time ON spins(spun_at_ms DESC);
    CREATE INDEX IF NOT EXISTS idx_spins_package ON spins(package_name);
  `);

  // 008: exclusions
  await db.execute(`
    CREATE TABLE IF NOT EXISTS excluded_games (
      package_name      TEXT PRIMARY KEY,
      reason            TEXT,
      excluded_at_ms    INTEGER NOT NULL
    );
  `);

  // 002: installed games cache (Capacitor GameDetector plugin writes here)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS games (
      package_name      TEXT PRIMARY KEY,
      app_name          TEXT NOT NULL,
      icon_base64       TEXT,
      detected_is_game  INTEGER NOT NULL DEFAULT 0,
      user_is_game      INTEGER,
      detected_category TEXT,
      user_category     TEXT,
      first_install_ms  INTEGER NOT NULL,
      last_update_ms    INTEGER NOT NULL,
      last_seen_ms      INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_games_is_game ON games(detected_is_game, user_is_game);
  `);
}

export async function closeDb() {
  if (!dbPromise) return;
  const db = await dbPromise;
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  await db.close();
  await sqlite.closeConnection(DB_NAME, false);
  dbPromise = undefined;
}
