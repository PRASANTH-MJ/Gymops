"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { QuickMemberPicker } from "./QuickMemberPicker";
import type { MemberWithStatus } from "@/types/database";

export function QuickPaymentModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [member, setMember] = useState<MemberWithStatus | null>(null);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<"cash" | "online">("cash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createTransaction({
        member_id: member.id,
        type: "due_paid",
        method,
        amount_collected: amount,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Collect Payment</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <QuickMemberPicker selected={member} onSelect={setMember} />

          {member && member.due_amount > 0 && (
            <p className="text-xs text-muted-foreground">
              Outstanding due: <span className="font-semibold text-destructive">₹{member.due_amount}</span>
            </p>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Amount</label>
            <input
              type="number"
              required
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Mode</label>
            <div className="flex gap-2">
              {(["cash", "online"] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
                    method === m ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !member || amount <= 0}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Recording..." : "Record Payment"}
          </button>
        </form>
      </div>
    </div>
  );
}
