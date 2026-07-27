"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";
import { api } from "@/lib/api";
import type { Invoice } from "@/types/database";

function formatMoney(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function InvoicePage() {
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPublicInvoice(params.id)
      .then((data) => setInvoice(data as Invoice))
      .catch((err) => setError(err instanceof Error ? err.message : "Invoice not found"));
  }, [params.id]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <p className="text-sm text-muted-foreground">Loading invoice...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex justify-end print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm print:border-0 print:shadow-none">
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div>
              <div className="text-lg font-bold">{invoice.outlet.name}</div>
              {invoice.outlet.location && (
                <div className="text-sm text-muted-foreground">{invoice.outlet.location}</div>
              )}
            </div>
            <div className="text-xl font-bold text-primary">INVOICE</div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 rounded-lg bg-muted p-4 text-sm">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Bill To</div>
              <div className="font-semibold">{invoice.member.name}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Member ID</div>
              <div className="font-semibold">#{invoice.member.code}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Date</div>
              <div className="font-semibold">{formatDate(invoice.paid_at)}</div>
            </div>
          </div>

          {invoice.plan && (
            <div className="mt-4 rounded-lg border border-border">
              <div className="flex items-center justify-between bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <span>Plan: {invoice.plan.name}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border px-4 py-2 text-sm">
                <span className="text-muted-foreground">Start Date</span>
                <span className="font-medium">{formatDate(invoice.start_date)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border px-4 py-2 text-sm">
                <span className="text-muted-foreground">End Date</span>
                <span className="font-medium">{formatDate(invoice.end_date)}</span>
              </div>
            </div>
          )}

          <div className="mt-4 rounded-lg border border-border p-4">
            <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Plan Payment Breakdown</div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plan Amount</span>
                <span>₹{formatMoney(invoice.plan_amount)}</span>
              </div>
              {invoice.admission_amount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Admission Amount</span>
                  <span>₹{formatMoney(invoice.admission_amount)}</span>
                </div>
              )}
              {invoice.discount_amount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span>-₹{formatMoney(invoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border pt-1 font-semibold">
                <span>Amount Paid</span>
                <span>₹{formatMoney(invoice.amount_paid)}</span>
              </div>
            </div>
          </div>

          {invoice.pending_due > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-destructive/10 px-4 py-3">
              <span className="text-sm font-semibold text-destructive">Total Pending Due</span>
              <span className="text-lg font-bold text-destructive">₹{formatMoney(invoice.pending_due)}</span>
            </div>
          )}

          <div className="mt-5 rounded-lg bg-amber-50 p-4 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <div className="mb-2 font-semibold">Terms & Conditions</div>
            <ul className="list-disc space-y-1 pl-4">
              {invoice.terms.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4 text-center text-xs text-muted-foreground">Powered by GymFlow</div>
        </div>
      </div>
    </div>
  );
}
