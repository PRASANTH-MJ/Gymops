import type { SQLiteDatabase } from "expo-sqlite";

// Versioned migrations, matching the pattern of running once, in order,
// tracked via PRAGMA user_version — so upgrading the app never re-runs a
// step or loses local data.
type Migration = { version: number; up: (db: SQLiteDatabase) => void };

export const migrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS meta (
          key TEXT PRIMARY KEY,
          value TEXT
        );

        CREATE TABLE IF NOT EXISTS members (
          id TEXT PRIMARY KEY,
          member_code TEXT NOT NULL,
          full_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          gender TEXT,
          batch TEXT,
          plan_id TEXT,
          plan_name TEXT,
          plan_price REAL,
          start_date TEXT,
          expiry_date TEXT,
          days_left INTEGER,
          due_amount REAL NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'active',
          is_pending INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS plans (
          id TEXT PRIMARY KEY,
          plan_name TEXT NOT NULL,
          duration_days INTEGER NOT NULL,
          price REAL NOT NULL,
          description TEXT
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          member_id TEXT,
          member_name TEXT,
          type TEXT NOT NULL,
          method TEXT NOT NULL,
          plan_amount REAL NOT NULL DEFAULT 0,
          admission_amount REAL NOT NULL DEFAULT 0,
          discount_amount REAL NOT NULL DEFAULT 0,
          amount_collected REAL NOT NULL DEFAULT 0,
          amount_due REAL NOT NULL DEFAULT 0,
          paid_at TEXT NOT NULL DEFAULT (datetime('now')),
          is_pending INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS attendance (
          id TEXT PRIMARY KEY,
          member_id TEXT NOT NULL,
          member_name TEXT,
          source TEXT NOT NULL DEFAULT 'manual',
          checked_in_at TEXT NOT NULL DEFAULT (datetime('now')),
          is_pending INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entity_type TEXT NOT NULL,
          method TEXT NOT NULL,
          endpoint TEXT NOT NULL,
          body TEXT NOT NULL,
          local_temp_id TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          status TEXT NOT NULL DEFAULT 'pending',
          last_error TEXT
        );
      `);
    },
  },
];

export function runMigrations(db: SQLiteDatabase) {
  const { user_version: currentVersion } = db.getFirstSync<{ user_version: number }>(
    "PRAGMA user_version"
  )!;

  const pending = migrations.filter((m) => m.version > currentVersion).sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    db.withTransactionSync(() => {
      migration.up(db);
      db.execSync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}
