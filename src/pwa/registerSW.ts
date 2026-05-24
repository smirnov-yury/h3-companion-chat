// Service worker registration with iframe / preview-host guards.
// The SW only ever activates on the published production domain.
import { registerSW } from "virtual:pwa-register";
import { supabase } from "@/integrations/supabase/client";

const FORCE_REFRESH_KEY = "h3master_force_refresh_version";
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let pollTimer: number | null = null;
let knownForceVersion: number | null = null;

async function checkForceRefreshVersion(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "pwa_force_refresh_version")
      .maybeSingle();
    if (error || !data) return;
    const raw = (data as { value: unknown }).value;
    const remote = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(remote)) return;

    if (knownForceVersion === null) {
      const stored = localStorage.getItem(FORCE_REFRESH_KEY);
      const storedNum = stored ? Number(stored) : null;
      if (storedNum && Number.isFinite(storedNum)) {
        knownForceVersion = storedNum;
      } else {
        knownForceVersion = remote;
        localStorage.setItem(FORCE_REFRESH_KEY, String(remote));
      }
    }

    if (remote > knownForceVersion) {
      knownForceVersion = remote;
      localStorage.setItem(FORCE_REFRESH_KEY, String(remote));
      notify(true);
    }
  } catch {
    // Network hiccup — try again next poll
  }
}

type UpdateListener = (needsRefresh: boolean) => void;

let updateSWFn: ((reload?: boolean) => Promise<void>) | null = null;
let manualCheckFn: (() => Promise<void>) | null = null;
const listeners = new Set<UpdateListener>();
let lastNeedsRefresh = false;

function notify(needsRefresh: boolean) {
  lastNeedsRefresh = needsRefresh;
  listeners.forEach((l) => l(needsRefresh));
}

export function onPWAUpdate(listener: UpdateListener): () => void {
  listeners.add(listener);
  // Fire current state immediately
  listener(lastNeedsRefresh);
  return () => listeners.delete(listener);
}

export function applyPWAUpdate() {
  if (updateSWFn) {
    updateSWFn(true);
  } else {
    window.location.reload();
  }
}

export async function checkForPWAUpdate(): Promise<"updated" | "current" | "unavailable"> {
  if (!manualCheckFn) return "unavailable";
  const before = lastNeedsRefresh;
  try {
    await manualCheckFn();
  } catch {
    return "unavailable";
  }
  // Give the SW a moment to fire its updatefound event
  await new Promise((r) => setTimeout(r, 600));
  return lastNeedsRefresh && !before ? "updated" : "current";
}

export function initPWA() {
  // Skip in iframes (Lovable preview is iframed)
  let isInIframe = false;
  try {
    isInIframe = window.self !== window.top;
  } catch {
    isInIframe = true;
  }

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host.includes("lovable.app") && host.startsWith("id-preview");

  if (isInIframe || isPreviewHost) {
    // Unregister any stale SWs that may have been installed previously
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
    }
    return;
  }

  const updater = registerSW({
    immediate: true,
    onNeedRefresh() {
      notify(true);
    },
    onOfflineReady() {
      // No-op for now
    },
  });

  updateSWFn = updater;

  // If a new SW is already waiting from a previous session, show the banner immediately
  navigator.serviceWorker?.ready?.then((reg) => {
    if (reg.waiting) notify(true);
  });

  manualCheckFn = async () => {
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    if (regs) {
      await Promise.all(regs.map((r) => r.update()));
    }
  };

  // PWA force-refresh broadcast: poll app_settings.pwa_force_refresh_version
  // Initial check on tab focus, then every 5 minutes while visible.
  const startPolling = () => {
    if (pollTimer !== null) return;
    void checkForceRefreshVersion();
    pollTimer = window.setInterval(checkForceRefreshVersion, POLL_INTERVAL_MS);
  };
  const stopPolling = () => {
    if (pollTimer !== null) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      startPolling();
    } else {
      stopPolling();
    }
  });
  if (document.visibilityState === "visible") {
    startPolling();
  }
}
