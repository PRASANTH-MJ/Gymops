"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Building2, ChevronsUpDown, Check } from "lucide-react";
import { api } from "@/lib/api";
import type { Outlet } from "@/types/database";

export function OutletSwitcher() {
  const [open, setOpen] = useState(false);
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .getOutlet()
      .then((data) => setOutlet((data as { outlet: Outlet }).outlet))
      .catch(() => setOutlet(null));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
      >
        <Building2 className="h-4 w-4 text-primary shrink-0" />
        <span className="flex-1 text-left truncate">{outlet?.name ?? "Loading..."}</span>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>

      {open && outlet && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full min-w-[220px] rounded-lg border border-border bg-card p-1 shadow-lg">
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
            <Check className="h-3.5 w-3.5 shrink-0" />
            <div className="text-left">
              <div className="font-medium">{outlet.name}</div>
              {outlet.location && (
                <div className="text-xs text-muted-foreground">{outlet.location}</div>
              )}
            </div>
          </div>
          <div className="mt-1 border-t border-border pt-1">
            <p className="px-2 py-1 text-xs text-muted-foreground">
              Multi-outlet switching isn&apos;t set up yet.
            </p>
            <Link
              href="/outlets"
              onClick={() => setOpen(false)}
              className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-primary hover:bg-muted"
            >
              Manage outlet settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
