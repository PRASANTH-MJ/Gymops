import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";

interface Summary {
  income: number;
  discount: number;
  expense: number;
  profit: number;
  online_income: number;
  cash_income: number;
  admission_count: number;
  renewal_count: number;
  due_paid_count: number;
  pt_count: number;
  service_count: number;
  product_count: number;
}

interface TxnRow {
  id: string;
  member_name?: string;
  type: string;
  method: string;
  amount_collected: number;
  paid_at: string;
}

export default function FinanceScreen() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<TxnRow[]>([]);
  const [tab, setTab] = useState<"income" | "expense">("income");
  const [refreshing, setRefreshing] = useState(false);

  const monthStart = new Date();
  monthStart.setDate(1);
  const from = monthStart.toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    const [summaryData, txnData] = await Promise.all([
      api.getTransactionSummary({ from, to }),
      api.getTransactions({ from, to }),
    ]);
    setSummary(summaryData as Summary);
    setTransactions(txnData as TxnRow[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const tiles = summary
    ? [
        { label: "Admission", value: summary.admission_count },
        { label: "Renewal", value: summary.renewal_count },
        { label: "Due Paid", value: summary.due_paid_count },
        { label: "PT", value: summary.pt_count },
        { label: "Service", value: summary.service_count },
        { label: "Product", value: summary.product_count },
      ]
    : [];

  return (
    <SafeAreaView className="flex-1 bg-white px-4 pt-4">
      <Text className="text-center text-2xl font-bold text-black">Finance</Text>
      <Text className="mt-1 text-center text-xs text-gray-400">
        {from} — {to}
      </Text>

      <View className="mt-4 rounded-2xl bg-primary p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-white/80">Profit</Text>
          <Text className="rounded-full bg-white/20 px-2 py-1 text-xs text-white">
            Discount ₹{summary?.discount ?? 0}
          </Text>
        </View>
        <Text className="mt-1 text-3xl font-bold text-white">₹{summary?.profit ?? 0}</Text>
        <View className="mt-3 flex-row gap-4 border-t border-white/20 pt-3">
          <Text className="text-xs text-white/90">Income ₹{summary?.income ?? 0}</Text>
          <Text className="text-xs text-white/90">Expense ₹{summary?.expense ?? 0}</Text>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
                    <Text className="font-semibold text-black">{t.member_name ?? "Walk-in"}</Text>
                    <Text className="text-xs capitalize text-gray-500">
                      {t.type.replace("_", " ")} · {t.method}
                    </Text>
                  </View>
                  <Text className="font-semibold text-success">+₹{t.amount_collected}</Text>
                </View>
              ))
            ))}
          {tab === "expense" && (
            <Text className="mt-6 text-center text-sm text-gray-400">No record found.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
