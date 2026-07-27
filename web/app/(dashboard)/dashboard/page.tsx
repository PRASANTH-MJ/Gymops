"use client";

import { useEffect, useState } from "react";
import { Users, IndianRupee, AlertCircle, CalendarCheck, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { TransactionAmount } from "@/components/ui/TransactionAmount";
import { RevenueTrendChart } from "@/components/dashboard/RevenueTrendChart";
import { MemberStatusBreakdown } from "@/components/dashboard/MemberStatusBreakdown";
import { AttendanceDetailModal } from "@/components/dashboard/AttendanceDetailModal";
import { RemindModal } from "@/components/members/RemindModal";
import type { MemberWithStatus, Outlet, ReminderTemplate, Transaction } from "@/types/database";

export default function DashboardPage() {
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trend, setTrend] = useState<Array<{ date: string; income: number }>>([]);
  const [attendanceToday, setAttendanceToday] = useState(0);
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showRemindDues, setShowRemindDues] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      api.getMembers(),
      api.getTransactions({ from: today, to: today }),
      api.getAttendanceToday(),
      api.getTransactionTrend(7),
      api.getReminderTemplates(),
      api.getOutlet(),
    ])
      .then(([membersData, transactionsData, attendance, trendData, templatesData, outletData]) => {
        setMembers(membersData as MemberWithStatus[]);
        setTransactions(transactionsData as Transaction[]);
        setAttendanceToday((attendance as { count: number }).count);
        setTrend(trendData as Array<{ date: string; income: number }>);
        setTemplates(templatesData as ReminderTemplate[]);
        setOutlet((outletData as { outlet: Outlet }).outlet);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeCount = members.filter((m) => m.status === "active").length;
  const expiringSoonCount = members.filter((m) => m.days_left > 0 && m.days_left <= 7).length;
  const expiredCount = members.filter((m) => m.days_left <= 0 || m.status === "expired").length;
  const pausedCount = members.filter((m) => m.status === "paused").length;
  const dailyRevenue = transactions.reduce((sum, t) => sum + t.amount_collected, 0);
  const outstandingDues = members.reduce((sum, m) => sum + m.due_amount, 0);
  const dueMembers = members.filter((m) => m.due_amount > 0);

  const KPI_CARDS = [
    { label: "Active Members", value: activeCount, icon: Users },
    { label: "Daily Revenue", value: formatCurrency(dailyRevenue), icon: IndianRupee },
    {
      label: "Outstanding Dues",
      value: formatCurrency(outstandingDues),
      icon: AlertCircle,
      action:
        dueMembers.length > 0
          ? { label: "Send Reminders", onClick: () => setShowRemindDues(true) }
          : undefined,
    },
    {
      label: "Today's Attendance",
      value: attendanceToday,
      icon: CalendarCheck,
      onClick: () => setShowAttendance(true),
    },
  ];

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map(({ label, value, icon: Icon, onClick, action }) => (
          <div
            key={label}
            onClick={onClick}
            className={`rounded-xl border border-border bg-card p-4 ${onClick ? "cursor-pointer hover:bg-muted/40" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
            {action && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <MessageCircle className="h-3 w-3" />
                {action.label}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Revenue — Last 7 Days</h3>
          <RevenueTrendChart data={trend} />
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Member Status</h3>
          <MemberStatusBreakdown
            active={activeCount}
            expiringSoon={expiringSoonCount}
            expired={expiredCount}
            paused={pausedCount}
          />
        </div>
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
              <TransactionAmount amount={t.amount_collected} />
            </div>
          ))}
        </div>
      </div>

      {showAttendance && <AttendanceDetailModal onClose={() => setShowAttendance(false)} />}

      {showRemindDues && (
        <RemindModal
          members={dueMembers}
          templates={templates}
          gymName={outlet?.name ?? "Your Gym"}
          onClose={() => setShowRemindDues(false)}
        />
      )}
    </div>
  );
}
