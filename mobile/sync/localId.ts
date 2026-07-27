// Temp IDs for offline-created rows, replaced by the server's real ID once
// synced. Prefixed so they're never mistaken for a server UUID.
export function newLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isLocalId(id: string) {
  return id.startsWith("local-");
}
