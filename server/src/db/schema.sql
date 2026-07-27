-- ============================================================================
-- GymFlow SaaS — SQLite schema (Node.js/Express backend)
-- Supersedes the earlier Supabase/Postgres draft in supabase/schema.sql.
-- Ids are TEXT (uuid v4, generated in application code — SQLite has no
-- built-in uuid default). Tenant scoping (outlet_id) is enforced in route
-- handlers, not RLS, since SQLite has no row-level security.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- outlets — a gym branch. owner_id references the users_staff row with
-- role = 'owner' that created it.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outlets (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  location    TEXT,
  phone       TEXT,
  timezone    TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  currency    TEXT NOT NULL DEFAULT 'INR',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------------------------
-- users_staff — login + staff profile. auth lives here directly (no
-- separate Supabase auth.users table); password_hash via bcrypt.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users_staff (
  id            TEXT PRIMARY KEY,
  outlet_id     TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'trainer', 'front_desk')) DEFAULT 'trainer',
  phone         TEXT,
  email         TEXT,
  password_hash TEXT NOT NULL,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (outlet_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_staff_outlet_id ON users_staff(outlet_id);

-- ----------------------------------------------------------------------------
-- saas_subscriptions — the gym owner's own subscription to GymFlow SaaS
-- (mirrors the "Dd · 9 days left · Buy Now" tracker + payments.gymops.in
-- pricing tiers seen in the reference screenshots).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saas_subscriptions (
  id          TEXT PRIMARY KEY,
  outlet_id   TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  tier        TEXT NOT NULL CHECK (tier IN ('1_month', '3_months', '6_months', '1_year')),
  price       REAL NOT NULL,
  start_date  TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('active', 'expired')) DEFAULT 'active',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_outlet_id ON saas_subscriptions(outlet_id);

-- ----------------------------------------------------------------------------
-- plans — membership packages (Monthly, Quarterly, Annual, PT, Biometric add-on)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
  id            TEXT PRIMARY KEY,
  outlet_id     TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  plan_name     TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  price         REAL NOT NULL CHECK (price >= 0),
  description   TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_plans_outlet_id ON plans(outlet_id);

-- ----------------------------------------------------------------------------
-- members
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
  id            TEXT PRIMARY KEY,
  outlet_id     TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  member_code   TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT,
  gender        TEXT CHECK (gender IN ('male', 'female', 'other')),
  batch         TEXT CHECK (batch IN ('morning', 'noon', 'evening', 'night')),
  avatar_url    TEXT,
  plan_id       TEXT REFERENCES plans(id) ON DELETE SET NULL,
  start_date    TEXT NOT NULL,
  expiry_date   TEXT NOT NULL,
  due_amount    REAL NOT NULL DEFAULT 0 CHECK (due_amount >= 0),
  status        TEXT NOT NULL CHECK (status IN ('active', 'expired', 'paused')) DEFAULT 'active',
  height_cm     REAL,
  weight_kg     REAL,
  address       TEXT,
  date_of_birth TEXT,
  notes         TEXT,
  created_by    TEXT REFERENCES users_staff(id) ON DELETE SET NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (outlet_id, member_code)
);

CREATE INDEX IF NOT EXISTS idx_members_outlet_id ON members(outlet_id);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(outlet_id, status);
CREATE INDEX IF NOT EXISTS idx_members_expiry_date ON members(outlet_id, expiry_date);

CREATE TRIGGER IF NOT EXISTS trg_members_updated_at
AFTER UPDATE ON members
BEGIN
  UPDATE members SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ----------------------------------------------------------------------------
-- expenses
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id          TEXT PRIMARY KEY,
  outlet_id   TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  amount      REAL NOT NULL CHECK (amount >= 0),
  date        TEXT NOT NULL,
  notes       TEXT,
  recorded_by TEXT REFERENCES users_staff(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_expenses_outlet_id ON expenses(outlet_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(outlet_id, date);

-- ----------------------------------------------------------------------------
-- enquiries
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enquiries (
  id             TEXT PRIMARY KEY,
  outlet_id      TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  lead_name      TEXT NOT NULL,
  phone          TEXT NOT NULL,
  source         TEXT,
  status         TEXT NOT NULL CHECK (status IN ('new', 'follow_up', 'converted', 'lost')) DEFAULT 'new',
  follow_up_date TEXT,
  assigned_to    TEXT REFERENCES users_staff(id) ON DELETE SET NULL,
  notes          TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_enquiries_outlet_id ON enquiries(outlet_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_follow_up ON enquiries(outlet_id, follow_up_date);

-- ----------------------------------------------------------------------------
-- transactions — billing ledger. Covers admission, renewal, due collection,
-- and ad-hoc PT/service/product sales, matching the Finance screen's
-- Admission / Renewal / Due Paid / PT / Service / Product filter tiles.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id                TEXT PRIMARY KEY,
  outlet_id         TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  member_id         TEXT REFERENCES members(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('admission', 'renewal', 'due_paid', 'pt', 'service', 'product')),
  method            TEXT NOT NULL CHECK (method IN ('online', 'cash')) DEFAULT 'cash',
  plan_amount       REAL NOT NULL DEFAULT 0,
  admission_amount  REAL NOT NULL DEFAULT 0,
  discount_amount   REAL NOT NULL DEFAULT 0,
  amount_collected  REAL NOT NULL DEFAULT 0,
  amount_due        REAL NOT NULL DEFAULT 0,
  invoice_url       TEXT,
  collected_by      TEXT REFERENCES users_staff(id) ON DELETE SET NULL,
  paid_at           TEXT NOT NULL DEFAULT (datetime('now')),
  notes             TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_outlet_id ON transactions(outlet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_paid_at ON transactions(outlet_id, paid_at);

-- ----------------------------------------------------------------------------
-- attendance — check-in log (mobile "Quick Check-in" FAB + Attendance QR /
-- Biometric Attendance add-on)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id            TEXT PRIMARY KEY,
  outlet_id     TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  member_id     TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  source        TEXT NOT NULL CHECK (source IN ('manual', 'qr', 'biometric')) DEFAULT 'manual',
  checked_in_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_attendance_outlet_id ON attendance(outlet_id, checked_in_at);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance(member_id);

-- ----------------------------------------------------------------------------
-- reminder_templates — editable WhatsApp/SMS templates (Plan Expiring,
-- Plan Expired, Pending Due, Birthday Wish), one row per outlet per type,
-- with {member_name}/{gym_name}/{end_date}/{due_amount} placeholders
-- filled in by the app at send time.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reminder_templates (
  id         TEXT PRIMARY KEY,
  outlet_id  TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('plan_expiring', 'plan_expired', 'pending_due', 'birthday_wish')),
  body       TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (outlet_id, type)
);
