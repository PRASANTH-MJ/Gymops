"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Outlet } from "@/types/database";

export default function OutletsPage() {
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getOutlet()
      .then((data) => setOutlet((data as { outlet: Outlet }).outlet))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load outlet"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!outlet) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await api.updateOutlet({
        name: outlet.name,
        location: outlet.location,
        phone: outlet.phone,
        currency: outlet.currency,
        timezone: outlet.timezone,
      });
      setOutlet(updated as Outlet);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save outlet");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>;
  if (!outlet) return null;

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Outlet Settings</h2>
        <p className="text-sm text-muted-foreground">
          Branch details for your current outlet. Multi-outlet switching (multiple
          branches per login) isn&apos;t wired up yet — see the README for next steps.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Outlet Name</label>
          <input
            value={outlet.name}
            onChange={(e) => setOutlet({ ...outlet, name: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Location</label>
          <input
            value={outlet.location ?? ""}
            onChange={(e) => setOutlet({ ...outlet, location: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone</label>
          <input
            value={outlet.phone ?? ""}
            onChange={(e) => setOutlet({ ...outlet, phone: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Currency</label>
            <input
              value={outlet.currency}
              onChange={(e) => setOutlet({ ...outlet, currency: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Timezone</label>
            <input
              value={outlet.timezone}
              onChange={(e) => setOutlet({ ...outlet, timezone: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-success">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
