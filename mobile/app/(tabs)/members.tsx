import { useMemo, useState } from "react";
import { View, Text, FlatList, TextInput, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";
import { useLocalTable } from "@/hooks/useLocalTable";
import { useSync } from "@/hooks/useSync";
import type { MemberRow } from "@/sync/syncEngine";

export default function MembersScreen() {
  const [query, setQuery] = useState("");
  const { rows: members, refresh } = useLocalTable<MemberRow>("members");
  const { status, triggerSync } = useSync();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.member_code.toLowerCase().includes(q) ||
        m.phone.includes(q)
    );
  }, [members, query]);

  async function onRefresh() {
    await triggerSync();
    refresh();
  }

  return (
    <SafeAreaView className="flex-1 bg-white px-4 pt-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-black">Members</Text>
        <SyncStatusBadge />
      </View>

      <View className="mt-3 flex-row items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5">
        <Search size={16} color="#9A9AA8" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, ID or phone (works offline)"
          className="flex-1 text-sm"
        />
      </View>

      <FlatList
        className="mt-4"
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={status === "syncing"} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text className="mt-6 text-center text-sm text-gray-400">No members found.</Text>}
        renderItem={({ item }) => (
          <View className="mb-3 rounded-2xl border border-gray-100 bg-muted p-4">
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-black">{item.full_name}</Text>
              <Text className="text-xs text-gray-500">#{item.member_code}</Text>
            </View>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className={item.days_left < 0 ? "text-destructive" : "text-gray-600"}>
                {item.days_left < 0
                  ? `Expired ${Math.abs(item.days_left)}d ago`
                  : `${item.days_left} days left`}
              </Text>
              <Text className={item.due_amount > 0 ? "font-semibold text-destructive" : "text-gray-400"}>
                ₹{item.due_amount}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
