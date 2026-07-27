import jwt from "jsonwebtoken";
import { db } from "../db/index.js";

// Login is disabled for now: requests without a bearer token fall back to
// the first outlet/owner in the database instead of being rejected, so the
// app is usable without signing in. Pass a real token (e.g. from /login) and
// it still takes priority — this is meant to be reverted later, not a
// permanent auth model.
let cachedFallbackUser = null;

function getFallbackUser() {
  if (cachedFallbackUser) return cachedFallbackUser;

  const staff = db
    .prepare(
      `SELECT id, outlet_id, role, name FROM users_staff
       WHERE is_active = 1 ORDER BY created_at ASC LIMIT 1`
    )
    .get();

  if (!staff) return null;

  cachedFallbackUser = {
    staffId: staff.id,
    outletId: staff.outlet_id,
    role: staff.role,
    name: staff.name,
  };
  return cachedFallbackUser;
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    const fallback = getFallbackUser();
    if (!fallback) {
      return res.status(401).json({ error: "No outlet found — run `npm run seed` first" });
    }
    req.user = fallback;
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { staffId, outletId, role, name }
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient role" });
    }
    next();
  };
}
