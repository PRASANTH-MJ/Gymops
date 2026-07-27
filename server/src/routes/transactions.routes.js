import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { newId } from "../utils/ids.js";
import { buildInvoiceData } from "../services/invoice.js";

export const transactionsRouter = Router();
transactionsRouter.use(requireAuth);

// GET /api/transactions?type=&method=&from=&to=
// Powers the Finance screen's filter tiles (Admission/Renewal/Due Paid/PT/
// Service/Product, Online/Cash) and Income/Expense tabs.
transactionsRouter.get("/", (req, res) => {
  const { type, method, from, to } = req.query;
  let sql = `
    SELECT t.*, m.full_name AS member_name, m.member_code
    FROM transactions t
    LEFT JOIN members m ON m.id = t.member_id
    WHERE t.outlet_id = ?
  `;
  const params = [req.user.outletId];
  if (type) { sql += " AND t.type = ?"; params.push(type); }
  if (method) { sql += " AND t.method = ?"; params.push(method); }
  if (from) { sql += " AND date(t.paid_at) >= date(?)"; params.push(from); }
  if (to) { sql += " AND date(t.paid_at) <= date(?)"; params.push(to); }
  sql += " ORDER BY t.paid_at DESC";

  res.json(db.prepare(sql).all(...params));
});

// GET /api/transactions/summary?from=&to= — Finance screen's "Profit" card
transactionsRouter.get("/summary", (req, res) => {
  const { from, to } = req.query;
  let sql = `
    SELECT
      COALESCE(SUM(amount_collected), 0) AS income,
      COALESCE(SUM(discount_amount), 0) AS discount,
      COALESCE(SUM(CASE WHEN method = 'online' THEN amount_collected ELSE 0 END), 0) AS online_income,
      COALESCE(SUM(CASE WHEN method = 'cash' THEN amount_collected ELSE 0 END), 0) AS cash_income,
      COUNT(CASE WHEN type = 'admission' THEN 1 END) AS admission_count,
      COUNT(CASE WHEN type = 'renewal' THEN 1 END) AS renewal_count,
      COUNT(CASE WHEN type = 'due_paid' THEN 1 END) AS due_paid_count,
      COUNT(CASE WHEN type = 'pt' THEN 1 END) AS pt_count,
      COUNT(CASE WHEN type = 'service' THEN 1 END) AS service_count,
      COUNT(CASE WHEN type = 'product' THEN 1 END) AS product_count
    FROM transactions
    WHERE outlet_id = ?
  `;
  const params = [req.user.outletId];
  if (from) { sql += " AND date(paid_at) >= date(?)"; params.push(from); }
  if (to) { sql += " AND date(paid_at) <= date(?)"; params.push(to); }

  const income = db.prepare(sql).get(...params);

  let expenseSql = "SELECT COALESCE(SUM(amount), 0) AS expense FROM expenses WHERE outlet_id = ?";
  const expenseParams = [req.user.outletId];
  if (from) { expenseSql += " AND date >= ?"; expenseParams.push(from); }
  if (to) { expenseSql += " AND date <= ?"; expenseParams.push(to); }
  const { expense } = db.prepare(expenseSql).get(...expenseParams);

  res.json({ ...income, expense, profit: income.income - expense });
});

// GET /api/transactions/trend?days=7 — daily income totals for the
// Dashboard's revenue trend chart.
transactionsRouter.get("/trend", (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);

  const rows = db
    .prepare(
      `SELECT date(paid_at) AS date, COALESCE(SUM(amount_collected), 0) AS income
       FROM transactions
       WHERE outlet_id = ? AND date(paid_at) >= date('now', ?)
       GROUP BY date(paid_at)`
    )
    .all(req.user.outletId, `-${days - 1} days`);

  const byDate = Object.fromEntries(rows.map((r) => [r.date, r.income]));
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    series.push({ date, income: byDate[date] ?? 0 });
  }

  res.json(series);
});

// POST /api/transactions — ad-hoc due collection / PT / service / product
// sale not tied to the Add Member wizard. Reduces the member's due_amount
// when type = 'due_paid'.
transactionsRouter.post("/", (req, res) => {
  const {
    member_id: memberId,
    type,
    method = "cash",
    plan_amount: planAmount = 0,
    admission_amount: admissionAmount = 0,
    discount_amount: discountAmount = 0,
    amount_collected: amountCollected = 0,
    notes,
  } = req.body;

  if (!type) return res.status(400).json({ error: "type is required" });

  const id = newId();
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO transactions
         (id, outlet_id, member_id, type, method, plan_amount, admission_amount,
          discount_amount, amount_collected, amount_due, collected_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    ).run(id, req.user.outletId, memberId ?? null, type, method, planAmount, admissionAmount, discountAmount, amountCollected, req.user.staffId, notes ?? null);

    if (type === "due_paid" && memberId) {
      db.prepare(
        "UPDATE members SET due_amount = MAX(due_amount - ?, 0) WHERE id = ?"
      ).run(amountCollected, memberId);
    }
  });
  tx();

  res.status(201).json(db.prepare("SELECT * FROM transactions WHERE id = ?").get(id));
});

// GET /api/transactions/:id/invoice — structured data for the invoice PDF
// (member/plan/payment breakdown + terms), matching the reference invoice.
// Outlet-scoped, for internal (authenticated staff) use. The public,
// shareable-link version lives at GET /api/public/invoices/:id.
transactionsRouter.get("/:id/invoice", (req, res) => {
  const invoice = buildInvoiceData(req.params.id, { outletId: req.user.outletId });
  if (!invoice) return res.status(404).json({ error: "Transaction not found" });
  res.json(invoice);
});
