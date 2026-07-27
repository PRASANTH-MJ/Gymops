import { renderTemplate, formatCurrency } from "@/lib/utils";
import type { MemberWithStatus, ReminderTemplate, ReminderTemplateType, Transaction } from "@/types/database";

export function pickTemplateType(member: MemberWithStatus): ReminderTemplateType | null {
  if (member.due_amount > 0) return "pending_due";
  if (member.days_left <= 0) return "plan_expired";
  if (member.days_left <= 7) return "plan_expiring";
  return null;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function resolveFromTemplate(
  type: ReminderTemplateType,
  member: MemberWithStatus,
  templates: ReminderTemplate[],
  gymName: string
) {
  const template = templates.find((t) => t.type === type);
  const fallback = `Hi ${member.full_name},\nThis is a reminder from your gym.\n\nRegards,\n${gymName}`;
  if (!template) return fallback;

  return renderTemplate(template.body, {
    member_name: member.full_name,
    gym_name: gymName,
    end_date: formatDate(member.expiry_date),
    due_amount: formatCurrency(member.due_amount).replace("₹", ""),
  });
}

/** Auto-picks the most urgent template for a member (used by "Send All Reminders"). */
export function resolveReminderMessage(
  member: MemberWithStatus,
  templates: ReminderTemplate[],
  gymName: string
) {
  const type = pickTemplateType(member);
  if (!type) return `Hi ${member.full_name},\nThis is a reminder from your gym.\n\nRegards,\n${gymName}`;
  return resolveFromTemplate(type, member, templates, gymName);
}

/** Resolves a specific reminder type the user picked explicitly (WhatsApp picklist). */
export function resolveReminderMessageForType(
  kind: "expiry" | "due",
  member: MemberWithStatus,
  templates: ReminderTemplate[],
  gymName: string
) {
  const type: ReminderTemplateType = kind === "due" ? "pending_due" : member.days_left <= 0 ? "plan_expired" : "plan_expiring";
  return resolveFromTemplate(type, member, templates, gymName);
}

function formatDuration(startDate: string, endDate: string) {
  const days = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000);
  const months = Math.round(days / 30);
  if (months >= 1 && Math.abs(days - months * 30) <= 3) {
    return `${months} Month${months > 1 ? "s" : ""}`;
  }
  return `${days} Day${days === 1 ? "" : "s"}`;
}

/** Builds the "Here's your invoice" WhatsApp message, matching the reference app's format. */
export function buildInvoiceMessage(
  member: MemberWithStatus,
  transaction: Transaction,
  invoiceUrl: string,
  gymName: string
) {
  const lines = [
    `Hi ${member.full_name},`,
    `Here's your invoice,`,
    ``,
    `PDF Invoice Link`,
    ``,
    invoiceUrl,
    ``,
    `Member ID : ${member.member_code}`,
    `Plan Name : ${member.plan_name ?? "—"}`,
    `Duration : ${formatDuration(member.start_date, member.expiry_date)}`,
    `Start Date : ${formatDate(member.start_date)}`,
    `End Date : ${formatDate(member.expiry_date)}`,
    `Amount Paid : ₹${transaction.amount_collected.toFixed(2)}`,
    `Plan Amount : ₹${transaction.plan_amount.toFixed(2)}`,
  ];

  if (transaction.admission_amount > 0) {
    lines.push(`Admission Amount : ₹${transaction.admission_amount.toFixed(2)}`);
  }
  if (transaction.discount_amount > 0) {
    lines.push(`Discount : -₹${transaction.discount_amount.toFixed(2)}`);
  }

  lines.push(`Total Pending Due : ₹${transaction.amount_due.toFixed(2)}`, ``, `Regards,`, gymName);

  return lines.join("\n");
}
