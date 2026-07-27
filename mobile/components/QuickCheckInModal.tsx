import { useState } from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { X, CheckCircle2 } from "lucide-react-native";
import { LocalMemberPicker } from "./LocalMemberPicker";
import { useLocalTable } from "@/hooks/useLocalTable";
import { newLocalId } from "@/sync/localId";
import { enqueueMutation } from "@/sync/syncEngine";
import { useSync } from "@/hooks/useSync";
import type { MemberRow, AttendanceRow } from "@/sync/syncEngine";

export function QuickCheckInModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [member, setMember] = useState<MemberRow | null>(null);
  const [done, setDone] = useState(false);
  const { insertLocal } = useLocalTable<AttendanceRow>("attendance");
  const { triggerSync } = useSync();

  function reset() {
    setMember(null);
    setDone(false);
  }

  function handleCheckIn() {
    if (!member) return;
    const localId = newLocalId();
    insertLocal({
      id: localId,
      member_id: member.id,
      member_name: member.full_name,
      source: "manual",
      checked_in_at: new Date().toISOString(),
      is_pending: 1,
    });
    enqueueMutation("attendance", "POST", "/api/attendance", { member_id: member.id, source: "manual" }, localId);
    setDone(true);
    triggerSync();
  }

  const inactive = member ? member.status !== "active" || member.days_left < 0 : false;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/40 px-4">
        <View className="w-full max-w-sm rounded-2xl bg-white p-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-black">Mark Attendance</Text>
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
              <Text className="text-sm font-medium">{member?.full_name} checked in.</Text>
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
              {member && (
                <View className="rounded-xl bg-muted p-3">
                  <Text className="font-medium text-black">{member.full_name}</Text>
                  <Text className="text-xs text-gray-500">{member.member_code} · {member.phone}</Text>
                  {inactive && (
                    <Text className="mt-1 text-xs text-destructive">
                      Membership isn&apos;t active — this may be rejected on sync.
                    </Text>
                  )}
                </View>
              )}
              <Pressable
                onPress={handleCheckIn}
                disabled={!member}
                className="items-center rounded-xl bg-black py-3 disabled:opacity-50"
                style={{ opacity: member ? 1 : 0.5 }}
              >
                <Text className="font-semibold text-white">Check In</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
