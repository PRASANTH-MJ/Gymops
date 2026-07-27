import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { getMeta } from "@/db/client";
import { getPendingCount, retryFailedQueue, runSync } from "@/sync/syncEngine";

export type SyncStatus = "idle" | "syncing" | "offline" | "error";

const MIN_INTERVAL_MS = 15_000;

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => getMeta("last_synced_at"));
  const [pendingCount, setPendingCount] = useState(() => getPendingCount());
  const lastAttemptRef = useRef(0);

  const triggerSync = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastAttemptRef.current < MIN_INTERVAL_MS) return;
    lastAttemptRef.current = now;

    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      setStatus("offline");
      setPendingCount(getPendingCount());
      return;
    }

    setStatus("syncing");
    try {
      retryFailedQueue();
      await runSync();
      setLastSyncedAt(getMeta("last_synced_at"));
      setStatus("idle");
    } catch {
      setStatus("error");
    } finally {
      setPendingCount(getPendingCount());
    }
  }, []);

  useEffect(() => {
    triggerSync(true);

    const netSub = NetInfo.addEventListener((state) => {
      if (state.isConnected) triggerSync();
    });
    const appSub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") triggerSync();
    });

    return () => {
      netSub();
      appSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, lastSyncedAt, pendingCount, triggerSync: () => triggerSync(true) };
}
