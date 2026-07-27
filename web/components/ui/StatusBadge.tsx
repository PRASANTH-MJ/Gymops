import { cn } from "@/lib/utils";
import type { MemberStatus } from "@/types/database";

const STYLES: Record<MemberStatus, string> = {
  active: "bg-success/10 text-success",
  expired: "bg-destructive/10 text-destructive",
  paused: "bg-muted text-muted-foreground",
};

const LABELS: Record<MemberStatus, string> = {
  active: "Active",
  expired: "Expired",
  paused: "Paused",
};

export function StatusBadge({ status }: { status: MemberStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STYLES[status]
      )}
    >
      {LABELS[status]}
    </span>
  );
}
