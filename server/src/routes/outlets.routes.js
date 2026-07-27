import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

export const outletsRouter = Router();
outletsRouter.use(requireAuth);

outletsRouter.get("/me", (req, res) => {
  const outlet = db
    .prepare("SELECT * FROM outlets WHERE id = ?")
    .get(req.user.outletId);

  const subscription = db
    .prepare(
      `SELECT * FROM saas_subscriptions
       WHERE outlet_id = ? ORDER BY expiry_date DESC LIMIT 1`
    )
    .get(req.user.outletId);

  res.json({ outlet, subscription });
});

outletsRouter.patch("/me", (req, res) => {
  const { name, location, phone, currency, timezone } = req.body;
  db.prepare(
    `UPDATE outlets SET
       name = COALESCE(?, name),
       location = COALESCE(?, location),
       phone = COALESCE(?, phone),
       currency = COALESCE(?, currency),
       timezone = COALESCE(?, timezone)
     WHERE id = ?`
  ).run(name, location, phone, currency, timezone, req.user.outletId);

  res.json(db.prepare("SELECT * FROM outlets WHERE id = ?").get(req.user.outletId));
});
