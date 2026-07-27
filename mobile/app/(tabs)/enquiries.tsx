import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EnquiriesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white px-4 pt-4">
      <Text className="text-2xl font-bold text-black">Enquiries</Text>
      <View className="mt-4 rounded-2xl border border-gray-100 bg-muted p-4">
        <Text className="text-sm text-gray-500">
          Lead capture, visitor logs, and follow-up reminders sync here from
          the web Enquiries module.
        </Text>
      </View>
    </SafeAreaView>
  );
}
