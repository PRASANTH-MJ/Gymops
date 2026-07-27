import { View, Text } from "react-native";

export function TransactionAmount({ amount }: { amount: number }) {
  if (amount <= 0) {
    return (
      <View className="rounded-full bg-muted px-2.5 py-1">
        <Text className="text-xs font-medium text-gray-500">Pending Payment</Text>
      </View>
    );
  }
  return <Text className="font-semibold text-success">+₹{amount}</Text>;
}
