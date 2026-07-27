import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { newId } from "../utils/ids.js";

export const plansRouter = Router();
plansRouter.use(requireAuth);

plansRouter.get("/", (req, res) => {
  res.json(
    db
      .prepare("SELECT * FROM plans WHERE outlet_id = ? ORDER BY price ASC")
      .all(req.user.outletId)
  );
});

plansRouter.post("/", (req, res) => {
  const { plan_name: planName, duration_days: durationDays, price, description } = req.body;
  if (!planName || !durationDays || price == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const id = newId();
  db.prepare(
    `INSERT INTO plans (id, outlet_id, plan_name, duration_days, price, description)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.outletId, planName, durationDays, price, description ?? null);

  res.status(201).json(db.prepare("SELECT * FROM plans WHERE id = ?").get(id));
});

plansRouter.patch("/:id", (req, res) => {
  const { plan_name: planName, duration_days: durationDays, price, description, is_active: isActive } = req.body;
  db.prepare(
    `UPDATE plans SET
       plan_name = COALESCE(?, plan_name),
       duration_days = COALESCE(?, duration_days),
       price = COALESCE(?, price),
       description = COALESCE(?, description),
       is_active = COALESCE(?, is_active)
     WHERE id = ? AND outlet_id = ?`
  ).run(planName, durationDays, price, description, isActive, req.params.id, req.user.outletId);

  res.json(db.prepare("SELECT * FROM plans WHERE id = ?").get(req.params.id));
});

plansRouter.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM plans WHERE id = ? AND outlet_id = ?").run(req.params.id, req.user.outletId);
  res.status(204).end();
});
