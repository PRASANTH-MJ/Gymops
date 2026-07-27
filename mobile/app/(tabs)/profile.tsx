import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronRight, MessageSquare } from "lucide-react-native";

const MENU_ITEMS = [
  { label: "Update Profile", onPress: () => {} },
  { label: "Choose Language", onPress: () => {} },
  { label: "Choose Currency", onPress: () => {} },
  { label: "Invoice Settings", onPress: () => {} },
  {
    label: "Reminder Templates",
    icon: MessageSquare,
    onPress: () => router.push("/reminder-templates"),
  },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white px-4 pt-4">
      <Text className="text-2xl font-bold text-black">Profile</Text>
      <View className="mt-4 rounded-2xl border border-gray-100 bg-muted p-4">
        <Text className="font-semibold text-black">Prasanth</Text>
        <Text className="text-xs text-gray-500">iprasanth282002@gmail.com</Text>
      </View>

      <View className="mt-4">
        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.label}
            onPress={item.onPress}
            className="flex-row items-center justify-between border-b border-gray-100 py-3.5"
          >
            <Text className="text-black">{item.label}</Text>
            <ChevronRight size={18} color="#9A9AA8" />
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
