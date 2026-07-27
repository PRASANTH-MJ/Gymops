"use client";

import { useState } from "react";
import { MessageCircle, Download, PauseCircle, X } from "lucide-react";
import type { MemberStatus } from "@/types/database";

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  onWhatsApp: () => void;
  onExportCsv: () => void;
  onBulkStatus: (status: MemberStatus) => void;
}

export function BulkActionBar({ count, onClear, onWhatsApp, onExportCsv, onBulkStatus }: BulkActionBarProps) {
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);

  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-lg">
        <span className="text-sm font-semibold">{count} selected</span>
        <div className="mx-1 h-5 w-px bg-border" />

        <button
          onClick={onWhatsApp}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-success hover:bg-success/10"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </button>

        <button
          onClick={onExportCsv}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>

        <div className="relative">
          <button
            onClick={() => setStatusPickerOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            <PauseCircle className="h-4 w-4" />
            Set Status
          </button>
          {statusPickerOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-36 rounded-lg border border-border bg-card p-1 shadow-lg">
              {(["active", "paused", "expired"] as MemberStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    onBulkStatus(status);
                    setStatusPickerOpen(false);
                  }}
                  className="block w-full rounded-md px-2 py-1.5 text-left text-sm capitalize hover:bg-muted"
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mx-1 h-5 w-px bg-border" />
        <button onClick={onClear} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted" aria-label="Clear selection">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
