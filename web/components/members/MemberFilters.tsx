"use client";

export interface MemberFilterState {
  status: string;
  gender: string;
  batch: string;
  plan: string;
}

interface MemberFiltersProps {
  filters: MemberFilterState;
  onChange: (filters: MemberFilterState) => void;
  batches: string[];
  plans: string[];
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium"
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export function MemberFilters({
  filters,
  onChange,
  batches,
  plans,
}: MemberFiltersProps) {
  const set = (key: keyof MemberFilterState) => (value: string) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        label="All Members"
        value={filters.status}
        options={["Active", "Expired", "Paused"]}
        onChange={set("status")}
      />
      <Select
        label="All Genders"
        value={filters.gender}
        options={["Male", "Female", "Other"]}
        onChange={set("gender")}
      />
      <Select
        label="All Batches"
        value={filters.batch}
        options={batches}
        onChange={set("batch")}
      />
      <Select
        label="All Plans"
        value={filters.plan}
        options={plans}
        onChange={set("plan")}
      />
    </div>
  );
}
