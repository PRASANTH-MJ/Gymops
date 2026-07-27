"use client";

import { Plus, Search, LayoutGrid, Table as TableIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberActionBarProps {
  searchField: "name" | "id" | "phone";
  onSearchFieldChange: (field: "name" | "id" | "phone") => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  view: "table" | "grid";
  onViewChange: (view: "table" | "grid") => void;
  onAddMember: () => void;
}

const SEARCH_FIELDS = [
  { key: "name", label: "Name" },
  { key: "id", label: "Member ID" },
  { key: "phone", label: "Phone" },
] as const;

export function MemberActionBar({
  searchField,
  onSearchFieldChange,
  searchQuery,
  onSearchQueryChange,
  view,
  onViewChange,
  onAddMember,
}: MemberActionBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold">Members</h2>
        <p className="text-sm text-muted-foreground">
          Manage your active member directory
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-border bg-card">
          <div className="flex items-center gap-1.5 border-r border-border px-2.5 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder={`Search by ${SEARCH_FIELDS.find((f) => f.key === searchField)?.label}...`}
              className="w-52 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <select
            value={searchField}
            onChange={(e) =>
              onSearchFieldChange(e.target.value as typeof searchField)
            }
            className="bg-transparent px-2 py-2 text-xs font-medium text-muted-foreground outline-none"
          >
            {SEARCH_FIELDS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => onViewChange("table")}
            className={cn(
              "rounded-md p-1.5",
              view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
            aria-label="Table view"
          >
            <TableIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewChange("grid")}
            className={cn(
              "rounded-md p-1.5",
              view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={onAddMember}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Member
        </button>
      </div>
    </div>
  );
}
