import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { QuickActionFAB } from "@/components/QuickActionFAB";
import { TransactionAmount } from "@/components/TransactionAmount";
import { api } from "@/lib/api";

interface DashboardData {
  todayIncome: number;
  onlineIncome: number;
  cashIncome: number;
  admissionCount: number;
  renewalCount: number;
  duePaidCount: number;
  attendanceToday: number;
  recentTransactions: Array<{
    id: string;
    member_name?: string;
    type: string;
    method: string;
    amount_collected: number;
  }>;
}

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const [summary, attendance, transactions] = await Promise.all([
      api.getTransactionSummary({ from: today, to: today }),
      api.getAttendanceToday(),
      api.getTransactions({ from: today, to: today }),
    ]);

    setData({
      todayIncome: (summary as any).income,
      onlineIncome: (summary as any).online_income,
      cashIncome: (summary as any).cash_income,
      admissionCount: (summary as any).admission_count,
      renewalCount: (summary as any).renewal_count,
      duePaidCount: (summary as any).due_paid_count,
      attendanceToday: (attendance as any).count,
      recentTransactions: (transactions as any[]).slice(0, 10),
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text className="text-2xl font-bold text-black">Overview</Text>

        <View className="mt-4 rounded-2xl bg-primary p-4">
          <Text className="text-xs text-white/80">Today</Text>
          <Text className="mt-1 text-3xl font-bold text-white">
            ₹{data?.todayIncome ?? 0}
          </Text>
          <View className="mt-3 flex-row items-center gap-4 border-t border-white/20 pt-3">
            <Text className="text-xs text-white/90">Online ₹{data?.onlineIncome ?? 0}</Text>
            <Text className="text-xs text-white/90">Cash ₹{data?.cashIncome ?? 0}</Text>
          </View>
        </View>

        <View className="mt-3 flex-row flex-wrap gap-3">
          {[
            { label: "Admission", value: data?.admissionCount ?? 0 },
            { label: "Renewal", value: data?.renewalCount ?? 0 },
            { label: "Due Paid", value: data?.duePaidCount ?? 0 },
            { label: "Attendance Today", value: data?.attendanceToday ?? 0 },
          ].map((tile) => (
            <View key={tile.label} className="w-[47%] rounded-2xl border border-gray-100 bg-muted p-4">
              <Text className="text-xl font-bold text-black">{tile.value}</Text>
              <Text className="text-xs text-gray-500">{tile.label}</Text>
            </View>
          ))}
        </View>

        <Text className="mb-2 mt-5 text-sm font-semibold text-gray-500">Recent Transactions</Text>
        {(data?.recentTransactions ?? []).length === 0 && (
          <Text className="text-sm text-gray-400">No transactions today.</Text>
        )}
        {(data?.recentTransactions ?? []).map((t) => (
          <View
            key={t.id}
            className="mb-2 flex-row items-center justify-between rounded-xl border border-gray-100 bg-muted p-3"
          >
            <View>
              <Text className="font-semibold text-black">{t.member_name ?? "Walk-in"}</Text>
              <Text className="text-xs capitalize text-gray-500">
                {t.type.replace("_", " ")} · {t.method}
              </Text>
            </View>
            <TransactionAmount amount={t.amount_collected} />
          </View>
        ))}
      </ScrollView>

      <QuickActionFAB
        onCheckIn={() => {
          // navigate to check-in scan flow
        }}
        onPaymentEntry={() => {
          // navigate to payment entry form
        }}
      />
    </SafeAreaView>
  );
}
