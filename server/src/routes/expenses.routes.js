import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { newId } from "../utils/ids.js";

export const expensesRouter = Router();
expensesRouter.use(requireAuth);

expensesRouter.get("/", (req, res) => {
  const { from, to } = req.query;
  let sql = "SELECT * FROM expenses WHERE outlet_id = ?";
  const params = [req.user.outletId];
  if (from) { sql += " AND date >= ?"; params.push(from); }
  if (to) { sql += " AND date <= ?"; params.push(to); }
  sql += " ORDER BY date DESC";
  res.json(db.prepare(sql).all(...params));
});

expensesRouter.post("/", (req, res) => {
  const { category, amount, date, notes } = req.body;
  if (!category || amount == null || !date) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const id = newId();
  db.prepare(
    `INSERT INTO expenses (id, outlet_id, category, amount, date, notes, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.outletId, category, amount, date, notes ?? null, req.user.staffId);

  res.status(201).json(db.prepare("SELECT * FROM expenses WHERE id = ?").get(id));
});

expensesRouter.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM expenses WHERE id = ? AND outlet_id = ?").run(req.params.id, req.user.outletId);
  res.status(204).end();
});
