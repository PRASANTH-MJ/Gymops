"use client";

import { useEffect, useState } from "react";
import { X, Phone, Calendar, MapPin, RefreshCcw } from "lucide-react";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DaysLeftBadge } from "@/components/ui/DaysLeftBadge";
import { formatCurrency } from "@/lib/utils";
import type { MemberWithStatus, Plan, Transaction } from "@/types/database";

interface AttendanceRow {
  id: string;
  checked_in_at: string;
  source: string;
}

interface MemberDrawerProps {
  memberId: string;
  plans: Plan[];
  onClose: () => void;
  onChanged: () => void;
}

export function MemberDrawer({ memberId, plans, onClose, onChanged }: MemberDrawerProps) {
  const [member, setMember] = useState<(MemberWithStatus & { transactions: Transaction[] }) | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRenew, setShowRenew] = useState(false);
  const [renewPlanId, setRenewPlanId] = useState("");
  const [renewMethod, setRenewMethod] = useState<"cash" | "online">("cash");
  const [renewCollected, setRenewCollected] = useState(0);
  const [renewing, setRenewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([api.getMember(memberId), api.getAttendance(memberId)])
      .then(([memberData, attendanceData]) => {
        setMember(memberData as MemberWithStatus & { transactions: Transaction[] });
        setAttendance(attendanceData as AttendanceRow[]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [memberId]);

  useEffect(() => {
    if (plans[0]) setRenewPlanId(plans[0].id);
  }, [plans]);

  async function handleRenew(e: React.FormEvent) {
    e.preventDefault();
    setRenewing(true);
    setError(null);
    try {
      await api.renewMember(memberId, {
        plan_id: renewPlanId,
        method: renewMethod,
        amount_collected: renewCollected,
      });
      setShowRenew(false);
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to renew");
    } finally {
      setRenewing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Member Quick View</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading || !member ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Avatar name={member.full_name} size={52} />
              <div>
                <div className="text-lg font-semibold">{member.full_name}</div>
                <div className="text-xs text-muted-foreground">{member.member_code}</div>
              </div>
              <div className="ml-auto">
                <StatusBadge status={member.status} />
              </div>
            </div>

            <div className="space-y-2 rounded-lg bg-muted p-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {member.phone}
              </div>
              {member.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {member.address}
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Joined{" "}
                {new Date(member.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Active Plan</h4>
                <button
                  onClick={() => setShowRenew((v) => !v)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <RefreshCcw className="h-3.5 w-3.5" /> Quick Renew
                </button>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{member.plan_name ?? "No plan"}</span>
                  <span className="text-sm text-muted-foreground">{formatCurrency(member.plan_price ?? 0)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Expires{" "}
                    {new Date(member.expiry_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                  <DaysLeftBadge daysLeft={member.days_left} />
                </div>
                {member.due_amount > 0 && (
                  <div className="mt-2 text-sm font-semibold text-destructive">
                    Due: {formatCurrency(member.due_amount)}
                  </div>
                )}
              </div>

              {showRenew && (
                <form onSubmit={handleRenew} className="mt-3 space-y-2 rounded-lg border border-dashed border-border p-3">
                  <select
                    value={renewPlanId}
                    onChange={(e) => setRenewPlanId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.plan_name} — {formatCurrency(p.price)}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    {(["cash", "online"] as const).map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setRenewMethod(m)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
                          renewMethod === m ? "border-primary bg-primary text-primary-foreground" : "border-border"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    placeholder="Amount collected"
                    value={renewCollected}
                    onChange={(e) => setRenewCollected(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <button
                    type="submit"
                    disabled={renewing}
                    className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    {renewing ? "Renewing..." : "Confirm Renewal"}
                  </button>
                </form>
              )}
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold">Payment History</h4>
              <div className="space-y-2">
                {member.transactions.length === 0 && (
                  <p className="text-sm text-muted-foreground">No transactions yet.</p>
                )}
                {member.transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
                    <div>
                      <div className="font-medium capitalize">{t.type.replace("_", " ")}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(t.paid_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} · {t.method}
                      </div>
                    </div>
                    <div className="font-semibold text-success">+{formatCurrency(t.amount_collected)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold">Attendance Log</h4>
              <div className="space-y-1.5">
                {attendance.length === 0 && (
                  <p className="text-sm text-muted-foreground">No check-ins recorded.</p>
                )}
                {attendance.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {new Date(a.checked_in_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="capitalize">{a.source}</span>
                  </div>
                ))}
              </div>
            </div>

            {member.notes && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Notes</h4>
                <p className="text-sm text-muted-foreground">{member.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
