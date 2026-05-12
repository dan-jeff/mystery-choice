import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeDb } from '../test-helpers/fake-db.js';

let fakeDb;

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'android' },
}));

vi.mock('@capacitor-community/sqlite', () => ({
  CapacitorSQLite: {},
  SQLiteConnection: class {
    async saveToStore() {}
  },
}));

vi.mock('./database.js', () => ({
  getDb: vi.fn(() => fakeDb),
}));

// settings.js uses the same getDb mock; we let it run against the fake.
// Re-import targets after the mocks are registered.
const { recordSpin, markLaunched, getRecentSpins, getStats, clearAll, exportJson, exportCsv, getEngineHistory } =
  await import('./history.js');
const { setSetting } = await import('./settings.js');

beforeEach(async () => {
  if (fakeDb) await fakeDb.close();
  fakeDb = createFakeDb();
  await fakeDb.execute(`
    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at_ms INTEGER NOT NULL
    );
    CREATE TABLE spins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_name TEXT NOT NULL,
      app_name TEXT NOT NULL,
      weight_score REAL,
      breakdown_json TEXT,
      fallback_used INTEGER NOT NULL DEFAULT 0,
      spun_at_ms INTEGER NOT NULL,
      launched INTEGER NOT NULL DEFAULT 0,
      launched_at_ms INTEGER
    );
  `);
});

function mkResult(packageName, weightScore = 0.5, fallbackUsed = false) {
  return {
    winner: { packageName, appName: `App ${packageName}` },
    weightScore,
    breakdown: { recency: 0.2, frequency: 0.15, duration: 0, random: 0.15, total: 0.5 },
    fallbackUsed,
  };
}

describe('history.recordSpin', () => {
  it('inserts a row and returns the id', async () => {
    const id = await recordSpin(mkResult('com.a'), 1_700_000_000_000);
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
    const rows = await getRecentSpins(10, 0);
    expect(rows).toHaveLength(1);
    expect(rows[0].packageName).toBe('com.a');
    expect(rows[0].fallbackUsed).toBe(false);
    expect(rows[0].breakdown).toMatchObject({ recency: 0.2 });
  });

  it('serialises the breakdown JSON and round-trips it', async () => {
    await recordSpin(mkResult('com.a', 0.7, true), 100);
    const [row] = await getRecentSpins(1, 0);
    expect(row.fallbackUsed).toBe(true);
    expect(row.breakdown.total).toBe(0.5);
  });

  it('prunes oldest rows once the historyLength setting is exceeded', async () => {
    await setSetting('historyLength', 3);
    for (let i = 1; i <= 5; i += 1) {
      await recordSpin(mkResult(`com.${i}`), 1_000 + i);
    }
    const rows = await getRecentSpins(10, 0);
    expect(rows).toHaveLength(3);
    // newest first
    expect(rows.map((r) => r.packageName)).toEqual(['com.5', 'com.4', 'com.3']);
  });
});

describe('history.markLaunched', () => {
  it('flips the launched flag and stamps the time', async () => {
    const id = await recordSpin(mkResult('com.a'), 100);
    await markLaunched(id, 200);
    const [row] = await getRecentSpins(1, 0);
    expect(row.launched).toBe(true);
    expect(row.launchedAtMs).toBe(200);
  });
});

describe('history.getStats', () => {
  it('returns total, top-N, bottom-N, and a 7-day window count', async () => {
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    await recordSpin(mkResult('com.a'), now - 1_000);
    await recordSpin(mkResult('com.a'), now - 2_000);
    await recordSpin(mkResult('com.a'), now - 3_000);
    await recordSpin(mkResult('com.b'), now - 4_000);
    await recordSpin(mkResult('com.c'), now - week - 5_000); // outside 7-day window

    const stats = await getStats();
    expect(stats.total).toBe(5);
    expect(stats.last7Days).toBe(4);
    expect(stats.mostSpun[0]).toMatchObject({ packageName: 'com.a', spins: 3 });
    // bottom-N includes ties; just check the smallest count is 1
    expect(stats.leastSpun[0].spins).toBe(1);
  });
});

describe('history.clearAll', () => {
  it('removes every row', async () => {
    await recordSpin(mkResult('com.a'), 100);
    await recordSpin(mkResult('com.b'), 200);
    await clearAll();
    const rows = await getRecentSpins(10, 0);
    expect(rows).toHaveLength(0);
  });
});

describe('history.getEngineHistory', () => {
  it('returns most-recent N rows for the engine consumer', async () => {
    for (let i = 0; i < 250; i += 1) {
      await recordSpin(mkResult(`com.${i}`), 1_000 + i);
    }
    // We capped historyLength at 100 by default, so only 100 survive.
    const all = await getRecentSpins(500, 0);
    expect(all.length).toBe(100);
    const engine = await getEngineHistory(50);
    expect(engine).toHaveLength(50);
    expect(engine[0].packageName).toBe('com.249'); // newest first
  });
});

describe('history.exportJson + exportCsv', () => {
  beforeEach(async () => {
    await recordSpin(mkResult('com.a', 0.3), 1000);
    await recordSpin(mkResult('com.b', 0.8), 2000);
    const id = await recordSpin(mkResult('com.c', 0.4), 3000);
    await markLaunched(id, 3500);
  });

  it('exportJson produces parseable JSON in chronological order', async () => {
    const json = await exportJson();
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].packageName).toBe('com.a');
    expect(parsed[2].packageName).toBe('com.c');
    expect(parsed[2].launched).toBe(true);
  });

  it('exportCsv emits a header row + one row per spin with RFC 4180 escaping', async () => {
    const csv = await exportCsv();
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('timestamp,package_name,app_name,weight_score,launched');
    expect(lines).toHaveLength(4);
    expect(lines[3]).toMatch(/com\.c,App com\.c,0\.4,1$/);
  });

  it('exportCsv escapes commas and quotes in app names', async () => {
    await recordSpin(
      {
        winner: { packageName: 'com.weird', appName: 'Foo, "Bar" & Baz' },
        weightScore: 0.1,
        breakdown: null,
        fallbackUsed: false,
      },
      4000,
    );
    const csv = await exportCsv();
    // The escaped cell should appear as: "Foo, ""Bar"" & Baz"
    expect(csv).toContain('"Foo, ""Bar"" & Baz"');
  });
});
