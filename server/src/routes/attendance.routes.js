import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { newId } from "../utils/ids.js";

export const attendanceRouter = Router();
attendanceRouter.use(requireAuth);

// GET /api/attendance?member_id= — check-in history for the member drawer
attendanceRouter.get("/", (req, res) => {
  const { member_id: memberId, limit = 20 } = req.query;
  if (!memberId) return res.status(400).json({ error: "member_id is required" });

  res.json(
    db
      .prepare(
        `SELECT * FROM attendance WHERE outlet_id = ? AND member_id = ?
         ORDER BY checked_in_at DESC LIMIT ?`
      )
      .all(req.user.outletId, memberId, Number(limit))
  );
});

// GET /api/attendance/today — powers the Dashboard "Attendance Today" tile
attendanceRouter.get("/today", (req, res) => {
  const { count } = db
    .prepare(
      `SELECT COUNT(*) AS count FROM attendance
       WHERE outlet_id = ? AND date(checked_in_at) = date('now')`
    )
    .get(req.user.outletId);
  res.json({ count });
});

// POST /api/attendance — mobile "Quick Check-in" FAB
attendanceRouter.post("/", (req, res) => {
  const { member_id: memberId, source = "manual" } = req.body;
  const member = db
    .prepare("SELECT * FROM members WHERE id = ? AND outlet_id = ?")
    .get(memberId, req.user.outletId);

  if (!member) return res.status(404).json({ error: "Member not found" });
  if (member.status !== "active" || new Date(member.expiry_date) < new Date()) {
    return res.status(400).json({ error: "Membership is not active" });
  }

  const id = newId();
  db.prepare(
    "INSERT INTO attendance (id, outlet_id, member_id, source) VALUES (?, ?, ?, ?)"
  ).run(id, req.user.outletId, memberId, source);

  res.status(201).json(db.prepare("SELECT * FROM attendance WHERE id = ?").get(id));
});
