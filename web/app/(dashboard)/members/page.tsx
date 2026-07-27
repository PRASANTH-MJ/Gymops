"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MemberActionBar } from "@/components/members/MemberActionBar";
import { MemberFilters, type MemberFilterState } from "@/components/members/MemberFilters";
import { MemberTable } from "@/components/members/MemberTable";
import { MemberCard } from "@/components/members/MemberCard";
import { AddMemberModal } from "@/components/members/AddMemberModal";
import { MemberKPIBar } from "@/components/members/MemberKPIBar";
import { BulkActionBar } from "@/components/members/BulkActionBar";
import { CollectDueModal } from "@/components/members/CollectDueModal";
import { RemindModal } from "@/components/members/RemindModal";
import { WhatsAppReminderModal } from "@/components/members/WhatsAppReminderModal";
import { MemberDrawer } from "@/components/members/MemberDrawer";
import { CommandPalette } from "@/components/members/CommandPalette";
import { api } from "@/lib/api";
import { downloadCsv } from "@/lib/utils";
import type { MemberStatus, MemberWithStatus, Outlet, Plan, ReminderTemplate } from "@/types/database";

const EMPTY_FILTERS: MemberFilterState = {
  status: "",
  gender: "",
  batch: "",
  plan: "",
};

const BATCHES = ["Morning", "Noon", "Evening", "Night"];

type Preset = "expiring_week" | "unpaid_dues" | "due_today" | null;

const PRESETS: Array<{ key: Exclude<Preset, null>; label: string }> = [
  { key: "expiring_week", label: "Expiring This Week" },
  { key: "unpaid_dues", label: "Unpaid Dues" },
  { key: "due_today", label: "Due Today" },
];

export default function MembersPage() {
  const [view, setView] = useState<"table" | "grid">("table");
  const [searchField, setSearchField] = useState<"name" | "id" | "phone">("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<MemberFilterState>(EMPTY_FILTERS);
  const [preset, setPreset] = useState<Preset>(null);
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [allMembers, setAllMembers] = useState<MemberWithStatus[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collectDueMember, setCollectDueMember] = useState<MemberWithStatus | null>(null);
  const [remindMembers, setRemindMembers] = useState<MemberWithStatus[] | null>(null);
  const [whatsappMember, setWhatsappMember] = useState<MemberWithStatus | null>(null);
  const [drawerMemberId, setDrawerMemberId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
        params.field = searchField;
      }
      if (filters.status) params.status = filters.status.toLowerCase();
      if (filters.gender) params.gender = filters.gender.toLowerCase();
      if (filters.batch) params.batch = filters.batch.toLowerCase();
      if (filters.plan) {
        const match = plans.find((p) => p.plan_name === filters.plan);
        if (match) params.plan_id = match.id;
      }

      const data = (await api.getMembers(params)) as MemberWithStatus[];
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchField, searchQuery, filters, plans]);

  const loadAll = useCallback(() => {
    api.getMembers().then((data) => setAllMembers(data as MemberWithStatus[]));
  }, []);

  const refreshEverything = useCallback(() => {
    loadMembers();
    loadAll();
  }, [loadMembers, loadAll]);

  useEffect(() => {
    api.getPlans().then((data) => setPlans(data as Plan[]));
    api.getReminderTemplates().then((data) => setTemplates(data as ReminderTemplate[]));
    api.getOutlet().then((data) => setOutlet((data as { outlet: Outlet }).outlet));
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadMembers, 250);
    return () => clearTimeout(timeout);
  }, [loadMembers]);

  const displayedMembers = useMemo(() => {
    if (!preset) return members;
    return members.filter((m) => {
      if (preset === "expiring_week") return m.days_left >= 0 && m.days_left <= 7;
      if (preset === "unpaid_dues") return m.due_amount > 0;
      if (preset === "due_today") return m.days_left === 0;
      return true;
    });
  }, [members, preset]);

  const gymName = outlet?.name ?? "Your Gym";

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const allSelected = displayedMembers.length > 0 && displayedMembers.every((m) => prev.has(m.id));
      if (allSelected) return new Set();
      return new Set(displayedMembers.map((m) => m.id));
    });
  }

  const selectedMembers = allMembers.filter((m) => selectedIds.has(m.id));

  async function handleBulkStatus(status: MemberStatus) {
    await Promise.all(Array.from(selectedIds).map((id) => api.updateMember(id, { status })));
    setSelectedIds(new Set());
    refreshEverything();
  }

  function handleExportCsv() {
    downloadCsv(
      "members.csv",
      selectedMembers.map((m) => ({
        name: m.full_name,
        member_code: m.member_code,
        phone: m.phone,
        days_left: m.days_left,
        due_amount: m.due_amount,
        status: m.status,
      }))
    );
  }

  const dueMembers = allMembers.filter((m) => m.due_amount > 0);

  return (
    <div className="space-y-5">
      <MemberKPIBar members={allMembers} onRemindAll={() => setRemindMembers(dueMembers)} />

      <MemberActionBar
        searchField={searchField}
        onSearchFieldChange={setSearchField}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        view={view}
        onViewChange={setView}
        onAddMember={() => setShowAddModal(true)}
      />

      <div className="flex flex-wrap items-center gap-3">
        <MemberFilters
          filters={filters}
          onChange={setFilters}
          batches={BATCHES}
          plans={plans.map((p) => p.plan_name)}
        />
        <div className="h-5 w-px bg-border" />
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset((current) => (current === p.key ? null : p.key))}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                preset === p.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <kbd className="ml-auto hidden items-center gap-1 rounded border border-border px-2 py-1 text-[11px] text-muted-foreground sm:flex">
          <span>&#8984;</span>K to search
        </kbd>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading members...</p>
      ) : view === "table" ? (
        <MemberTable
          members={displayedMembers}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onViewProfile={setDrawerMemberId}
          onCollectDue={setCollectDueMember}
          onWhatsApp={setWhatsappMember}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              selected={selectedIds.has(member.id)}
              onToggleSelect={toggleSelect}
              onViewProfile={setDrawerMemberId}
              onCollectDue={setCollectDueMember}
              onWhatsApp={setWhatsappMember}
            />
          ))}
        </div>
      )}

      <BulkActionBar
        count={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onWhatsApp={() => setRemindMembers(selectedMembers)}
        onExportCsv={handleExportCsv}
        onBulkStatus={handleBulkStatus}
      />

      {showAddModal && (
        <AddMemberModal
          plans={plans}
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            refreshEverything();
          }}
        />
      )}

      {collectDueMember && (
        <CollectDueModal
          member={collectDueMember}
          onClose={() => setCollectDueMember(null)}
          onCollected={() => {
            setCollectDueMember(null);
            refreshEverything();
          }}
        />
      )}

      {remindMembers && (
        <RemindModal
          members={remindMembers}
          templates={templates}
          gymName={gymName}
          onClose={() => setRemindMembers(null)}
        />
      )}

      {whatsappMember && (
        <WhatsAppReminderModal
          member={whatsappMember}
          templates={templates}
          gymName={gymName}
          onClose={() => setWhatsappMember(null)}
        />
      )}

      {drawerMemberId && (
        <MemberDrawer
          memberId={drawerMemberId}
          plans={plans}
          onClose={() => setDrawerMemberId(null)}
          onChanged={refreshEverything}
        />
      )}

      <CommandPalette members={allMembers} onSelect={setDrawerMemberId} />
    </div>
  );
}
