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

export function Sidebar() {
  const pathname = usePathname();
  const [subscription, setSubscription] = useState<SaasSubscription | null>(null);

  useEffect(() => {
    api
      .getCurrentSubscription()
      .then((sub) => setSubscription(sub as SaasSubscription | null))
      .catch(() => setSubscription(null));
  }, []);

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
        <div className="rounded-lg bg-muted p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold capitalize">
              {subscription ? subscription.tier.replace("_", " ") : "No plan"}
            </span>
            <span className="text-muted-foreground">
              {subscription ? `${subscription.days_left} days left` : "—"}
            </span>
          </div>
          <button className="mt-2 w-full rounded-md bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
            Buy Now
          </button>
        </div>
      </div>
    </aside>
  );
}
