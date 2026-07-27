import { MessageCircle, Eye, Wallet } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DaysLeftBadge } from "@/components/ui/DaysLeftBadge";
import { cn, formatCurrency } from "@/lib/utils";
import type { MemberWithStatus } from "@/types/database";

interface MemberCardProps {
  member: MemberWithStatus;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onViewProfile: (id: string) => void;
  onCollectDue: (member: MemberWithStatus) => void;
  onWhatsApp: (member: MemberWithStatus) => void;
}

export function MemberCard({
  member,
  selected,
  onToggleSelect,
  onViewProfile,
  onCollectDue,
  onWhatsApp,
}: MemberCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-shadow hover:shadow-md cursor-pointer",
        selected ? "border-primary" : "border-border"
      )}
      onClick={() => onViewProfile(member.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selected}
            onClick={(e) => e.stopPropagation()}
            onChange={() => onToggleSelect(member.id)}
            className="h-4 w-4 rounded border-border"
            aria-label={`Select ${member.full_name}`}
          />
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
          <span className="text-muted-foreground">Expiry</span>
          <DaysLeftBadge daysLeft={member.days_left} />
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

      <div className="mt-4 flex gap-2 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
        {member.due_amount > 0 && (
          <button
            onClick={() => onCollectDue(member)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
          >
            <Wallet className="h-3.5 w-3.5" /> Collect
          </button>
        )}
        <button
          onClick={() => onWhatsApp(member)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success/10 py-1.5 text-xs font-semibold text-success hover:bg-success/20"
        >
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </button>
        <button
          onClick={() => onViewProfile(member.id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-muted py-1.5 text-xs font-semibold hover:bg-muted/70"
        >
          <Eye className="h-3.5 w-3.5" /> View
        </button>
      </div>
    </div>
  );
}
