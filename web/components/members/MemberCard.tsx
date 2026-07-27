import Link from "next/link";
import { MessageCircle, Eye, Calendar } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn, daysLeftLabel, formatCurrency, whatsappLink } from "@/lib/utils";
import type { MemberWithStatus } from "@/types/database";

export function MemberCard({ member }: { member: MemberWithStatus }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={member.full_name} size={44} />
          <div>
            <div className="font-semibold">{member.full_name}</div>
            <div className="text-xs text-muted-foreground">
              {member.member_code}
            </div>
          </div>
        </div>
        <StatusBadge status={member.status} />
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Phone</span>
          <span className="font-medium">{member.phone}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Expiry
          </span>
          <span
            className={cn(
              "font-medium",
              member.days_left < 0 ? "text-destructive" : "text-foreground"
            )}
          >
            {daysLeftLabel(member.days_left)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Due</span>
          <span
            className={cn(
              "font-semibold",
              member.due_amount > 0 ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {formatCurrency(member.due_amount)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-t border-border pt-3">
        <a
          href={whatsappLink(
            member.phone,
            `Hi ${member.full_name}, this is a reminder from your gym.`
          )}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success/10 py-1.5 text-xs font-semibold text-success hover:bg-success/20"
        >
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
        <Link
          href={`/members/${member.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-muted py-1.5 text-xs font-semibold hover:bg-muted/70"
        >
          <Eye className="h-3.5 w-3.5" /> View
        </Link>
      </div>
    </div>
  );
}
