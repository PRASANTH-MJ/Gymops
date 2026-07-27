"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, whatsappLink } from "@/lib/utils";
import type { Transaction, TransactionType } from "@/types/database";

interface Summary {
  income: number;
  discount: number;
  expense: number;
  profit: number;
  online_income: number;
  cash_income: number;
  admission_count: number;
  renewal_count: number;
  due_paid_count: number;
  pt_count: number;
  service_count: number;
  product_count: number;
}

const TYPE_TILES: Array<{ key: TransactionType; label: string }> = [
  { key: "admission", label: "Admission" },
  { key: "renewal", label: "Renewal" },
  { key: "due_paid", label: "Due Paid" },
  { key: "pt", label: "PT" },
  { key: "service", label: "Service" },
  { key: "product", label: "Product" },
];

function monthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  return { from, to };
}

export default function FinancePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState<TransactionType | null>(null);
  const [loading, setLoading] = useState(true);

  const { from, to } = monthRange();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getTransactionSummary({ from, to }),
      api.getTransactions(typeFilter ? { from, to, type: typeFilter } : { from, to }),
    ])
      .then(([summaryData, txnData]) => {
        setSummary(summaryData as Summary);
        setTransactions(txnData as Transaction[]);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const counts: Record<TransactionType, number> = {
    admission: summary?.admission_count ?? 0,
    renewal: summary?.renewal_count ?? 0,
    due_paid: summary?.due_paid_count ?? 0,
    pt: summary?.pt_count ?? 0,
    service: summary?.service_count ?? 0,
    product: summary?.product_count ?? 0,
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Finance</h2>
        <p className="text-sm text-muted-foreground">
          {from} — {to}
        </p>
      </div>

      <div className="rounded-xl bg-primary p-5 text-primary-foreground">
        <div className="flex items-center justify-between text-xs opacity-90">
          <span>Profit</span>
          <span className="rounded-full bg-white/20 px-2 py-1">Discount {formatCurrency(summary?.discount ?? 0)}</span>
        </div>
        <div className="mt-1 text-3xl font-bold">{formatCurrency(summary?.profit ?? 0)}</div>
        <div className="mt-3 flex gap-4 border-t border-white/20 pt-3 text-xs opacity-90">
          <span>Income {formatCurrency(summary?.income ?? 0)}</span>
          <span>Expense {formatCurrency(summary?.expense ?? 0)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {TYPE_TILES.map((tile) => (
          <button
            key={tile.key}
            onClick={() => setTypeFilter((current) => (current === tile.key ? null : tile.key))}
            className={`rounded-xl border p-3 text-center transition-colors ${
              typeFilter === tile.key ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"
            }`}
          >
            <div className="text-xl font-bold">{counts[tile.key]}</div>
            <div className="text-xs text-muted-foreground">{tile.label}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading transactions...</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium">{t.member_name ?? "Walk-in"}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{t.type.replace("_", " ")}</td>
                  <td className="px-4 py-3 uppercase text-muted-foreground">{t.method}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(t.paid_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-success">
                    +{formatCurrency(t.amount_collected)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={whatsappLink(
                        "",
                        `Invoice for ${t.member_name ?? "member"}: paid ${formatCurrency(t.amount_collected)}, due ${formatCurrency(t.amount_due)}.`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Share Invoice
                    </a>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No transactions found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
