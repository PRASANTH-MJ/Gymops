"use client";

import Link from "next/link";
import { MessageCircle, Eye } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn, daysLeftLabel, formatCurrency, whatsappLink } from "@/lib/utils";
import type { MemberWithStatus } from "@/types/database";

export function MemberTable({ members }: { members: MemberWithStatus[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
            <tr key={member.id} className="hover:bg-muted/40">
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
                <span
                  className={cn(
                    "font-medium",
                    member.days_left < 0
                      ? "text-destructive"
                      : member.days_left <= 7
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-foreground"
                  )}
                >
                  {daysLeftLabel(member.days_left)}
                </span>
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
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <a
                    href={whatsappLink(
                      member.phone,
                      `Hi ${member.full_name}, this is a reminder from your gym.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md p-1.5 text-success hover:bg-success/10"
                    aria-label="Message on WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                  <Link
                    href={`/members/${member.id}`}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                    aria-label="View member"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}

          {members.length === 0 && (
            <tr>
              <td
                colSpan={7}
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
