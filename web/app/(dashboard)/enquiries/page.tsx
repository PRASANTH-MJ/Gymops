"use client";

import { useEffect, useState } from "react";
import { Plus, Check } from "lucide-react";
import { api } from "@/lib/api";
import { whatsappLink } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import type { Enquiry, EnquiryStatus } from "@/types/database";

const STATUS_STYLES: Record<EnquiryStatus, string> = {
  new: "bg-primary/10 text-primary",
  follow_up: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  converted: "bg-success/10 text-success",
  lost: "bg-muted text-muted-foreground",
};

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .getEnquiries()
      .then((data) => setEnquiries(data as Enquiry[]))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load enquiries"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.createEnquiry({ lead_name: leadName, phone, source, follow_up_date: followUpDate || null });
      setLeadName("");
      setPhone("");
      setSource("");
      setFollowUpDate("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add enquiry");
    }
  }

  async function markConverted(id: string) {
    await api.convertEnquiry(id);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Enquiries</h2>
          <p className="text-sm text-muted-foreground">Lead capture, visitor logs, and follow-up tracking.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Enquiry
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-4"
        >
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
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Follow-up Date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>
          <div className="sm:col-span-4 flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Save Enquiry
            </button>
          </div>
        </form>
      )}

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading enquiries...</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Follow-up</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id}>
                  <td className="px-4 py-3 font-medium">{enquiry.lead_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{enquiry.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{enquiry.source ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {enquiry.follow_up_date
                      ? new Date(enquiry.follow_up_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[enquiry.status]}`}>
                      {enquiry.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={whatsappLink(enquiry.phone, `Hi ${enquiry.lead_name}, thanks for your interest in our gym!`)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md p-1.5 text-success hover:bg-success/10"
                        aria-label="Message on WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                      {enquiry.status !== "converted" && (
                        <button
                          onClick={() => markConverted(enquiry.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                          aria-label="Mark converted"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {enquiries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No enquiries yet.
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
