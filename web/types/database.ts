// Mirrors server/src/db/schema.sql (SQLite). Shared shape between the
// Node/Express API responses and the web UI.

export type StaffRole = "owner" | "manager" | "trainer" | "front_desk";
export type MemberStatus = "active" | "expired" | "paused";
export type MemberGender = "male" | "female" | "other";
export type MemberBatch = "morning" | "noon" | "evening" | "night";
export type EnquiryStatus = "new" | "follow_up" | "converted" | "lost";
export type PaymentMethod = "online" | "cash";
export type TransactionType = "admission" | "renewal" | "due_paid" | "pt" | "service" | "product";
export type ReminderTemplateType = "plan_expiring" | "plan_expired" | "pending_due" | "birthday_wish";
export type SaasTier = "1_month" | "3_months" | "6_months" | "1_year";

export interface Outlet {
  id: string;
  name: string;
  location: string | null;
  phone: string | null;
  timezone: string;
  currency: string;
  created_at: string;
}

export interface Plan {
  id: string;
  outlet_id: string;
  plan_name: string;
  duration_days: number;
  price: number;
  description: string | null;
  is_active: number;
  created_at: string;
}

export interface Member {
  id: string;
  outlet_id: string;
  member_code: string;
  full_name: string;
  phone: string;
  email: string | null;
  gender: MemberGender | null;
  batch: MemberBatch | null;
  avatar_url: string | null;
  plan_id: string | null;
  start_date: string;
  expiry_date: string;
  due_amount: number;
  status: MemberStatus;
  height_cm: number | null;
  weight_kg: number | null;
  address: string | null;
  date_of_birth: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberWithStatus extends Member {
  days_left: number;
  plan_name: string | null;
  plan_price: number | null;
}

export interface Transaction {
  id: string;
  outlet_id: string;
  member_id: string | null;
  type: TransactionType;
  method: PaymentMethod;
  plan_amount: number;
  admission_amount: number;
  discount_amount: number;
  amount_collected: number;
  amount_due: number;
  invoice_url: string | null;
  paid_at: string;
  notes: string | null;
  member_name?: string;
  member_code?: string;
}

export interface ReminderTemplate {
  id: string | null;
  type: ReminderTemplateType;
  body: string;
  updated_at: string | null;
}

export interface Enquiry {
  id: string;
  outlet_id: string;
  lead_name: string;
  phone: string;
  source: string | null;
  status: EnquiryStatus;
  follow_up_date: string | null;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  outlet_id: string;
  category: string;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface StaffMember {
  id: string;
  outlet_id: string;
  name: string;
  role: StaffRole;
  phone: string | null;
  email: string | null;
  is_active: number;
  created_at: string;
}

export interface Invoice {
  transaction_id: string;
  outlet: { name: string; location: string | null };
  member: { name: string; code: string };
  plan: { name: string; duration_days: number } | null;
  start_date: string;
  end_date: string;
  plan_amount: number;
  admission_amount: number;
  discount_amount: number;
  amount_paid: number;
  pending_due: number;
  paid_at: string;
  terms: string[];
}

export interface SaasSubscription {
  id: string;
  outlet_id: string;
  tier: SaasTier;
  price: number;
  start_date: string;
  expiry_date: string;
  status: "active" | "expired";
  days_left?: number;
}
