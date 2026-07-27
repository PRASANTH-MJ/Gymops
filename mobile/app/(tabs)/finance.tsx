import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransactionAmount } from "@/components/TransactionAmount";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";
import { useLocalTable } from "@/hooks/useLocalTable";
import { useSync } from "@/hooks/useSync";
import type { TransactionRow } from "@/sync/syncEngine";

export default function FinanceScreen() {
  const [tab, setTab] = useState<"income" | "expense">("income");
  const { rows: allTransactions, refresh } = useLocalTable<TransactionRow>("transactions");
  const { status, triggerSync } = useSync();

  const monthStart = new Date();
  monthStart.setDate(1);
  const from = monthStart.toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);

  const transactions = useMemo(
    () => allTransactions.filter((t) => t.paid_at.slice(0, 10) >= from && t.paid_at.slice(0, 10) <= to),
    [allTransactions, from, to]
  );

  const summary = useMemo(() => {
    const income = transactions.reduce((s, t) => s + t.amount_collected, 0);
    const discount = transactions.reduce((s, t) => s + t.discount_amount, 0);
    const online = transactions.filter((t) => t.method === "online").reduce((s, t) => s + t.amount_collected, 0);
    const cash = transactions.filter((t) => t.method === "cash").reduce((s, t) => s + t.amount_collected, 0);
    const countByType = (type: string) => transactions.filter((t) => t.type === type).length;
    return {
      income,
      discount,
      profit: income, // no local expense cache yet — profit ≈ income until expenses sync locally
      onlineIncome: online,
      cashIncome: cash,
      admissionCount: countByType("admission"),
      renewalCount: countByType("renewal"),
      duePaidCount: countByType("due_paid"),
      ptCount: countByType("pt"),
      serviceCount: countByType("service"),
      productCount: countByType("product"),
    };
  }, [transactions]);

  async function onRefresh() {
    await triggerSync();
    refresh();
  }

  const tiles = [
    { label: "Admission", value: summary.admissionCount },
    { label: "Renewal", value: summary.renewalCount },
    { label: "Due Paid", value: summary.duePaidCount },
    { label: "PT", value: summary.ptCount },
    { label: "Service", value: summary.serviceCount },
    { label: "Product", value: summary.productCount },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white px-4 pt-4">
      <View className="flex-row items-center justify-between">
        <View style={{ width: 60 }} />
        <Text className="text-center text-2xl font-bold text-black">Finance</Text>
        <SyncStatusBadge />
      </View>
      <Text className="mt-1 text-center text-xs text-gray-400">
        {from} — {to}
      </Text>

      <View className="mt-4 rounded-2xl bg-primary p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-white/80">Income</Text>
          <Text className="rounded-full bg-white/20 px-2 py-1 text-xs text-white">
            Discount ₹{summary.discount}
          </Text>
        </View>
        <Text className="mt-1 text-3xl font-bold text-white">₹{summary.income}</Text>
        <View className="mt-3 flex-row gap-4 border-t border-white/20 pt-3">
          <Text className="text-xs text-white/90">Online ₹{summary.onlineIncome}</Text>
          <Text className="text-xs text-white/90">Cash ₹{summary.cashIncome}</Text>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={status === "syncing"} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="mt-4 flex-row flex-wrap gap-2">
          {tiles.map((tile) => (
            <View key={tile.label} className="w-[31%] items-center rounded-xl border border-gray-100 bg-muted py-3">
              <Text className="text-lg font-bold text-black">{tile.value}</Text>
              <Text className="text-[11px] text-gray-500">{tile.label}</Text>
            </View>
          ))}
        </View>

        <View className="mt-4 flex-row rounded-full bg-muted p-1">
          {(["income", "expense"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className={`flex-1 items-center rounded-full py-2 ${tab === t ? "bg-white" : ""}`}
            >
              <Text className={`text-sm font-medium capitalize ${tab === t ? "text-black" : "text-gray-400"}`}>
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-3">
          {tab === "income" &&
            (transactions.length === 0 ? (
              <Text className="mt-6 text-center text-sm text-gray-400">No record found.</Text>
            ) : (
              transactions.map((t) => (
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
              ))
            ))}
          {tab === "expense" && (
            <Text className="mt-6 text-center text-sm text-gray-400">
              Expenses aren&apos;t cached locally yet — view them on the web dashboard.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
