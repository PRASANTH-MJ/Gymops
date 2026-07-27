import { Pressable, Text, View } from "react-native";
import { Cloud, CloudOff, RefreshCw, AlertTriangle } from "lucide-react-native";
import { useSync } from "@/hooks/useSync";

function timeAgo(iso: string | null) {
  if (!iso) return "never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  return `${hours}h ago`;
}

export function SyncStatusBadge() {
  const { status, lastSyncedAt, pendingCount, triggerSync } = useSync();

  const config = {
    idle: { icon: Cloud, color: "#1FA37A", label: `Synced ${timeAgo(lastSyncedAt)}` },
    syncing: { icon: RefreshCw, color: "#6C5CE7", label: "Syncing..." },
    offline: { icon: CloudOff, color: "#9A9AA8", label: "Offline" },
    error: { icon: AlertTriangle, color: "#E5484D", label: "Sync failed" },
  }[status];

  const Icon = config.icon;

  return (
    <Pressable
      onPress={() => triggerSync()}
      className="flex-row items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1"
    >
      <Icon size={12} color={config.color} />
      <Text className="text-[11px] font-medium" style={{ color: config.color }}>
        {config.label}
      </Text>
      {pendingCount > 0 && (
        <View className="rounded-full bg-amber-500 px-1.5">
          <Text className="text-[10px] font-bold text-white">{pendingCount}</Text>
        </View>
      )}
    </Pressable>
  );
}
