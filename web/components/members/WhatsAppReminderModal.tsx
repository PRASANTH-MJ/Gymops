"use client";

import { useState } from "react";
import { X, Clock, CircleDollarSign, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { whatsappLink } from "@/lib/utils";
import { resolveReminderMessageForType, buildInvoiceMessage } from "@/lib/reminders";
import type { MemberWithStatus, ReminderTemplate, Transaction } from "@/types/database";

interface WhatsAppReminderModalProps {
  member: MemberWithStatus;
  templates: ReminderTemplate[];
  gymName: string;
  onClose: () => void;
}

export function WhatsAppReminderModal({ member, templates, gymName, onClose }: WhatsAppReminderModalProps) {
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function sendExpiryReminder() {
    const message = resolveReminderMessageForType("expiry", member, templates, gymName);
    window.open(whatsappLink(member.phone, message), "_blank");
    onClose();
  }

  function sendDueReminder() {
    const message = resolveReminderMessageForType("due", member, templates, gymName);
    window.open(whatsappLink(member.phone, message), "_blank");
    onClose();
  }

  async function sendInvoice() {
    setError(null);
    setSendingInvoice(true);
    try {
      const detail = (await api.getMember(member.id)) as MemberWithStatus & { transactions: Transaction[] };
      const latest = detail.transactions[0];
      if (!latest) {
        setError("No transactions yet for this member — nothing to invoice.");
        return;
      }
      const invoiceUrl = `${window.location.origin}/invoice/${latest.id}`;
      const message = buildInvoiceMessage(member, latest, invoiceUrl, gymName);
      window.open(whatsappLink(member.phone, message), "_blank");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build invoice");
    } finally {
      setSendingInvoice(false);
    }
  }

  const OPTIONS = [
    {
      key: "expiry",
      icon: Clock,
      iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      title: "Send Expiry Reminder",
      subtitle: "Remind about upcoming membership expiry",
      onClick: sendExpiryReminder,
    },
    {
      key: "due",
      icon: CircleDollarSign,
      iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      title: "Send Due Reminder",
      subtitle: "Remind about pending due amount",
      onClick: sendDueReminder,
    },
    {
      key: "invoice",
      icon: FileText,
      iconClass: "bg-primary/10 text-primary",
      title: "Send Invoice",
      subtitle: sendingInvoice ? "Preparing invoice..." : "Send the latest invoice via WhatsApp",
      onClick: sendInvoice,
    },
  ] as const;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">WhatsApp Reminder</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 text-sm text-muted-foreground">Select the type of reminder to send:</p>

        <div className="space-y-2">
          {OPTIONS.map(({ key, icon: Icon, iconClass, title, subtitle, onClick }) => (
            <button
              key={key}
              onClick={onClick}
              disabled={sendingInvoice}
              className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left hover:bg-muted disabled:opacity-60"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-semibold">{title}</div>
                <div className="text-xs text-muted-foreground">{subtitle}</div>
              </div>
            </button>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
