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
│       └── routes/           # auth, outlets, members, plans, expenses,
│                              # enquiries, transactions, attendance,
│                              # reminder-templates, subscriptions
├── web/                     # Next.js 14 App Router admin dashboard
│   ├── app/(dashboard)/     # sidebar layout: dashboard, members, ...
│   ├── app/login/
│   ├── components/          # layout/, members/, auth/, ui/
│   └── lib/                 # api.ts (fetch client), utils
├── mobile/                  # Expo Router mobile app
│   ├── app/(tabs)/          # Dashboard, Members, Enquiries, Finance, Profile
│   ├── app/login.tsx
│   └── app/reminder-templates/
└── docs/
    └── API_SPECS.md         # REST endpoint reference
```

## Getting started

**API server**
```bash
cd server
cp .env.example .env
npm install
npm run seed     # creates data/gymflow.db, seeds outlet "Dd" (Perur)
npm run dev       # http://localhost:4000
```
Seed login: `iprasanth282002@gmail.com` / `demo1234`

**Web**
```bash
cd web
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                  # http://localhost:3000 → /login → /dashboard
```

**Mobile**
```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://localhost:4000 npx expo start
```

## Status

- **Backend**: Node/Express + SQLite (`better-sqlite3`), JWT auth
  (`users_staff.password_hash` via bcrypt), tenant scoping enforced per-route
  via `outlet_id` (no ORM, no RLS — SQLite has neither). Tables: `outlets`,
  `users_staff`, `plans`, `members`, `expenses`, `enquiries`, `transactions`
  (admission/renewal/due_paid/pt/service/product ledger), `attendance`,
  `reminder_templates`, `saas_subscriptions`.
- **Web**: login page, JWT-guarded dashboard shell (outlet switcher, dark
  mode, currency, language, profile, live SaaS-subscription tracker), a live
  KPI dashboard, and the full Member directory (search, filters, table/grid
  views, WhatsApp shortcut, due-amount highlighting) fetching from the API,
  plus a working Add Member modal that posts to `POST /api/members`. Plans,
  Expenses, Outlets, Enquiries, Staffs, Finance pages are routed in the
  sidebar but not yet built out.
- **Mobile**: Expo Router bottom-tab shell wired to the same API — Dashboard
  (today's income/online/cash split, admission/renewal/due-paid/attendance
  tiles, recent transactions), Members (live search), Finance (profit card,
  category tiles, income/expense tabs), and an editable Reminder Templates
  flow (Plan Expiring / Plan Expired / Pending Due / Birthday Wish, with
  placeholder tokens and live preview) reached from Profile. Quick
  Check-in / Payment Entry FAB is present but not yet wired to the
  `attendance` / `transactions` endpoints.
- Reference screenshots of the target GymOps app (pricing tiers, invoice
  PDF layout, Add Member wizard, dashboard/finance/manager screens, WhatsApp
  invoice message) directly informed the schema (`transactions`,
  `reminder_templates`, `saas_subscriptions`) and copy in this build.

## Next steps

1. Wire the Add Member modal's date pickers/optional fields (email, height,
   weight, address, DOB) to match the reference app's 3-step wizard.
2. Wire mobile Quick Check-in → `POST /api/attendance` and Payment Entry →
   `POST /api/transactions`.
3. Build out Plans, Expenses, Outlets, Enquiries, Staffs pages on web using
   the same layout/filter/table patterns as Members; add a Finance page.
4. Generate real invoice PDFs from `GET /api/transactions/:id/invoice` and
   send them over WhatsApp Cloud API (see docs/API_SPECS.md).
5. Add outlet-switching against real multi-outlet `users_staff` membership
   (currently a single outlet per login).
