import { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronRight, ArrowLeft } from "lucide-react-native";
import { api } from "@/lib/api";

const LABELS: Record<string, { title: string; subtitle: string }> = {
  plan_expiring: { title: "Plan Expiring", subtitle: "Remind about plan expiry" },
  plan_expired: { title: "Plan Expired", subtitle: "Remind about expired plan" },
  pending_due: { title: "Pending Due", subtitle: "Remind about pending dues" },
  birthday_wish: { title: "Birthday Wish", subtitle: "Send birthday wish" },
};

export default function ReminderTemplatesScreen() {
  const [templates, setTemplates] = useState<Array<{ type: string }>>([]);

  useEffect(() => {
    api.getReminderTemplates().then((data) => setTemplates(data as Array<{ type: string }>));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white px-4 pt-4">
      <View className="mb-4 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={22} color="#000" />
        </Pressable>
        <Text className="text-xl font-bold text-black">Reminder Templates</Text>
      </View>

      <FlatList
        data={templates}
        keyExtractor={(item) => item.type}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/reminder-templates/${item.type}`)}
            className="mb-3 flex-row items-center justify-between rounded-2xl border border-gray-100 bg-muted p-4"
          >
            <View>
              <Text className="font-semibold text-black">{LABELS[item.type]?.title}</Text>
              <Text className="text-xs text-gray-500">{LABELS[item.type]?.subtitle}</Text>
            </View>
            <ChevronRight size={18} color="#9A9AA8" />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
