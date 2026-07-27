"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, UserPlus, Wallet, CheckCircle2, MessageSquarePlus } from "lucide-react";
import { QuickPaymentModal } from "@/components/quick-actions/QuickPaymentModal";
import { QuickAttendanceModal } from "@/components/quick-actions/QuickAttendanceModal";
import { QuickEnquiryModal } from "@/components/quick-actions/QuickEnquiryModal";

type ActiveModal = "payment" | "attendance" | "enquiry" | null;

export function QuickActionFAB() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const ACTIONS = [
    {
      key: "add-member",
      icon: UserPlus,
      label: "Add Member",
      onClick: () => {
        setOpen(false);
        router.push("/members?action=add");
      },
    },
    {
      key: "payment",
      icon: Wallet,
      label: "Collect Payment",
      onClick: () => {
        setOpen(false);
        setActiveModal("payment");
      },
    },
    {
      key: "attendance",
      icon: CheckCircle2,
      label: "Mark Attendance",
      onClick: () => {
        setOpen(false);
        setActiveModal("attendance");
      },
    },
    {
      key: "enquiry",
      icon: MessageSquarePlus,
      label: "New Enquiry",
      onClick: () => {
        setOpen(false);
        setActiveModal("enquiry");
      },
    },
  ] as const;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2">
        {open && (
          <div className="mb-1 flex flex-col items-end gap-2">
            {ACTIONS.map(({ key, icon: Icon, label, onClick }) => (
              <button
                key={key}
                onClick={onClick}
                className="flex items-center gap-2 rounded-full border border-border bg-card py-2 pl-3 pr-4 text-sm font-medium shadow-md hover:bg-muted"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Quick actions"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90"
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>

      {activeModal === "payment" && (
        <QuickPaymentModal onClose={() => setActiveModal(null)} onDone={() => setActiveModal(null)} />
      )}
      {activeModal === "attendance" && (
        <QuickAttendanceModal onClose={() => setActiveModal(null)} onDone={() => setActiveModal(null)} />
      )}
      {activeModal === "enquiry" && (
        <QuickEnquiryModal onClose={() => setActiveModal(null)} onDone={() => setActiveModal(null)} />
      )}
    </>
  );
}
