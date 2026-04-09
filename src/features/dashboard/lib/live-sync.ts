"use client";

const DASHBOARD_SYNC_CHANNEL = "mindaptix-dashboard-sync";
const DASHBOARD_SYNC_STORAGE_KEY = "__mindaptix_dashboard_sync__";

export function emitDashboardSync(reason = "updated") {
  if (typeof window === "undefined") {
    return;
  }

  const payload = JSON.stringify({ reason, timestamp: Date.now() });

  try {
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(DASHBOARD_SYNC_CHANNEL);
      channel.postMessage(payload);
      channel.close();
    }
  } catch {}

  try {
    window.localStorage.setItem(DASHBOARD_SYNC_STORAGE_KEY, payload);
    window.localStorage.removeItem(DASHBOARD_SYNC_STORAGE_KEY);
  } catch {}
}

export function subscribeDashboardSync(onSync: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  let channel: BroadcastChannel | null = null;

  const handleStorage = (event: StorageEvent) => {
    if (event.key === DASHBOARD_SYNC_STORAGE_KEY && event.newValue) {
      onSync();
    }
  };

  try {
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(DASHBOARD_SYNC_CHANNEL);
      channel.addEventListener("message", onSync);
    }
  } catch {}

  window.addEventListener("storage", handleStorage);

  return () => {
    if (channel) {
      channel.removeEventListener("message", onSync);
      channel.close();
    }

    window.removeEventListener("storage", handleStorage);
  };
}
