import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { newId } from "../utils/ids.js";

export const reminderTemplatesRouter = Router();
reminderTemplatesRouter.use(requireAuth);

const DEFAULT_BODIES = {
  plan_expiring:
    "Hi {member_name},\nKindly renew your gym membership before it expires.\nExpires on : {end_date}\n\nRegards,\n{gym_name}",
  plan_expired:
    "Hi {member_name},\nYour gym membership expired on {end_date}.\nKindly renew it soon.\n\nRegards,\n{gym_name}",
  pending_due:
    "Hi {member_name},\nYour gym membership has a pending due amount of {due_amount}.\nKindly clear the dues soon.\n\nRegards,\n{gym_name}",
  birthday_wish:
    "Hi {member_name},\nWe wish you a very Happy Birthday.\nEnjoy your day.\n\nRegards,\n{gym_name}",
};

reminderTemplatesRouter.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM reminder_templates WHERE outlet_id = ?")
    .all(req.user.outletId);

  const byType = Object.fromEntries(rows.map((r) => [r.type, r]));
  const result = Object.keys(DEFAULT_BODIES).map((type) => ({
    id: byType[type]?.id ?? null,
    type,
    body: byType[type]?.body ?? DEFAULT_BODIES[type],
    updated_at: byType[type]?.updated_at ?? null,
  }));

  res.json(result);
});

reminderTemplatesRouter.put("/:type", (req, res) => {
  const { type } = req.params;
  const { body } = req.body;
  if (!(type in DEFAULT_BODIES)) return res.status(400).json({ error: "Unknown template type" });
  if (!body) return res.status(400).json({ error: "body is required" });

  const existing = db
    .prepare("SELECT id FROM reminder_templates WHERE outlet_id = ? AND type = ?")
    .get(req.user.outletId, type);

  if (existing) {
    db.prepare(
      "UPDATE reminder_templates SET body = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(body, existing.id);
  } else {
    db.prepare(
      "INSERT INTO reminder_templates (id, outlet_id, type, body) VALUES (?, ?, ?, ?)"
    ).run(newId(), req.user.outletId, type, body);
  }

  res.json(
    db.prepare("SELECT * FROM reminder_templates WHERE outlet_id = ? AND type = ?")
      .get(req.user.outletId, type)
  );
});
