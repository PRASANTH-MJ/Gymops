"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { MemberWithStatus } from "@/types/database";

interface CollectDueModalProps {
  member: MemberWithStatus;
  onClose: () => void;
  onCollected: () => void;
}

export function CollectDueModal({ member, onClose, onCollected }: CollectDueModalProps) {
  const [amount, setAmount] = useState(member.due_amount);
  const [method, setMethod] = useState<"cash" | "online">("cash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createTransaction({
        member_id: member.id,
        type: "due_paid",
        method,
        amount_collected: amount,
      });
      onCollected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to collect payment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Collect Due</h3>
            <p className="text-sm text-muted-foreground">{member.full_name} · {member.member_code}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-muted p-3 text-sm">
          Outstanding due: <span className="font-semibold text-destructive">{formatCurrency(member.due_amount)}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Amount Collected</label>
            <input
              type="number"
              required
              min={0}
              max={member.due_amount}
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

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || amount <= 0}
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Collecting..." : "Collect Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
