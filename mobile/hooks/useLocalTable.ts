import { useCallback, useEffect, useState } from "react";
import { getDb } from "@/db/client";

// Wraps the common SQLite CRUD pattern every local-first screen needs, so
// members/finance/attendance don't each reinvent "read a table into state,
// let me insert/update/delete a row, refresh."
export function useLocalTable<T extends { id: string }>(table: string) {
  const [rows, setRows] = useState<T[]>([]);

  const refresh = useCallback(() => {
    const result = getDb().getAllSync<T>(
      `SELECT * FROM ${table} ORDER BY rowid DESC`
    );
    setRows(result);
  }, [table]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function insertLocal(row: Record<string, unknown>) {
    const keys = Object.keys(row);
    const placeholders = keys.map(() => "?").join(", ");
    getDb().runSync(
      `INSERT OR REPLACE INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
      keys.map((k) => row[k] as never)
    );
    refresh();
  }

  function updateLocal(id: string, patch: Record<string, unknown>) {
    const keys = Object.keys(patch);
    if (keys.length === 0) return;
    const setClause = keys.map((k) => `${k} = ?`).join(", ");
    getDb().runSync(
      `UPDATE ${table} SET ${setClause} WHERE id = ?`,
      [...keys.map((k) => patch[k] as never), id]
    );
    refresh();
  }

  function removeLocal(id: string) {
    getDb().runSync(`DELETE FROM ${table} WHERE id = ?`, [id]);
    refresh();
  }

  return { rows, refresh, insertLocal, updateLocal, removeLocal };
}
