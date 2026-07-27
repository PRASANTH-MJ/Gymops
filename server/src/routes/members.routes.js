import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { newId } from "../utils/ids.js";

export const membersRouter = Router();
membersRouter.use(requireAuth);

const SELECT_WITH_STATUS = `
  SELECT m.*, p.plan_name, p.price AS plan_price,
         CAST(julianday(m.expiry_date) - julianday('now') AS INTEGER) AS days_left
  FROM members m
  LEFT JOIN plans p ON p.id = m.plan_id
  WHERE m.outlet_id = ?
`;

// GET /api/members?q=&field=name|id|phone&status=&gender=&batch=&plan_id=
membersRouter.get("/", (req, res) => {
  const { q, field = "name", status, gender, batch, plan_id: planId } = req.query;

  let sql = SELECT_WITH_STATUS;
  const params = [req.user.outletId];

  if (q) {
    const column = field === "id" ? "m.member_code" : field === "phone" ? "m.phone" : "m.full_name";
    sql += ` AND ${column} LIKE ?`;
    params.push(`%${q}%`);
  }
  if (status) {
    sql += " AND m.status = ?";
    params.push(status);
  }
  if (gender) {
    sql += " AND m.gender = ?";
    params.push(gender);
  }
  if (batch) {
    sql += " AND m.batch = ?";
    params.push(batch);
  }
  if (planId) {
    sql += " AND m.plan_id = ?";
    params.push(planId);
  }
  sql += " ORDER BY m.created_at DESC";

  res.json(db.prepare(sql).all(...params));
});

membersRouter.get("/:id", (req, res) => {
  const member = db
    .prepare(SELECT_WITH_STATUS + " AND m.id = ?")
    .get(req.user.outletId, req.params.id);

  if (!member) return res.status(404).json({ error: "Member not found" });

  const transactions = db
    .prepare(
      "SELECT * FROM transactions WHERE member_id = ? ORDER BY paid_at DESC"
    )
    .all(req.params.id);

  res.json({ ...member, transactions });
});

// Mirrors the "Add New Member" wizard: profile fields + first
// admission transaction (plan, admission/discount amounts, payment mode,
// amount collected) created atomically.
membersRouter.post("/", (req, res) => {
  const {
    member_code,
    full_name,
    phone,
    gender,
    batch,
    email,
    plan_id: planId,
    start_date: startDate,
    admission_amount: admissionAmount = 0,
    discount_amount: discountAmount = 0,
    method = "cash",
    amount_collected: amountCollected = 0,
    height_cm: heightCm,
    weight_kg: weightKg,
    address,
    date_of_birth: dateOfBirth,
    notes,
  } = req.body;

  if (!member_code || !full_name || !phone || !startDate) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const plan = planId
    ? db.prepare("SELECT * FROM plans WHERE id = ? AND outlet_id = ?").get(planId, req.user.outletId)
    : null;

  const durationDays = plan?.duration_days ?? 30;
  const planAmount = plan?.price ?? 0;
  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + durationDays);

  const amountPayable = planAmount + Number(admissionAmount) - Number(discountAmount);
  const dueAmount = Math.max(amountPayable - Number(amountCollected), 0);

  const memberId = newId();

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO members
         (id, outlet_id, member_code, full_name, phone, email, gender, batch,
          plan_id, start_date, expiry_date, due_amount, height_cm, weight_kg,
          address, date_of_birth, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      memberId,
      req.user.outletId,
      member_code,
      full_name,
      phone,
      email ?? null,
      gender ?? null,
      batch ?? null,
      planId ?? null,
      startDate,
      expiryDate.toISOString().slice(0, 10),
      dueAmount,
      heightCm ?? null,
      weightKg ?? null,
      address ?? null,
      dateOfBirth ?? null,
      notes ?? null,
      req.user.staffId
    );

    db.prepare(
      `INSERT INTO transactions
         (id, outlet_id, member_id, type, method, plan_amount, admission_amount,
          discount_amount, amount_collected, amount_due, collected_by)
       VALUES (?, ?, ?, 'admission', ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      newId(),
      req.user.outletId,
      memberId,
      method,
      planAmount,
      admissionAmount,
      discountAmount,
      amountCollected,
      dueAmount,
      req.user.staffId
    );
  });
  tx();

  res.status(201).json(
    db.prepare(SELECT_WITH_STATUS + " AND m.id = ?").get(req.user.outletId, memberId)
  );
});

membersRouter.patch("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM members WHERE id = ? AND outlet_id = ?")
    .get(req.params.id, req.user.outletId);
  if (!existing) return res.status(404).json({ error: "Member not found" });

  const fields = [
    "full_name", "phone", "email", "gender", "batch", "plan_id",
    "start_date", "expiry_date", "due_amount", "status", "height_cm",
    "weight_kg", "address", "date_of_birth", "notes",
  ];
  const updates = [];
  const params = [];
  for (const field of fields) {
    if (field in req.body) {
      updates.push(`${field} = ?`);
      params.push(req.body[field]);
    }
  }
  if (updates.length === 0) return res.json(existing);

  params.push(req.params.id);
  db.prepare(`UPDATE members SET ${updates.join(", ")} WHERE id = ?`).run(...params);

  res.json(
    db.prepare(SELECT_WITH_STATUS + " AND m.id = ?").get(req.user.outletId, req.params.id)
  );
});

// Renew: extends expiry_date from a plan and records a transaction,
// mirroring the mobile "renew_member" flow.
membersRouter.post("/:id/renew", (req, res) => {
  const member = db
    .prepare("SELECT * FROM members WHERE id = ? AND outlet_id = ?")
    .get(req.params.id, req.user.outletId);
  if (!member) return res.status(404).json({ error: "Member not found" });

  const { plan_id: planId, method = "cash", amount_collected: amountCollected = 0 } = req.body;
  const plan = db.prepare("SELECT * FROM plans WHERE id = ? AND outlet_id = ?").get(planId, req.user.outletId);
  if (!plan) return res.status(400).json({ error: "Invalid plan" });

  const base = new Date(member.expiry_date) > new Date() ? new Date(member.expiry_date) : new Date();
  base.setDate(base.getDate() + plan.duration_days);
  const newExpiry = base.toISOString().slice(0, 10);
  const dueAmount = Math.max(plan.price - Number(amountCollected), 0);

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE members SET plan_id = ?, expiry_date = ?, due_amount = due_amount + ?, status = 'active' WHERE id = ?`
    ).run(planId, newExpiry, dueAmount, req.params.id);

    db.prepare(
      `INSERT INTO transactions
         (id, outlet_id, member_id, type, method, plan_amount, amount_collected, amount_due, collected_by)
       VALUES (?, ?, ?, 'renewal', ?, ?, ?, ?, ?)`
    ).run(newId(), req.user.outletId, req.params.id, method, plan.price, amountCollected, dueAmount, req.user.staffId);
  });
  tx();

  res.json(db.prepare(SELECT_WITH_STATUS + " AND m.id = ?").get(req.user.outletId, req.params.id));
});
