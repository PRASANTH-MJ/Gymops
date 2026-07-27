"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import type { MemberWithStatus } from "@/types/database";

interface QuickMemberPickerProps {
  selected: MemberWithStatus | null;
  onSelect: (member: MemberWithStatus) => void;
  placeholder?: string;
}

export function QuickMemberPicker({ selected, onSelect, placeholder }: QuickMemberPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberWithStatus[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      api.getMembers({ q: query.trim(), field: "name" }).then((data) => setResults(data as MemberWithStatus[]));
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-2.5">
        <div className="flex items-center gap-2">
          <Avatar name={selected.full_name} size={28} />
          <div>
            <div className="text-sm font-medium">{selected.full_name}</div>
            <div className="text-xs text-muted-foreground">{selected.member_code} · {selected.phone}</div>
          </div>
        </div>
        <button
          onClick={() => onSelect(null as unknown as MemberWithStatus)}
          className="text-xs font-medium text-primary hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? "Search by name..."}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg">
          {results.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => {
                onSelect(member);
                setQuery("");
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              <Avatar name={member.full_name} size={24} />
              <div>
                <div className="font-medium">{member.full_name}</div>
                <div className="text-xs text-muted-foreground">{member.member_code} · {member.phone}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
