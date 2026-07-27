import { useState } from "react";
import { Modal, View, Text, Pressable, TextInput } from "react-native";
import { X, CheckCircle2 } from "lucide-react-native";
import { LocalMemberPicker } from "./LocalMemberPicker";
import { useLocalTable } from "@/hooks/useLocalTable";
import { newLocalId } from "@/sync/localId";
import { enqueueMutation } from "@/sync/syncEngine";
import { useSync } from "@/hooks/useSync";
import type { MemberRow, TransactionRow } from "@/sync/syncEngine";

export function QuickPaymentEntryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [member, setMember] = useState<MemberRow | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "online">("cash");
  const [done, setDone] = useState(false);
  const { insertLocal } = useLocalTable<TransactionRow>("transactions");
  const { updateLocal } = useLocalTable<MemberRow>("members");
  const { triggerSync } = useSync();

  function reset() {
    setMember(null);
    setAmount("");
    setMethod("cash");
    setDone(false);
  }

  function handleSubmit() {
    const numericAmount = Number(amount);
    if (!member || !numericAmount || numericAmount <= 0) return;

    const localId = newLocalId();
    insertLocal({
      id: localId,
      member_id: member.id,
      member_name: member.full_name,
      type: "due_paid",
      method,
      plan_amount: 0,
      admission_amount: 0,
      discount_amount: 0,
      amount_collected: numericAmount,
      amount_due: 0,
      paid_at: new Date().toISOString(),
      is_pending: 1,
    });
    updateLocal(member.id, { due_amount: Math.max(member.due_amount - numericAmount, 0) });
    enqueueMutation(
      "transaction",
      "POST",
      "/api/transactions",
      { member_id: member.id, type: "due_paid", method, amount_collected: numericAmount },
      localId
    );
    setDone(true);
    triggerSync();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/40 px-4">
        <View className="w-full max-w-sm rounded-2xl bg-white p-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-black">Collect Payment</Text>
            <Pressable
              onPress={() => {
                reset();
                onClose();
              }}
            >
              <X size={20} color="#000" />
            </Pressable>
          </View>

          {done ? (
            <View className="items-center gap-2 py-4">
              <CheckCircle2 size={40} color="#1FA37A" />
              <Text className="text-sm font-medium">₹{amount} collected from {member?.full_name}.</Text>
              <Text className="text-center text-xs text-gray-400">
                Saved locally — will sync automatically when online.
              </Text>
              <Pressable
                onPress={() => {
                  reset();
                  onClose();
                }}
                className="mt-2 w-full items-center rounded-xl bg-black py-3"
              >
                <Text className="font-semibold text-white">Done</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              <LocalMemberPicker onSelect={setMember} />

              {member && member.due_amount > 0 && (
                <Text className="text-xs text-gray-500">
                  Outstanding due: <Text className="font-semibold text-destructive">₹{member.due_amount}</Text>
                </Text>
              )}

              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="Amount"
                keyboardType="numeric"
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              />

              <View className="flex-row gap-2">
                {(["cash", "online"] as const).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setMethod(m)}
                    className="rounded-full border px-3 py-1.5"
                    style={{ borderColor: method === m ? "#000" : "#e5e5e5", backgroundColor: method === m ? "#000" : "transparent" }}
                  >
                    <Text
                      className="text-xs font-semibold uppercase"
                      style={{ color: method === m ? "#fff" : "#000" }}
                    >
                      {m}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={!member || !amount}
                className="items-center rounded-xl bg-black py-3"
                style={{ opacity: member && amount ? 1 : 0.5 }}
              >
                <Text className="font-semibold text-white">Record Payment</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
