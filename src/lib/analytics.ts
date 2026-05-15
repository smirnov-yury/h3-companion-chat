// Google Analytics 4 loader + event helpers, gated on user consent.
// Loader script is injected dynamically; nothing is sent unless
// `getConsent()?.analytics === true` at the moment of the call.

import { getConsent } from "@/lib/consent";

export const GA_MEASUREMENT_ID = "G-BYKC913WLW";

let scriptInjected = false;
let configured = false;

function isConsentGranted(): boolean {
  return getConsent()?.analytics === true;
}

function injectScriptOnce(): void {
  if (scriptInjected) return;
  if (typeof document === "undefined") return;
  const existing = document.querySelector(
    `script[src*="googletagmanager.com/gtag/js"]`
  );
  if (existing) {
    scriptInjected = true;
    return;
  }
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(s);
  scriptInjected = true;
}

/**
 * Initialize GA4 if the user has granted analytics consent.
 * Safe to call multiple times — idempotent.
 * Call on app mount and again on consent transition denied -> granted.
 */
export function initAnalytics(): void {
  if (!isConsentGranted()) return;
  injectScriptOnce();
  if (configured) return;
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    send_page_view: true,
  });
  configured = true;
}

/**
 * Fire a custom GA4 event. No-op if consent not granted or gtag missing.
 */
export function trackEvent(
  name: string,
  params?: Record<string, unknown>
): void {
  if (!isConsentGranted()) return;
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params ?? {});
}

/**
 * SPA page_view dispatch — call on every react-router location change.
 * Drops the call silently if consent denied.
 */
export function trackPageView(path: string, title?: string): void {
  trackEvent("page_view", {
    page_path: path,
    page_title: title ?? (typeof document !== "undefined" ? document.title : undefined),
    page_location:
      typeof window !== "undefined" ? window.location.href : undefined,
  });
}

/** AI chat message event — fired after a successful streamed reply. */
export function trackAiChatMessage(lang: "RU" | "EN"): void {
  trackEvent("ai_chat_message_sent", { lang });
}

/** Game Setup successful generation event. */
export function trackGameSetupGenerated(params: {
  scenario_id: string;
  player_count: number;
  mode: string;
}): void {
  trackEvent("game_setup_generated", params);
}

/** Voice input transcribed successfully. duration_sec is the recorded audio length. */
export function trackVoiceInputRecorded(params: {
  lang: "RU" | "EN";
  duration_sec: number;
}): void {
  const bucket =
    params.duration_sec < 5 ? "short" : params.duration_sec < 20 ? "medium" : "long";
  trackEvent("voice_input_recorded", {
    lang: params.lang,
    duration_bucket: bucket,
  });
}
