import { useMemo } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { QuickActionFAB } from "@/components/QuickActionFAB";
import { TransactionAmount } from "@/components/TransactionAmount";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";
import { useLocalTable } from "@/hooks/useLocalTable";
import { useSync } from "@/hooks/useSync";
import type { TransactionRow, AttendanceRow } from "@/sync/syncEngine";

function isToday(iso: string) {
  return iso.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

export default function DashboardScreen() {
  const { rows: transactions, refresh: refreshTransactions } = useLocalTable<TransactionRow>("transactions");
  const { rows: attendance, refresh: refreshAttendance } = useLocalTable<AttendanceRow>("attendance");
  const { status, triggerSync } = useSync();

  const todayTransactions = useMemo(() => transactions.filter((t) => isToday(t.paid_at)), [transactions]);

  const summary = useMemo(() => {
    const online = todayTransactions.filter((t) => t.method === "online").reduce((s, t) => s + t.amount_collected, 0);
    const cash = todayTransactions.filter((t) => t.method === "cash").reduce((s, t) => s + t.amount_collected, 0);
    return {
      todayIncome: online + cash,
      onlineIncome: online,
      cashIncome: cash,
      admissionCount: todayTransactions.filter((t) => t.type === "admission").length,
      renewalCount: todayTransactions.filter((t) => t.type === "renewal").length,
      duePaidCount: todayTransactions.filter((t) => t.type === "due_paid").length,
    };
  }, [todayTransactions]);

  const todayAttendance = useMemo(() => attendance.filter((a) => isToday(a.checked_in_at)), [attendance]);

  async function onRefresh() {
    await triggerSync();
    refreshTransactions();
    refreshAttendance();
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={status === "syncing"} onRefresh={onRefresh} />}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-black">Overview</Text>
          <SyncStatusBadge />
        </View>

        <View className="mt-4 rounded-2xl bg-primary p-4">
          <Text className="text-xs text-white/80">Today</Text>
          <Text className="mt-1 text-3xl font-bold text-white">₹{summary.todayIncome}</Text>
          <View className="mt-3 flex-row items-center gap-4 border-t border-white/20 pt-3">
            <Text className="text-xs text-white/90">Online ₹{summary.onlineIncome}</Text>
            <Text className="text-xs text-white/90">Cash ₹{summary.cashIncome}</Text>
          </View>
        </View>

        <View className="mt-3 flex-row flex-wrap gap-3">
          {[
            { label: "Admission", value: summary.admissionCount },
            { label: "Renewal", value: summary.renewalCount },
            { label: "Due Paid", value: summary.duePaidCount },
            { label: "Attendance Today", value: todayAttendance.length },
          ].map((tile) => (
            <View key={tile.label} className="w-[47%] rounded-2xl border border-gray-100 bg-muted p-4">
              <Text className="text-xl font-bold text-black">{tile.value}</Text>
              <Text className="text-xs text-gray-500">{tile.label}</Text>
            </View>
          ))}
        </View>

        <Text className="mb-2 mt-5 text-sm font-semibold text-gray-500">Recent Transactions</Text>
        {todayTransactions.length === 0 && (
          <Text className="text-sm text-gray-400">No transactions today.</Text>
        )}
        {todayTransactions.slice(0, 10).map((t) => (
          <View
            key={t.id}
            className="mb-2 flex-row items-center justify-between rounded-xl border border-gray-100 bg-muted p-3"
          >
            <View>
              <Text className="font-semibold text-black">
                {t.member_name ?? "Walk-in"}
                {t.is_pending ? " (pending sync)" : ""}
              </Text>
              <Text className="text-xs capitalize text-gray-500">
                {t.type.replace("_", " ")} · {t.method}
              </Text>
            </View>
            <TransactionAmount amount={t.amount_collected} />
          </View>
        ))}
      </ScrollView>

      <QuickActionFAB />
    </SafeAreaView>
  );
}
