import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index.js";
import { newId } from "../utils/ids.js";

const outletId = newId();
const staffId = newId();
const monthlyPlanId = newId();

const tx = db.transaction(() => {
  db.prepare(
    "INSERT INTO outlets (id, name, location, currency) VALUES (?, ?, ?, ?)"
  ).run(outletId, "Dd", "Perur", "INR");

  db.prepare(
    `INSERT INTO users_staff (id, outlet_id, name, role, phone, email, password_hash)
     VALUES (?, ?, ?, 'owner', ?, ?, ?)`
  ).run(
    staffId,
    outletId,
    "Prasanth",
    "+919360528096",
    "iprasanth282002@gmail.com",
    bcrypt.hashSync("demo1234", 10)
  );

  const plans = [
    { id: monthlyPlanId, name: "Monthly", days: 30, price: 1000 },
    { id: newId(), name: "Quarterly", days: 90, price: 2700 },
    { id: newId(), name: "Annual", days: 365, price: 9600 },
    { id: newId(), name: "Personal Training", days: 30, price: 6000 },
  ];
  for (const plan of plans) {
    db.prepare(
      "INSERT INTO plans (id, outlet_id, plan_name, duration_days, price) VALUES (?, ?, ?, ?, ?)"
    ).run(plan.id, outletId, plan.name, plan.days, plan.price);
  }

  // Member "Suriya" — matches the reference GymOps screenshots: Monthly
  // plan (₹1000), ₹500 admission, ₹100 discount, ₹400 collected online,
  // leaving a ₹1,000 pending due.
  const memberId = newId();
  const startDate = new Date().toISOString().slice(0, 10);
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);

  db.prepare(
    `INSERT INTO members
       (id, outlet_id, member_code, full_name, phone, gender, batch,
        plan_id, start_date, expiry_date, due_amount, created_by)
     VALUES (?, ?, '1', 'Suriya', '+919876500001', 'male', 'morning', ?, ?, ?, 1000, ?)`
  ).run(memberId, outletId, monthlyPlanId, startDate, expiry.toISOString().slice(0, 10), staffId);

  db.prepare(
    `INSERT INTO transactions
       (id, outlet_id, member_id, type, method, plan_amount, admission_amount,
        discount_amount, amount_collected, amount_due, collected_by)
     VALUES (?, ?, ?, 'admission', 'online', 1000, 500, 100, 400, 1000, ?)`
  ).run(newId(), outletId, memberId, staffId);

  // SaaS subscription for the outlet itself — "9 days left" tracker
  const subExpiry = new Date();
  subExpiry.setDate(subExpiry.getDate() + 9);
  db.prepare(
    `INSERT INTO saas_subscriptions (id, outlet_id, tier, price, start_date, expiry_date, status)
     VALUES (?, ?, '1_month', 399, ?, ?, 'active')`
  ).run(newId(), outletId, startDate, subExpiry.toISOString().slice(0, 10));
});

tx();

console.log("Seeded outlet 'Dd' (Perur)");
console.log(`  Login: iprasanth282002@gmail.com / demo1234`);
console.log(`  Outlet ID: ${outletId}`);
