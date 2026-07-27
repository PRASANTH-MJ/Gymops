# GymFlow SaaS

Multi-outlet gym management platform — web admin dashboard + cross-platform
mobile app, replicating the core workflow and UI of a GymOps-style product,
backed by a Node.js/Express + SQLite API.

## Structure

```
gymflow-saas/
├── server/                  # Node.js + Express + SQLite (better-sqlite3) API
│   └── src/
│       ├── db/               # schema.sql, db bootstrap, seed script
│       ├── middleware/       # JWT auth
│       ├── services/         # invoice.js (shared invoice builder)
│       └── routes/           # auth, outlets, members, plans, expenses,
│                              # enquiries, transactions, attendance,
│                              # reminder-templates, subscriptions, staff,
│                              # publicInvoice (unauthenticated)
├── web/                     # Next.js 14 App Router admin dashboard
│   ├── app/(dashboard)/     # sidebar layout: dashboard, members, plans,
│   │                        # expenses, enquiries, staffs, outlets, finance
│   ├── app/login/
│   ├── app/invoice/[id]/    # public invoice viewer (no login required)
│   ├── components/          # layout/, members/, auth/, ui/
│   └── lib/                 # api.ts (fetch client), reminders.ts, utils
├── mobile/                  # Expo Router mobile app
│   ├── app/(tabs)/          # Dashboard, Members, Enquiries, Finance, Profile
│   ├── app/login.tsx
│   └── app/reminder-templates/
└── docs/
    └── API_SPECS.md         # REST endpoint reference
```

## Getting started

**Important: use `127.0.0.1`, not `localhost`.** Chrome (and some other
browsers) can cache an HSTS policy for the hostname `localhost` from
unrelated projects that ran HTTPS locally, which then force-upgrades this
app's plain-HTTP dev server to HTTPS and fails with `ERR_SSL_PROTOCOL_ERROR`.
Using `127.0.0.1` sidesteps that entirely. All `.env` files below are
already set to `127.0.0.1` — just always open the app at
`http://127.0.0.1:3000`, not `http://localhost:3000`.

**API server**
```bash
cd server
cp .env.example .env
npm install
npm run seed     # creates data/gymflow.db, seeds outlet "Dd" (Perur)
npm run dev       # http://127.0.0.1:4000
```
Seed login: `iprasanth282002@gmail.com` / `demo1234`

**Web**
```bash
cd web
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://127.0.0.1:4000
npm install
npm run dev                  # open http://127.0.0.1:3000 → /login → /dashboard
```

**Mobile**
```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://127.0.0.1:4000 npx expo start
```

## Status

- **Backend**: Node/Express + SQLite (`better-sqlite3`), JWT auth
  (`users_staff.password_hash` via bcrypt), tenant scoping enforced per-route
  via `outlet_id` (no ORM, no RLS — SQLite has neither). Tables: `outlets`,
  `users_staff`, `plans`, `members`, `expenses`, `enquiries`, `transactions`
  (admission/renewal/due_paid/pt/service/product ledger), `attendance`,
  `reminder_templates`, `saas_subscriptions`. A shared `services/invoice.js`
  builder backs both the authenticated invoice endpoint and a public,
  unauthenticated one for shareable WhatsApp links.
- **Web**: login page, JWT-guarded dashboard shell (outlet switcher, dark
  mode, currency, language, profile, live SaaS-subscription tracker). Every
  sidebar page is built: Dashboard (live KPIs), Members, Plans, Expenses,
  Enquiries, Staffs, Outlets (single-outlet settings), Finance.
  The Members page includes: a KPI summary bar (active/expiring/expired/dues),
  table + grid views, row/bulk selection with a floating bulk-action bar
  (WhatsApp broadcast, CSV export, bulk status update), a slide-over Quick
  View drawer (profile, active plan, attendance log, payment history, quick
  renew), a Cmd+K command palette, preset filters (Expiring This Week /
  Unpaid Dues / Due Today), a Collect Due modal, and a WhatsApp Reminder
  picklist (Expiry / Due / **Send Invoice**, which builds a real invoice
  page at `/invoice/[transactionId]` and a WhatsApp message matching the
  reference app's format).
- **Mobile**: Expo Router bottom-tab shell wired to the same API — Dashboard
  (today's income/online/cash split, admission/renewal/due-paid/attendance
  tiles, recent transactions), Members (live search), Finance (profit card,
  category tiles, income/expense tabs), and an editable Reminder Templates
  flow reached from Profile. Quick Check-in / Payment Entry FAB is present
  but not yet wired to the `attendance` / `transactions` endpoints.
- Reference screenshots of the target GymOps app (pricing tiers, invoice
  layout, Add Member wizard, dashboard/finance/manager screens, WhatsApp
  reminder picklist, WhatsApp invoice message) directly informed the schema
  and UI in this build.

## Next steps

1. Wire the Add Member modal's date pickers/optional fields (email, height,
   weight, address, DOB) to match the reference app's 3-step wizard.
2. Wire mobile Quick Check-in → `POST /api/attendance` and Payment Entry →
   `POST /api/transactions`.
3. Real PDF export for invoices (currently browser print-to-PDF via
   `window.print()`, no PDF library).
4. WhatsApp Cloud API integration so reminders can send without opening a
   `wa.me` tab per member (see docs/API_SPECS.md).
5. Add outlet-switching against real multi-outlet `users_staff` membership
   (currently a single outlet per login).
