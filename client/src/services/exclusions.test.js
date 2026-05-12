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

const { getExclusions, getExclusionsDetailed, exclude, unexclude } = await import(
  './exclusions.js'
);

beforeEach(async () => {
  if (fakeDb) await fakeDb.close();
  fakeDb = createFakeDb();
  await fakeDb.execute(`
    CREATE TABLE excluded_games (
      package_name      TEXT PRIMARY KEY,
      reason            TEXT,
      excluded_at_ms    INTEGER NOT NULL
    );
  `);
});

describe('exclusions', () => {
  it('exclude inserts a row', async () => {
    await exclude('com.a', 'Too long');
    const set = await getExclusions();
    expect(set.has('com.a')).toBe(true);
    expect(set.size).toBe(1);
  });

  it('exclude is idempotent and updates the reason', async () => {
    await exclude('com.a', 'reason 1');
    await exclude('com.a', 'reason 2');
    const detailed = await getExclusionsDetailed();
    expect(detailed).toHaveLength(1);
    expect(detailed[0].reason).toBe('reason 2');
  });

  it('reason is optional', async () => {
    await exclude('com.b');
    const [row] = await getExclusionsDetailed();
    expect(row.packageName).toBe('com.b');
    expect(row.reason).toBeNull();
  });

  it('unexclude removes the row', async () => {
    await exclude('com.a');
    await exclude('com.b');
    await unexclude('com.a');
    const set = await getExclusions();
    expect(set.has('com.a')).toBe(false);
    expect(set.has('com.b')).toBe(true);
  });

  it('unexclude on a non-existent package is a no-op', async () => {
    await exclude('com.a');
    await unexclude('com.nonexistent');
    const set = await getExclusions();
    expect(set.size).toBe(1);
  });

  it('getExclusionsDetailed returns timestamps in ms', async () => {
    const before = Date.now();
    await exclude('com.a', 'r');
    const [row] = await getExclusionsDetailed();
    expect(row.excludedAtMs).toBeGreaterThanOrEqual(before);
    expect(row.excludedAtMs).toBeLessThanOrEqual(Date.now());
  });
});
