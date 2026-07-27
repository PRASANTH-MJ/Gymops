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

// GET /api/attendance/today/list — who checked in today, for the Dashboard
// "Today's Attendance" detail widget.
attendanceRouter.get("/today/list", (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT a.id, a.member_id, a.checked_in_at, a.source, m.full_name AS member_name, m.member_code
         FROM attendance a
         JOIN members m ON m.id = a.member_id
         WHERE a.outlet_id = ? AND date(a.checked_in_at) = date('now')
         ORDER BY a.checked_in_at DESC`
      )
      .all(req.user.outletId)
  );
});

// GET /api/attendance/peak-hours — check-in count by hour-of-day over the
// last 30 days, for the Dashboard's peak-hours bar chart.
attendanceRouter.get("/peak-hours", (req, res) => {
  const rows = db
    .prepare(
      `SELECT CAST(strftime('%H', checked_in_at) AS INTEGER) AS hour, COUNT(*) AS count
       FROM attendance
       WHERE outlet_id = ? AND checked_in_at >= datetime('now', '-30 days')
       GROUP BY hour`
    )
    .all(req.user.outletId);

  const byHour = Object.fromEntries(rows.map((r) => [r.hour, r.count]));
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, count: byHour[hour] ?? 0 }));
  res.json(hours);
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
