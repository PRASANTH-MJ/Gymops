"use client";

import { useState } from "react";
import { Building2, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OutletOption {
  id: string;
  name: string;
  location: string;
}

const MOCK_OUTLETS: OutletOption[] = [
  { id: "1", name: "Perur", location: "Coimbatore" },
  { id: "2", name: "RS Puram", location: "Coimbatore" },
  { id: "3", name: "Gandhipuram", location: "Coimbatore" },
];

export function OutletSwitcher() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(MOCK_OUTLETS[0]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
      >
        <Building2 className="h-4 w-4 text-primary shrink-0" />
        <span className="flex-1 text-left truncate">{selected.name}</span>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full min-w-[200px] rounded-lg border border-border bg-card p-1 shadow-lg">
          {MOCK_OUTLETS.map((outlet) => (
            <button
              key={outlet.id}
              onClick={() => {
                setSelected(outlet);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            >
              <Check
                className={cn(
                  "h-3.5 w-3.5",
                  outlet.id === selected.id ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="text-left">
                <div className="font-medium">{outlet.name}</div>
                <div className="text-xs text-muted-foreground">
                  {outlet.location}
                </div>
              </div>
            </button>
          ))}
          <div className="mt-1 border-t border-border pt-1">
            <button className="w-full rounded-md px-2 py-1.5 text-left text-sm text-primary hover:bg-muted">
              + Add outlet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
