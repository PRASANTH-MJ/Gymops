import { cn, daysLeftLabel, urgencyFromDaysLeft } from "@/lib/utils";

const STYLES = {
  expired: "bg-destructive/10 text-destructive",
  expiring: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  ok: "bg-success/10 text-success",
} as const;

export function DaysLeftBadge({ daysLeft }: { daysLeft: number }) {
  const level = urgencyFromDaysLeft(daysLeft);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        STYLES[level]
      )}
    >
      {level === "expired" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
      )}
      {daysLeftLabel(daysLeft)}
    </span>
  );
}
