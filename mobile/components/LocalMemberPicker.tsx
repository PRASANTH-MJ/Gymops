import { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { Search } from "lucide-react-native";
import { useLocalTable } from "@/hooks/useLocalTable";
import type { MemberRow } from "@/sync/syncEngine";

interface LocalMemberPickerProps {
  onSelect: (member: MemberRow) => void;
  placeholder?: string;
}

export function LocalMemberPicker({ onSelect, placeholder }: LocalMemberPickerProps) {
  const { rows } = useLocalTable<MemberRow>("members");
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows.slice(0, 8);
    return rows
      .filter(
        (m) =>
          m.full_name.toLowerCase().includes(q) ||
          m.member_code.toLowerCase().includes(q) ||
          m.phone.includes(q)
      )
      .slice(0, 8);
  }, [rows, query]);

  return (
    <View>
      <View className="flex-row items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5">
        <Search size={16} color="#9A9AA8" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder ?? "Search member (works offline)..."}
          className="flex-1 text-sm"
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        style={{ maxHeight: 200 }}
        className="mt-2"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelect(item)}
            className="mb-1.5 flex-row items-center justify-between rounded-xl border border-gray-100 bg-muted p-3"
          >
            <View>
              <Text className="font-medium text-black">{item.full_name}</Text>
              <Text className="text-xs text-gray-500">
                {item.member_code} · {item.phone}
              </Text>
            </View>
            {item.due_amount > 0 && (
              <Text className="text-xs font-semibold text-destructive">₹{item.due_amount} due</Text>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text className="mt-2 text-center text-xs text-gray-400">No members match — pull to sync if just added.</Text>
        }
      />
    </View>
  );
}
