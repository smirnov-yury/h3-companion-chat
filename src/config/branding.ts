// NEUTRAL pure module - imports NOTHING (no hooks, components, contexts, supabase client).
// Multi-Game Section 5: language-neutral brand identity primitives. The canonical hardcoded
// values live HERE so every consumer and the useBranding hook can import them one-way without
// a circular import. Seeded 1-to-1 into the branding_tokens table; the live site is byte-identical
// because resolveBranding() falls back to these defaults until/unless the DB provides an override.

export const BRANDING_DEFAULTS = {
  app_name: "H3 Master",
  app_full_name: "H3 Master — Companion for Heroes of Might & Magic III: The Board Game",
  site_url: "https://h3master.app",
  contact_email: "privacy@h3master.app",
  logo_light: "/h3master-lockup-horizontal-A-light.svg",
  logo_dark: "/h3master-lockup-horizontal-A-dark.svg",
  default_lang: "RU",
  theme_color_light: "#7B3618",
  theme_color_dark: "#E8B147",
  kofi_url: "https://ko-fi.com/h3master",
} as const;

export type BrandingKey = keyof typeof BRANDING_DEFAULTS;

// Runtime override cache, populated once by useBranding() from the branding_tokens table.
// Stays empty while loading / on error -> resolver falls back to BRANDING_DEFAULTS (strangler).
let brandingOverrides: Record<string, string> = {};

export function setBrandingOverrides(map: Record<string, string>): void {
  brandingOverrides = map ?? {};
}

// GUARD 2: never returns undefined. Resolution order: DB override -> hardcoded default -> "".
export function resolveBranding(key: BrandingKey | string): string {
  return (
    brandingOverrides[key] ??
    (BRANDING_DEFAULTS as Record<string, string>)[key] ??
    ""
  );
}
