"use client";

import { Users, Clock, XCircle, IndianRupee } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { MemberWithStatus } from "@/types/database";

interface MemberKPIBarProps {
  members: MemberWithStatus[];
  onRemindAll: () => void;
}

export function MemberKPIBar({ members, onRemindAll }: MemberKPIBarProps) {
  const active = members.filter((m) => m.status === "active").length;
  const expiringSoon = members.filter((m) => m.days_left > 0 && m.days_left <= 7).length;
  const expired = members.filter((m) => m.days_left <= 0 || m.status === "expired").length;
  const totalDue = members.reduce((sum, m) => sum + m.due_amount, 0);
  const dueCount = members.filter((m) => m.due_amount > 0).length;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Active Members</span>
          <Users className="h-4 w-4 text-success" />
        </div>
        <div className="mt-2 text-2xl font-bold">{active}</div>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Expiring Soon (&le;7d)</span>
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{expiringSoon}</div>
      </div>

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Expired Members</span>
          <XCircle className="h-4 w-4 text-destructive" />
        </div>
        <div className="mt-2 text-2xl font-bold text-destructive">{expired}</div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Outstanding Dues</span>
          <IndianRupee className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="text-2xl font-bold">{formatCurrency(totalDue)}</div>
          {dueCount > 0 && (
            <button
              onClick={onRemindAll}
              className="whitespace-nowrap rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Send All Reminders
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
