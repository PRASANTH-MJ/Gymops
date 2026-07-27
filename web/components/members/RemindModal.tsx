"use client";

import { X, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/utils";
import { resolveReminderMessage } from "@/lib/reminders";
import type { MemberWithStatus, ReminderTemplate } from "@/types/database";

interface RemindModalProps {
  members: MemberWithStatus[];
  templates: ReminderTemplate[];
  gymName: string;
  onClose: () => void;
}

export function RemindModal({ members, templates, gymName, onClose }: RemindModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Send Reminders</h3>
            <p className="text-sm text-muted-foreground">
              {members.length} member{members.length === 1 ? "" : "s"} — message pulled from your Reminder Templates.
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {members.map((member) => {
            const message = resolveReminderMessage(member, templates, gymName);
            return (
              <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <div className="font-medium">{member.full_name}</div>
                  <div className="truncate text-xs text-muted-foreground">{message.split("\n")[0]}</div>
                </div>
                <a
                  href={whatsappLink(member.phone, message)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/20"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Send
                </a>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Opens one WhatsApp chat per click — true one-tap bulk broadcast needs the WhatsApp Cloud API
          (see docs/API_SPECS.md, not wired up yet).
        </p>
      </div>
    </div>
  );
}
