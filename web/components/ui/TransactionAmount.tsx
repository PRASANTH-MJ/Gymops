import { formatCurrency } from "@/lib/utils";

export function TransactionAmount({ amount }: { amount: number }) {
  if (amount <= 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        Pending Payment
      </span>
    );
  }
  return <span className="font-semibold text-success">+{formatCurrency(amount)}</span>;
}
