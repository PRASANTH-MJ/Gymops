"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Receipt,
  Building,
  UserPlus,
  UserCog,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { SaasSubscription } from "@/types/database";
import { OutletSwitcher } from "./OutletSwitcher";
import { SubscriptionRenewalModal } from "./SubscriptionRenewalModal";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Members", icon: Users },
  { href: "/plans", label: "Plans / Catalogue", icon: ClipboardList },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/outlets", label: "Outlets", icon: Building },
  { href: "/enquiries", label: "Enquiries", icon: UserPlus },
  { href: "/staffs", label: "Staffs", icon: UserCog },
  { href: "/finance", label: "Finance", icon: Wallet },
];

function refreshSubscription(setSubscription: (sub: SaasSubscription | null) => void) {
  api
    .getCurrentSubscription()
    .then((sub) => setSubscription(sub as SaasSubscription | null))
    .catch(() => setSubscription(null));
}

export function Sidebar() {
  const pathname = usePathname();
  const [subscription, setSubscription] = useState<SaasSubscription | null>(null);
  const [showRenewal, setShowRenewal] = useState(false);

  useEffect(() => {
    refreshSubscription(setSubscription);
  }, []);

  const daysLeft = subscription?.days_left ?? null;
  const urgency =
    daysLeft === null ? "none" : daysLeft <= 0 ? "expired" : daysLeft <= 3 ? "urgent" : daysLeft <= 7 ? "warning" : "ok";

  const cardClass = cn(
    "rounded-lg p-3 transition-colors",
    urgency === "expired" && "bg-destructive/10 border border-destructive/30",
    urgency === "urgent" && "bg-destructive/10 border border-destructive/20",
    urgency === "warning" && "bg-amber-500/10 border border-amber-500/20",
    (urgency === "ok" || urgency === "none") && "bg-muted"
  );

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="p-3">
        <OutletSwitcher />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/80 hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className={cardClass}>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-semibold capitalize">
              {(urgency === "urgent" || urgency === "expired") && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
              )}
              {subscription ? subscription.tier.replace("_", " ") : "No plan"}
            </span>
            <span
              className={cn(
                "font-medium",
                urgency === "expired" || urgency === "urgent"
                  ? "text-destructive"
                  : urgency === "warning"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              )}
            >
              {daysLeft === null ? "—" : daysLeft <= 0 ? "Expired" : `${daysLeft} days left`}
            </span>
          </div>
          <button
            onClick={() => setShowRenewal(true)}
            className="mt-2 w-full rounded-md bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            {urgency === "expired" ? "Renew Now" : "Buy Now"}
          </button>
        </div>
      </div>

      {showRenewal && (
        <SubscriptionRenewalModal
          currentTier={subscription?.tier ?? null}
          onClose={() => setShowRenewal(false)}
          onPurchased={() => {
            setShowRenewal(false);
            refreshSubscription(setSubscription);
          }}
        />
      )}
    </aside>
  );
}
