"use client";

import { useCallback, useEffect, useState } from "react";
import { MemberActionBar } from "@/components/members/MemberActionBar";
import { MemberFilters, type MemberFilterState } from "@/components/members/MemberFilters";
import { MemberTable } from "@/components/members/MemberTable";
import { MemberCard } from "@/components/members/MemberCard";
import { AddMemberModal } from "@/components/members/AddMemberModal";
import { api } from "@/lib/api";
import type { MemberWithStatus, Plan } from "@/types/database";

const EMPTY_FILTERS: MemberFilterState = {
  status: "",
  gender: "",
  batch: "",
  plan: "",
};

const BATCHES = ["Morning", "Noon", "Evening", "Night"];

export default function MembersPage() {
  const [view, setView] = useState<"table" | "grid">("table");
  const [searchField, setSearchField] = useState<"name" | "id" | "phone">("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<MemberFilterState>(EMPTY_FILTERS);
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

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

      const data = await api.getMembers(params);
      setMembers(data as MemberWithStatus[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchField, searchQuery, filters, plans]);

  useEffect(() => {
    api.getPlans().then((data) => setPlans(data as Plan[]));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadMembers, 250);
    return () => clearTimeout(timeout);
  }, [loadMembers]);

  return (
    <div className="space-y-5">
      <MemberActionBar
        searchField={searchField}
        onSearchFieldChange={setSearchField}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        view={view}
        onViewChange={setView}
        onAddMember={() => setShowAddModal(true)}
      />

      <MemberFilters
        filters={filters}
        onChange={setFilters}
        batches={BATCHES}
        plans={plans.map((p) => p.plan_name)}
      />

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading members...</p>
      ) : view === "table" ? (
        <MemberTable members={members} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddMemberModal
          plans={plans}
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            loadMembers();
          }}
        />
      )}
    </div>
  );
}
