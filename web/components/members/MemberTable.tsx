"use client";

import { MessageCircle, Eye, Wallet } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DaysLeftBadge } from "@/components/ui/DaysLeftBadge";
import { cn, formatCurrency } from "@/lib/utils";
import type { MemberWithStatus } from "@/types/database";

interface MemberTableProps {
  members: MemberWithStatus[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onViewProfile: (id: string) => void;
  onCollectDue: (member: MemberWithStatus) => void;
  onWhatsApp: (member: MemberWithStatus) => void;
}

export function MemberTable({
  members,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewProfile,
  onCollectDue,
  onWhatsApp,
}: MemberTableProps) {
  const allSelected = members.length > 0 && members.every((m) => selectedIds.has(m.id));

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded border-border"
                aria-label="Select all members"
              />
            </th>
            <th className="px-4 py-3">Member</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Days Left</th>
            <th className="px-4 py-3">Expiry Date</th>
            <th className="px-4 py-3">Due Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {members.map((member) => (
            <tr
              key={member.id}
              className={cn("hover:bg-muted/40 cursor-pointer", selectedIds.has(member.id) && "bg-primary/5")}
              onClick={() => onViewProfile(member.id)}
            >
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(member.id)}
                  onChange={() => onToggleSelect(member.id)}
                  className="h-4 w-4 rounded border-border"
                  aria-label={`Select ${member.full_name}`}
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={member.full_name} />
                  <div>
                    <div className="font-medium">{member.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {member.member_code}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{member.phone}</td>
              <td className="px-4 py-3">
                <DaysLeftBadge daysLeft={member.days_left} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(member.expiry_date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "font-semibold",
                    member.due_amount > 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {formatCurrency(member.due_amount)}
                </span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={member.status} />
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
                  {member.due_amount > 0 && (
                    <button
                      onClick={() => onCollectDue(member)}
                      className="rounded-md p-1.5 text-primary hover:bg-primary/10"
                      aria-label="Collect due"
                      title="Collect Due"
                    >
                      <Wallet className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onWhatsApp(member)}
                    className="rounded-md p-1.5 text-success hover:bg-success/10"
                    aria-label="Message on WhatsApp"
                    title="WhatsApp reminder"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onViewProfile(member.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                    aria-label="View member"
                    title="View Profile"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {members.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-10 text-center text-sm text-muted-foreground"
              >
                No members match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
