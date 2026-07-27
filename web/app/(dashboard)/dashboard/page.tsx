"use client";

import { useEffect, useState } from "react";
import { Users, IndianRupee, AlertCircle, CalendarCheck } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { MemberWithStatus, Transaction } from "@/types/database";

export default function DashboardPage() {
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [attendanceToday, setAttendanceToday] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      api.getMembers(),
      api.getTransactions({ from: today, to: today }),
      api.getAttendanceToday(),
    ])
      .then(([membersData, transactionsData, attendance]) => {
        setMembers(membersData as MemberWithStatus[]);
        setTransactions(transactionsData as Transaction[]);
        setAttendanceToday((attendance as { count: number }).count);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeCount = members.filter((m) => m.status === "active").length;
  const dailyRevenue = transactions.reduce((sum, t) => sum + t.amount_collected, 0);
  const outstandingDues = members.reduce((sum, m) => sum + m.due_amount, 0);

  const KPI_CARDS = [
    { label: "Active Members", value: activeCount, icon: Users },
    { label: "Daily Revenue", value: formatCurrency(dailyRevenue), icon: IndianRupee },
    { label: "Outstanding Dues", value: formatCurrency(outstandingDues), icon: AlertCircle },
    { label: "Today's Attendance", value: attendanceToday, icon: CalendarCheck },
  ];

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Recent Transactions</h3>
        <div className="rounded-xl border border-border bg-card">
          {transactions.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No transactions today.</p>
          )}
          {transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between border-b border-border p-3 last:border-0"
            >
              <div>
                <div className="font-medium">{t.member_name ?? "Walk-in"}</div>
                <div className="text-xs capitalize text-muted-foreground">
                  {t.type.replace("_", " ")} · {t.method}
                </div>
              </div>
              <div className="font-semibold text-success">
                +{formatCurrency(t.amount_collected)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
