"use client";

import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { SaasTier } from "@/types/database";

interface SubscriptionRenewalModalProps {
  currentTier: SaasTier | null;
  onClose: () => void;
  onPurchased: () => void;
}

const TIER_LABELS: Record<SaasTier, string> = {
  "1_month": "1 Month",
  "3_months": "3 Months",
  "6_months": "6 Months",
  "1_year": "1 Year",
};

export function SubscriptionRenewalModal({ currentTier, onClose, onPurchased }: SubscriptionRenewalModalProps) {
  const [tiers, setTiers] = useState<Record<SaasTier, { label: string; days: number; price: number }> | null>(null);
  const [selected, setSelected] = useState<SaasTier | null>(currentTier);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getSubscriptionTiers().then((data) => {
      const tierData = data as Record<SaasTier, { label: string; days: number; price: number }>;
      setTiers(tierData);
      if (!selected) setSelected((Object.keys(tierData)[0] as SaasTier) ?? null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePurchase() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.purchaseSubscription(selected);
      onPurchased();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to renew subscription");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Renew Subscription</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!tiers ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading plans...</p>
        ) : (
          <div className="space-y-2">
            {(Object.entries(tiers) as Array<[SaasTier, { label: string; days: number; price: number }]>).map(
              ([tier, info]) => (
                <button
                  key={tier}
                  onClick={() => setSelected(tier)}
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                    selected === tier ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        selected === tier ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      }`}
                    >
                      {selected === tier && <Check className="h-3 w-3" />}
                    </span>
                    <span className="font-medium">{TIER_LABELS[tier] ?? info.label}</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(info.price)}</span>
                </button>
              )
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <button
          onClick={handlePurchase}
          disabled={submitting || !selected}
          className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Processing..." : "Confirm & Renew"}
        </button>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Demo purchase — records the subscription immediately, no real payment gateway wired up yet.
        </p>
      </div>
    </div>
  );
}
