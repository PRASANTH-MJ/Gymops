"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Plan } from "@/types/database";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [planName, setPlanName] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .getPlans()
      .then((data) => setPlans(data as Plan[]))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load plans"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.createPlan({ plan_name: planName, duration_days: durationDays, price, description });
      setPlanName("");
      setDurationDays(30);
      setPrice(0);
      setDescription("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create plan");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Plans / Catalogue</h2>
          <p className="text-sm text-muted-foreground">Membership packages your outlet sells.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Plan
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-4"
        >
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Plan Name</label>
            <input
              required
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Duration (days)</label>
            <input
              type="number"
              required
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Price (₹)</label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>
          <div className="sm:col-span-4">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>
          <div className="sm:col-span-4 flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Save Plan
            </button>
          </div>
        </form>
      )}

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading plans...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{plan.plan_name}</h3>
                <span className="text-xs text-muted-foreground">{plan.duration_days}d</span>
              </div>
              <div className="mt-2 text-2xl font-bold">{formatCurrency(plan.price)}</div>
              {plan.description && (
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              )}
            </div>
          ))}
          {plans.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              No plans yet — add one to get started.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
