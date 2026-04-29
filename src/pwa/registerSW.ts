// Service worker registration with iframe / preview-host guards.
// The SW only ever activates on the published production domain.
import { registerSW } from "virtual:pwa-register";

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
}
