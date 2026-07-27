"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";

export function QuickEnquiryModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [leadName, setLeadName] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createEnquiry({ lead_name: leadName, phone, source: source || null });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add enquiry");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">New Enquiry</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Lead Name</label>
            <input
              required
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Source</label>
            <input
              placeholder="Walk-in, referral, social..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save Enquiry"}
          </button>
        </form>
      </div>
    </div>
  );
}
