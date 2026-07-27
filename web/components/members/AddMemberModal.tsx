"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { toTitleCase, validateMemberName } from "@/lib/validation";
import type { Plan } from "@/types/database";

interface AddMemberModalProps {
  plans: Plan[];
  onClose: () => void;
  onCreated: () => void;
}

const BATCHES = ["morning", "noon", "evening", "night"] as const;

export function AddMemberModal({ plans, onClose, onCreated }: AddMemberModalProps) {
  const [memberCode, setMemberCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [batch, setBatch] = useState<(typeof BATCHES)[number]>("morning");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [admissionAmount, setAdmissionAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [method, setMethod] = useState<"online" | "cash">("cash");
  const [amountCollected, setAmountCollected] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = plans.find((p) => p.id === planId);
  const amountPayable = (plan?.price ?? 0) + Number(admissionAmount) - Number(discountAmount);
  const dueAmount = Math.max(amountPayable - Number(amountCollected), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nameCheck = validateMemberName(fullName);
    if (!nameCheck.valid) {
      setError(nameCheck.error ?? "Invalid name");
      return;
    }

    setSubmitting(true);
    try {
      await api.createMember({
        member_code: memberCode,
        full_name: toTitleCase(fullName),
        phone,
        gender,
        batch,
        plan_id: planId || null,
        start_date: startDate,
        admission_amount: admissionAmount,
        discount_amount: discountAmount,
        method,
        amount_collected: amountCollected,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Add New Member</h3>
            <p className="text-sm text-muted-foreground">Add member profile.</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Member ID</label>
              <input
                required
                value={memberCode}
                onChange={(e) => setMemberCode(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Mobile Number</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Gender</label>
            <div className="flex gap-2">
              {(["male", "female", "other"] as const).map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGender(g)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                    gender === g ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Batch</label>
            <div className="flex flex-wrap gap-2">
              {BATCHES.map((b) => (
                <button
                  type="button"
                  key={b}
                  onClick={() => setBatch(b)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                    batch === b ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Joining Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Plan</label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.plan_name} — ₹{p.price}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Admission Amount</label>
              <input
                type="number"
                value={admissionAmount}
                onChange={(e) => setAdmissionAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Discount Amount</label>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Mode</label>
            <div className="flex gap-2">
              {(["online", "cash"] as const).map((m) => (
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

          <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted p-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Payable</div>
              <div className="font-semibold">₹{amountPayable}</div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Collected</label>
              <input
                type="number"
                value={amountCollected}
                onChange={(e) => setAmountCollected(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm outline-none"
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Due</div>
              <div className="font-semibold text-destructive">₹{dueAmount}</div>
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
              disabled={submitting}
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
