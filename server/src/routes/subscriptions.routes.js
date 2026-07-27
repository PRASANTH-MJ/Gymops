import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { newId } from "../utils/ids.js";

export const subscriptionsRouter = Router();
subscriptionsRouter.use(requireAuth);

// Mirrors the payments.gymops.in pricing tiers.
export const SAAS_TIERS = {
  "1_month": { label: "1 Month", days: 30, price: 399 },
  "3_months": { label: "3 Months", days: 90, price: 699 },
  "6_months": { label: "6 Months", days: 180, price: 1099 },
  "1_year": { label: "1 Year", days: 365, price: 1999 },
};

subscriptionsRouter.get("/tiers", (_req, res) => {
  res.json(SAAS_TIERS);
});

subscriptionsRouter.get("/current", (req, res) => {
  const sub = db
    .prepare(
      `SELECT * FROM saas_subscriptions WHERE outlet_id = ?
       ORDER BY expiry_date DESC LIMIT 1`
    )
    .get(req.user.outletId);

  if (!sub) return res.json(null);

  const daysLeft = Math.ceil(
    (new Date(sub.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
  );
  res.json({ ...sub, days_left: daysLeft });
});

// POST /api/subscriptions/purchase — "Pay Now" on the pricing page
subscriptionsRouter.post("/purchase", (req, res) => {
  const { tier } = req.body;
  const tierInfo = SAAS_TIERS[tier];
  if (!tierInfo) return res.status(400).json({ error: "Unknown tier" });

  const id = newId();
  const startDate = new Date().toISOString().slice(0, 10);
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + tierInfo.days);

  db.prepare(
    `INSERT INTO saas_subscriptions (id, outlet_id, tier, price, start_date, expiry_date, status)
     VALUES (?, ?, ?, ?, ?, ?, 'active')`
  ).run(id, req.user.outletId, tier, tierInfo.price, startDate, expiry.toISOString().slice(0, 10));

  res.status(201).json(db.prepare("SELECT * FROM saas_subscriptions WHERE id = ?").get(id));
});
