# API Reference — Node.js/Express + SQLite backend

Base URL: `http://localhost:4000` in development (`server/.env` → `PORT`).
Auth: every route except `/api/auth/*` requires `Authorization: Bearer <jwt>`.
The JWT payload carries `{ staffId, outletId, role, name }`; every query is
scoped to `outletId` in the route handler (see `server/src/routes/*.js`).

## Auth — `server/src/routes/auth.routes.js`

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/register-outlet` | `{ outletName, location?, ownerName, email, phone?, password }` | Creates an outlet + its first `owner` staff row, returns a token |
| POST | `/api/auth/login` | `{ email, password }` | Returns `{ token, staff }` |

## Outlets — `outlets.routes.js`

| Method | Path | Notes |
|---|---|---|
| GET | `/api/outlets/me` | Returns `{ outlet, subscription }` for the caller's outlet |
| PATCH | `/api/outlets/me` | Update name/location/phone/currency/timezone |

## Members — `members.routes.js`

| Method | Path | Notes |
|---|---|---|
| GET | `/api/members?q=&field=name\|id\|phone&status=&gender=&batch=&plan_id=` | Powers the web/mobile directory search + filters; joins `plans` and computes `days_left` |
| GET | `/api/members/:id` | Includes the member's `transactions` history |
| POST | `/api/members` | Creates member + an `admission` transaction atomically (mirrors the Add Member wizard: plan, admission/discount amounts, payment mode, amount collected → computes `due_amount`) |
| PATCH | `/api/members/:id` | Partial update (status, plan, profile fields) |
| POST | `/api/members/:id/renew` | Extends `expiry_date` from a plan, records a `renewal` transaction |

## Plans — `plans.routes.js`

Standard CRUD: `GET /api/plans`, `POST /api/plans`, `PATCH /api/plans/:id`,
`DELETE /api/plans/:id`.

## Expenses — `expenses.routes.js`

`GET /api/expenses?from=&to=`, `POST /api/expenses`, `DELETE /api/expenses/:id`.

## Enquiries — `enquiries.routes.js`

`GET /api/enquiries?status=`, `POST /api/enquiries`, `PATCH /api/enquiries/:id`,
`POST /api/enquiries/:id/convert` (marks `converted`; create the member
separately via `POST /api/members`).

## Transactions (Finance) — `transactions.routes.js`

| Method | Path | Notes |
|---|---|---|
| GET | `/api/transactions?type=&method=&from=&to=` | Backs the Finance screen's filter tiles (admission/renewal/due_paid/pt/service/product, online/cash) |
| GET | `/api/transactions/summary?from=&to=` | Returns income/discount/expense/profit + per-type counts — the "Profit" gradient card |
| POST | `/api/transactions` | Ad-hoc due collection / PT / service / product sale; `type: 'due_paid'` decrements `members.due_amount` |
| GET | `/api/transactions/:id/invoice` | Structured invoice data (member, plan, amounts, terms) for PDF rendering |

## Attendance — `attendance.routes.js`

`GET /api/attendance/today` (dashboard tile), `POST /api/attendance`
(`{ member_id, source }` — mobile Quick Check-in FAB; rejects if the
member's plan isn't active).

## Reminder templates — `reminderTemplates.routes.js`

`GET /api/reminder-templates` (returns all 4 types with defaults if unset:
`plan_expiring`, `plan_expired`, `pending_due`, `birthday_wish`),
`PUT /api/reminder-templates/:type` (`{ body }` — supports `{member_name}`,
`{gym_name}`, `{end_date}`, `{due_amount}` placeholders, filled in by the
client at send time).

## SaaS subscriptions — `subscriptions.routes.js`

`GET /api/subscriptions/tiers` (1_month ₹399 / 3_months ₹699 / 6_months
₹1099 / 1_year ₹1999 — mirrors the pricing page), `GET
/api/subscriptions/current` (`{ ...sub, days_left }` for the sidebar
tracker), `POST /api/subscriptions/purchase` (`{ tier }`).

## Not yet implemented

- WhatsApp Cloud API send route (`/api/whatsapp/send`) and the daily
  expiry/due-reminder sweep — `reminder_templates` exist, but nothing sends
  them yet.
- PDF rendering of `GET /api/transactions/:id/invoice` — currently JSON only.
- Payment gateway integration (Razorpay/Stripe) for the SaaS `purchase`
  endpoint — it just records the subscription row today, no real charge.
