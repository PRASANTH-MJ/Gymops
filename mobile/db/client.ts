import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";
import { runMigrations } from "./schema";

let db: SQLiteDatabase | null = null;

export function getDb(): SQLiteDatabase {
  if (!db) {
    db = openDatabaseSync("gymflow-local.db");
    runMigrations(db);
  }
  return db;
}

export function getMeta(key: string): string | null {
  const row = getDb().getFirstSync<{ value: string }>(
    "SELECT value FROM meta WHERE key = ?",
    [key]
  );
  return row?.value ?? null;
}

export function setMeta(key: string, value: string) {
  getDb().runSync(
    "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value]
  );
}
