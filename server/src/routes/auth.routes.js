import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { newId } from "../utils/ids.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

// Whoever req.user resolves to — a real token, or (since login is
// disabled for now) the fallback first-staff-in-the-outlet. Lets the
// mobile Profile screen show something real instead of static placeholder text.
authRouter.get("/me", requireAuth, (req, res) => {
  const staff = db
    .prepare("SELECT id, name, role, email, phone, outlet_id FROM users_staff WHERE id = ?")
    .get(req.user.staffId);
  const outlet = db.prepare("SELECT name FROM outlets WHERE id = ?").get(req.user.outletId);
  res.json({ ...staff, outlet_name: outlet?.name ?? null });
});

function signToken(staff) {
  return jwt.sign(
    {
      staffId: staff.id,
      outletId: staff.outlet_id,
      role: staff.role,
      name: staff.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// Registers the first owner + outlet together (subsequent staff are added
// via POST /api/staff by an authenticated owner/manager).
authRouter.post("/register-outlet", (req, res) => {
  const { outletName, location, ownerName, email, phone, password } = req.body;

  if (!outletName || !ownerName || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const existing = db
    .prepare("SELECT id FROM users_staff WHERE email = ?")
    .get(email);
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const outletId = newId();
  const staffId = newId();
  const passwordHash = bcrypt.hashSync(password, 10);

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO outlets (id, name, location) VALUES (?, ?, ?)`
    ).run(outletId, outletName, location ?? null);

    db.prepare(
      `INSERT INTO users_staff (id, outlet_id, name, role, phone, email, password_hash)
       VALUES (?, ?, ?, 'owner', ?, ?, ?)`
    ).run(staffId, outletId, ownerName, phone ?? null, email, passwordHash);
  });
  tx();

  const staff = db
    .prepare("SELECT * FROM users_staff WHERE id = ?")
    .get(staffId);

  res.status(201).json({ token: signToken(staff), staff, outletId });
});

authRouter.post("/login", (req, res) => {
  const { email, password } = req.body;
  const staff = db
    .prepare("SELECT * FROM users_staff WHERE email = ? AND is_active = 1")
    .get(email);

  if (!staff || !bcrypt.compareSync(password, staff.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  res.json({
    token: signToken(staff),
    staff: { id: staff.id, name: staff.name, role: staff.role, outlet_id: staff.outlet_id },
  });
});
