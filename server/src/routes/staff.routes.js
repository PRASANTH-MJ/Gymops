import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { newId } from "../utils/ids.js";

export const staffRouter = Router();
staffRouter.use(requireAuth);

const SAFE_COLUMNS = "id, outlet_id, name, role, phone, email, is_active, created_at";

staffRouter.get("/", (req, res) => {
  res.json(
    db
      .prepare(`SELECT ${SAFE_COLUMNS} FROM users_staff WHERE outlet_id = ? ORDER BY created_at ASC`)
      .all(req.user.outletId)
  );
});

staffRouter.post("/", requireRole("owner", "manager"), (req, res) => {
  const { name, role = "trainer", phone, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const existing = db
    .prepare("SELECT id FROM users_staff WHERE outlet_id = ? AND email = ?")
    .get(req.user.outletId, email);
  if (existing) return res.status(409).json({ error: "Email already in use for this outlet" });

  const id = newId();
  db.prepare(
    `INSERT INTO users_staff (id, outlet_id, name, role, phone, email, password_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.outletId, name, role, phone ?? null, email, bcrypt.hashSync(password, 10));

  res.status(201).json(
    db.prepare(`SELECT ${SAFE_COLUMNS} FROM users_staff WHERE id = ?`).get(id)
  );
});

staffRouter.patch("/:id", requireRole("owner", "manager"), (req, res) => {
  const { role, phone, is_active: isActive } = req.body;
  db.prepare(
    `UPDATE users_staff SET
       role = COALESCE(?, role),
       phone = COALESCE(?, phone),
       is_active = COALESCE(?, is_active)
     WHERE id = ? AND outlet_id = ?`
  ).run(role, phone, isActive, req.params.id, req.user.outletId);

  res.json(db.prepare(`SELECT ${SAFE_COLUMNS} FROM users_staff WHERE id = ?`).get(req.params.id));
});

staffRouter.delete("/:id", requireRole("owner", "manager"), (req, res) => {
  if (req.params.id === req.user.staffId) {
    return res.status(400).json({ error: "Cannot remove yourself" });
  }
  db.prepare("DELETE FROM users_staff WHERE id = ? AND outlet_id = ?").run(req.params.id, req.user.outletId);
  res.status(204).end();
});
