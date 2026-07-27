import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { newId } from "../utils/ids.js";

export const enquiriesRouter = Router();
enquiriesRouter.use(requireAuth);

enquiriesRouter.get("/", (req, res) => {
  const { status } = req.query;
  let sql = "SELECT * FROM enquiries WHERE outlet_id = ?";
  const params = [req.user.outletId];
  if (status) { sql += " AND status = ?"; params.push(status); }
  sql += " ORDER BY follow_up_date ASC";
  res.json(db.prepare(sql).all(...params));
});

enquiriesRouter.post("/", (req, res) => {
  const { lead_name: leadName, phone, source, follow_up_date: followUpDate, notes } = req.body;
  if (!leadName || !phone) return res.status(400).json({ error: "Missing required fields" });

  const id = newId();
  db.prepare(
    `INSERT INTO enquiries (id, outlet_id, lead_name, phone, source, follow_up_date, assigned_to, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.outletId, leadName, phone, source ?? null, followUpDate ?? null, req.user.staffId, notes ?? null);

  res.status(201).json(db.prepare("SELECT * FROM enquiries WHERE id = ?").get(id));
});

enquiriesRouter.patch("/:id", (req, res) => {
  const { status, follow_up_date: followUpDate, notes } = req.body;
  db.prepare(
    `UPDATE enquiries SET
       status = COALESCE(?, status),
       follow_up_date = COALESCE(?, follow_up_date),
       notes = COALESCE(?, notes)
     WHERE id = ? AND outlet_id = ?`
  ).run(status, followUpDate, notes, req.params.id, req.user.outletId);

  res.json(db.prepare("SELECT * FROM enquiries WHERE id = ?").get(req.params.id));
});

// Convert enquiry → member is handled client-side by calling
// POST /api/members with the enquiry's name/phone, then marking converted:
enquiriesRouter.post("/:id/convert", (req, res) => {
  db.prepare("UPDATE enquiries SET status = 'converted' WHERE id = ? AND outlet_id = ?")
    .run(req.params.id, req.user.outletId);
  res.json(db.prepare("SELECT * FROM enquiries WHERE id = ?").get(req.params.id));
});
