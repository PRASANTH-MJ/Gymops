import { getDb, setMeta } from "@/db/client";
import { api, apiRequest } from "@/lib/api";

export interface MemberRow {
  id: string;
  member_code: string;
  full_name: string;
  phone: string;
  gender: string | null;
  batch: string | null;
  plan_id: string | null;
  plan_name: string | null;
  plan_price: number | null;
  start_date: string;
  expiry_date: string;
  days_left: number;
  due_amount: number;
  status: string;
  is_pending?: number;
}

export interface TransactionRow {
  id: string;
  member_id: string | null;
  member_name: string | null;
  type: string;
  method: string;
  plan_amount: number;
  admission_amount: number;
  discount_amount: number;
  amount_collected: number;
  amount_due: number;
  paid_at: string;
  is_pending?: number;
}

export interface AttendanceRow {
  id: string;
  member_id: string;
  member_name: string | null;
  source: string;
  checked_in_at: string;
  is_pending?: number;
}

export interface PlanRow {
  id: string;
  plan_name: string;
  duration_days: number;
  price: number;
  description: string | null;
}

interface SyncQueueRow {
  id: number;
  entity_type: string;
  method: string;
  endpoint: string;
  body: string;
  local_temp_id: string | null;
}

function replaceSyncedRows(table: string, rows: Array<Record<string, unknown>>) {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync(`DELETE FROM ${table} WHERE is_pending = 0`);
    for (const row of rows) {
      const keys = Object.keys(row);
      const placeholders = keys.map(() => "?").join(", ");
      db.runSync(
        `INSERT OR REPLACE INTO ${table} (${keys.join(", ")}, is_pending) VALUES (${placeholders}, 0)`,
        keys.map((k) => row[k] as never)
      );
    }
  });
}

async function pullAll() {
  const [members, plans, transactions, attendanceToday] = await Promise.all([
    api.getMembers() as Promise<any[]>,
    api.getPlans() as Promise<PlanRow[]>,
    api.getTransactions({
      from: new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
    }) as Promise<any[]>,
    api.getAttendanceTodayList() as Promise<any[]>,
  ]);

  replaceSyncedRows(
    "members",
    members.map((m) => ({
      id: m.id,
      member_code: m.member_code,
      full_name: m.full_name,
      phone: m.phone,
      gender: m.gender,
      batch: m.batch,
      plan_id: m.plan_id,
      plan_name: m.plan_name,
      plan_price: m.plan_price,
      start_date: m.start_date,
      expiry_date: m.expiry_date,
      days_left: m.days_left,
      due_amount: m.due_amount,
      status: m.status,
    }))
  );

  replaceSyncedRows(
    "plans",
    plans.map((p) => ({
      id: p.id,
      plan_name: p.plan_name,
      duration_days: p.duration_days,
      price: p.price,
      description: p.description,
    }))
  );

  replaceSyncedRows(
    "transactions",
    transactions.map((t) => ({
      id: t.id,
      member_id: t.member_id,
      member_name: t.member_name ?? null,
      type: t.type,
      method: t.method,
      plan_amount: t.plan_amount,
      admission_amount: t.admission_amount,
      discount_amount: t.discount_amount,
      amount_collected: t.amount_collected,
      amount_due: t.amount_due,
      paid_at: t.paid_at,
    }))
  );

  // Attendance cache only tracks today (matches what the Dashboard needs);
  // offline check-ins queued for today stay as is_pending rows until synced.
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync(
      "DELETE FROM attendance WHERE is_pending = 0 AND date(checked_in_at) = date('now')"
    );
    for (const a of attendanceToday) {
      db.runSync(
        `INSERT OR REPLACE INTO attendance (id, member_id, member_name, source, checked_in_at, is_pending)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [a.id, a.member_id, a.member_name ?? null, a.source, a.checked_in_at]
      );
    }
  });

  setMeta("last_synced_at", new Date().toISOString());
}

async function pushQueue(): Promise<{ pushed: number; failed: number }> {
  const db = getDb();
  const queued = db.getAllSync<SyncQueueRow>(
    "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC"
  );

  let pushed = 0;
  let failed = 0;

  for (const item of queued) {
    try {
      await apiRequest(item.endpoint, { method: item.method, body: item.body });
      db.runSync("DELETE FROM sync_queue WHERE id = ?", [item.id]);
      if (item.local_temp_id) {
        const table = item.entity_type === "member" ? "members" : item.entity_type === "attendance" ? "attendance" : "transactions";
        db.runSync(`DELETE FROM ${table} WHERE id = ?`, [item.local_temp_id]);
      }
      pushed++;
    } catch (err) {
      failed++;
      db.runSync("UPDATE sync_queue SET status = 'failed', last_error = ? WHERE id = ?", [
        err instanceof Error ? err.message : "Unknown error",
        item.id,
      ]);
    }
  }

  return { pushed, failed };
}

export function getPendingCount(): number {
  const db = getDb();
  const row = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM sync_queue WHERE status IN ('pending', 'failed')"
  );
  return row?.count ?? 0;
}

export function retryFailedQueue() {
  getDb().runSync("UPDATE sync_queue SET status = 'pending' WHERE status = 'failed'");
}

/** Push queued local writes, then pull fresh authoritative data. */
export async function runSync(): Promise<{ pushed: number; failed: number }> {
  const result = await pushQueue();
  await pullAll();
  return result;
}

export function enqueueMutation(
  entityType: "member" | "transaction" | "attendance",
  method: "POST" | "PATCH",
  endpoint: string,
  body: Record<string, unknown>,
  localTempId?: string
) {
  getDb().runSync(
    `INSERT INTO sync_queue (entity_type, method, endpoint, body, local_temp_id) VALUES (?, ?, ?, ?, ?)`,
    [entityType, method, endpoint, JSON.stringify(body), localTempId ?? null]
  );
}
