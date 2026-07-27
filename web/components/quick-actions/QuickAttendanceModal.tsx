"use client";

import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { QuickMemberPicker } from "./QuickMemberPicker";
import type { MemberWithStatus } from "@/types/database";

export function QuickAttendanceModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [member, setMember] = useState<MemberWithStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);

  async function handleCheckIn() {
    if (!member) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.checkIn(member.id, "manual");
      setCheckedIn(true);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Mark Attendance</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {checkedIn ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <p className="text-sm font-medium">{member?.full_name} checked in.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <QuickMemberPicker selected={member} onSelect={setMember} placeholder="Search member to check in..." />

            {member && (member.status !== "active" || member.days_left < 0) && (
              <p className="text-xs text-destructive">
                This membership isn&apos;t active — check-in will be rejected.
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              onClick={handleCheckIn}
              disabled={submitting || !member}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Checking in..." : "Check In"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
