// Bridges better-sqlite3 to the @capacitor-community/sqlite API surface
// we actually use (execute / run / query). Tests build a fresh fake per
// suite via createFakeDb().

import Database from 'better-sqlite3';

export function createFakeDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('journal_mode = MEMORY');

  return {
    _native: sqlite,
    async execute(sql) {
      sqlite.exec(sql);
      return { changes: { changes: 0 } };
    },
    async run(sql, params = []) {
      const stmt = sqlite.prepare(sql);
      const info = stmt.run(...(params ?? []));
      return {
        changes: {
          changes: info.changes,
          lastId: Number(info.lastInsertRowid),
        },
      };
    },
    async query(sql, params = []) {
      const stmt = sqlite.prepare(sql);
      const values = stmt.all(...(params ?? []));
      return { values };
    },
    async close() {
      sqlite.close();
    },
  };
}
