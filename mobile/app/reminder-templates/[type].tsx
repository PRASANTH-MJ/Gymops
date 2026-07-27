import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { api } from "@/lib/api";

const TITLES: Record<string, string> = {
  plan_expiring: "Plan Expiring",
  plan_expired: "Plan Expired",
  pending_due: "Pending Due",
  birthday_wish: "Birthday Wish",
};

const PLACEHOLDERS: Record<string, string[]> = {
  plan_expiring: ["{member_name}", "{gym_name}", "{end_date}"],
  plan_expired: ["{member_name}", "{gym_name}", "{end_date}"],
  pending_due: ["{member_name}", "{gym_name}", "{due_amount}"],
  birthday_wish: ["{member_name}", "{gym_name}"],
};

const SAMPLE_VALUES: Record<string, string> = {
  "{member_name}": "John Doe",
  "{gym_name}": "Max Fitness",
  "{end_date}": "Dec 31, 2026",
  "{due_amount}": "500",
};

function renderPreview(body: string) {
  return Object.entries(SAMPLE_VALUES).reduce(
    (text, [token, value]) => text.split(token).join(value),
    body
  );
}

export default function ReminderTemplateEditScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getReminderTemplates().then((templates) => {
      const match = (templates as Array<{ type: string; body: string }>).find((t) => t.type === type);
      if (match) setBody(match.body);
    });
  }, [type]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.updateReminderTemplate(type, body);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  const placeholders = PLACEHOLDERS[type] ?? [];

  return (
    <SafeAreaView className="flex-1 bg-white px-4 pt-4">
      <View className="mb-4 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={22} color="#000" />
        </Pressable>
        <Text className="text-xl font-bold text-black">{TITLES[type] ?? type}</Text>
      </View>
      <Text className="mb-3 text-sm text-gray-500">Edit your {TITLES[type]?.toLowerCase()} message template.</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="mb-1 text-xs text-gray-500">Insert:</Text>
        <View className="mb-3 flex-row flex-wrap gap-2">
          {placeholders.map((token) => (
            <Pressable
              key={token}
              onPress={() => setBody((prev) => `${prev}${token}`)}
              className="rounded-full border border-gray-300 px-3 py-1"
            >
              <Text className="text-xs text-gray-700">{token}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={6}
          maxLength={1000}
          className="min-h-[140px] rounded-xl border border-gray-300 p-3 text-sm"
          textAlignVertical="top"
        />
        <Text className="mt-1 text-right text-xs text-gray-400">{body.length}/1000</Text>

        <Text className="mb-1 mt-4 font-semibold text-black">Preview</Text>
        <View className="rounded-xl border border-gray-300 p-3">
          <Text className="text-sm text-gray-700">{renderPreview(body)}</Text>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="mt-6 items-center rounded-xl bg-black py-3.5"
        >
          <Text className="font-semibold text-white">{saving ? "Saving..." : "Save Template"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
