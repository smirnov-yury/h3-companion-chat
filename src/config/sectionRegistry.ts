import type { TabId } from "@/components/NavDrawer";

/**
 * Single source of truth for section URL routing.
 * - `slug`: the URL segment for the section (e.g. /heroes)
 * - `tabId`: the internal tab id used by NavDrawer / Index state
 * - `levels`: the meaning of each path segment after the slug
 *   (used by future deep-linking phases for filter + card sync)
 */
export interface SectionDef {
  slug: string;
  tabId: TabId;
  levels: readonly string[];
  table: string | null;
  /** Field name on the entity used for the first-level filter (lowercased+hyphenated for URL). */
  filterField?: string;
  subtypes?: readonly string[];
}

export const SECTION_REGISTRY: readonly SectionDef[] = [
  { slug: "rules",        tabId: "rules",         levels: ["category", "id"],         table: "rules",      filterField: "category" },
  { slug: "scenarios",    tabId: "scenarios",     levels: ["id"],                      table: "scenarios" },
  { slug: "map-elements", tabId: "map_elements",  levels: ["id"],                      table: "fields" },
  { slug: "events",       tabId: "global_events", levels: ["id"],                      table: "events" },
  {
    slug: "decks",
    tabId: "decks",
    levels: ["subtype", "filter", "id"],
    table: null,
    subtypes: ["artifacts", "spells", "abilities", "attributes", "warmachines"],
  },
  { slug: "units",        tabId: "units",         levels: ["town", "id"],              table: "unit_stats", filterField: "town" },
  { slug: "heroes",       tabId: "heroes",        levels: ["town", "id"],              table: "heroes",     filterField: "town" },
  { slug: "towns",        tabId: "towns",         levels: ["id"],                      table: "towns" },
  { slug: "ai",           tabId: "ai",            levels: [],                          table: null },
] as const;

export const DEFAULT_SLUG = "rules";

export function findSectionBySlug(slug: string | undefined): SectionDef | undefined {
  if (!slug) return undefined;
  return SECTION_REGISTRY.find((s) => s.slug === slug);
}

export function findSectionByTabId(tabId: TabId): SectionDef | undefined {
  return SECTION_REGISTRY.find((s) => s.tabId === tabId);
}

/** Lowercase + hyphenate a string for use as a URL slug. */
export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
