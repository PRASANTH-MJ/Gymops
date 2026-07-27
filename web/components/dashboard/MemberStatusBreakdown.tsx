interface MemberStatusBreakdownProps {
  active: number;
  expiringSoon: number;
  expired: number;
  paused: number;
}

export function MemberStatusBreakdown({ active, expiringSoon, expired, paused }: MemberStatusBreakdownProps) {
  const segments = [
    { label: "Active", value: active, colorClass: "bg-success" },
    { label: "Expiring Soon", value: expiringSoon, colorClass: "bg-amber-500" },
    { label: "Expired", value: expired, colorClass: "bg-destructive" },
    { label: "Paused", value: paused, colorClass: "bg-muted-foreground/40" },
  ];
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.label}
              className={`${s.colorClass} h-full`}
              style={{ width: `${(s.value / total) * 100}%`, marginRight: 2 }}
              title={`${s.label}: ${s.value}`}
            />
          ) : null
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.colorClass}`} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-semibold">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
