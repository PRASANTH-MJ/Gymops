import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TextInput, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";
import { api } from "@/lib/api";

interface MemberRow {
  id: string;
  full_name: string;
  member_code: string;
  days_left: number;
  due_amount: number;
}

export default function MembersScreen() {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (q: string) => {
    const params: Record<string, string> = q.trim() ? { q: q.trim(), field: "name" } : {};
    const data = await api.getMembers(params);
    setMembers(data as MemberRow[]);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(query), 250);
    return () => clearTimeout(timeout);
  }, [query, load]);

  async function onRefresh() {
    setRefreshing(true);
    await load(query);
    setRefreshing(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-white px-4 pt-4">
      <Text className="text-2xl font-bold text-black">Members</Text>

      <View className="mt-3 flex-row items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5">
        <Search size={16} color="#9A9AA8" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, ID or phone"
          className="flex-1 text-sm"
        />
      </View>

      <FlatList
        className="mt-4"
        data={members}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
