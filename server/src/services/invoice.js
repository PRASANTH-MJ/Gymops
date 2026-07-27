import { db } from "../db/index.js";

const TERMS = [
  "Membership fees are non-refundable and non-transferable.",
  "All payments must be made in advance before the membership period begins.",
  "Members must follow all gym rules and regulations at all times.",
  "The gym is not responsible for any personal belongings lost or stolen on the premises.",
  "Members must present their membership card or ID for gym access.",
  "Membership can be suspended or terminated for violation of gym policies.",
  "All disputes are subject to local jurisdiction only.",
  "Terms and conditions are subject to change without prior notice.",
];

// Shared by the authenticated (`/api/transactions/:id/invoice`, outlet-scoped)
// and public (`/api/public/invoices/:id`, shareable-link) routes.
export function buildInvoiceData(transactionId, { outletId } = {}) {
  const txn = outletId
    ? db.prepare("SELECT * FROM transactions WHERE id = ? AND outlet_id = ?").get(transactionId, outletId)
    : db.prepare("SELECT * FROM transactions WHERE id = ?").get(transactionId);
  if (!txn) return null;

  const member = db.prepare("SELECT * FROM members WHERE id = ?").get(txn.member_id);
  const outlet = db.prepare("SELECT * FROM outlets WHERE id = ?").get(txn.outlet_id);
  const plan = member?.plan_id ? db.prepare("SELECT * FROM plans WHERE id = ?").get(member.plan_id) : null;

  return {
    transaction_id: txn.id,
    outlet: { name: outlet.name, location: outlet.location },
    member: { name: member?.full_name, code: member?.member_code },
    plan: plan ? { name: plan.plan_name, duration_days: plan.duration_days } : null,
    start_date: member?.start_date,
    end_date: member?.expiry_date,
    plan_amount: txn.plan_amount,
    admission_amount: txn.admission_amount,
    discount_amount: txn.discount_amount,
    amount_paid: txn.amount_collected,
    pending_due: txn.amount_due,
    paid_at: txn.paid_at,
    terms: TERMS,
  };
}
