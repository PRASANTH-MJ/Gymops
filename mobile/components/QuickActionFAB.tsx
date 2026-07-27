import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Plus, ScanLine, Receipt, X } from "lucide-react-native";

export function QuickActionFAB({
  onCheckIn,
  onPaymentEntry,
}: {
  onCheckIn: () => void;
  onPaymentEntry: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View className="absolute bottom-6 right-5 items-end">
      {open && (
        <View className="mb-3 gap-2">
          <Pressable
            onPress={() => {
              setOpen(false);
              onPaymentEntry();
            }}
            className="flex-row items-center gap-2 rounded-full bg-white px-4 py-3 shadow-md"
          >
            <Receipt size={18} color="#6C5CE7" />
            <Text className="font-semibold text-primary">Payment Entry</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setOpen(false);
              onCheckIn();
            }}
            className="flex-row items-center gap-2 rounded-full bg-white px-4 py-3 shadow-md"
          >
            <ScanLine size={18} color="#6C5CE7" />
            <Text className="font-semibold text-primary">Quick Check-in</Text>
          </Pressable>
        </View>
      )}

      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
      >
        {open ? <X size={24} color="#fff" /> : <Plus size={24} color="#fff" />}
      </Pressable>
    </View>
  );
}
