"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { DaysLeftBadge } from "@/components/ui/DaysLeftBadge";
import type { MemberWithStatus } from "@/types/database";

interface CommandPaletteProps {
  members: MemberWithStatus[];
  onSelect: (memberId: string) => void;
}

export function CommandPalette({ members, onSelect }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members.slice(0, 8);
    return members
      .filter(
        (m) =>
          m.full_name.toLowerCase().includes(q) ||
          m.member_code.toLowerCase().includes(q) ||
          m.phone.includes(q)
      )
      .slice(0, 8);
  }, [members, query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      onSelect(results[activeIndex].id);
      setOpen(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Jump to a member by name, ID, or phone..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">Esc</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No members found.</p>
          )}
          {results.map((member, index) => (
            <button
              key={member.id}
              onClick={() => {
                onSelect(member.id);
                setOpen(false);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
                index === activeIndex ? "bg-muted" : ""
              }`}
            >
              <Avatar name={member.full_name} size={32} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{member.full_name}</div>
                <div className="text-xs text-muted-foreground">{member.member_code} · {member.phone}</div>
              </div>
              <DaysLeftBadge daysLeft={member.days_left} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
