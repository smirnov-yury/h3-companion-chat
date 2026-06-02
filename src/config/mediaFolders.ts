// NEUTRAL pure module - imports NOTHING (no hooks, components, contexts, supabase client).
// Multi-Game Section 4: maps a content key (the table-name string passed to componentImageUrl)
// to the storage folder inside the component-media bucket. The canonical hardcoded map lives
// HERE (not in storage.ts) so storage.ts and the useMediaFolders hook can both import it without
// a circular import.

export const MEDIA_FOLDER_DEFAULTS = {
  unit_stats: "units",
  statistics: "statistics",
  war_machines: "war_machines",
  glyphs: "glyphs",
  events: "events",
  towns: "towns",
  heroes: "heroes",
  spells: "spells",
  artifacts: "artifacts",
  abilities: "abilities",
  astrologers_proclaim: "astrologers_proclaim",
  fields: "fields",
  ai_cards: "ai_cards",
  map_events: "map_events",
  morale_cards: "morale_cards",
  pandora_box: "pandora_box",
  scenario_map_variants: "scenario-maps",
} as const;

export type ComponentMediaTable = keyof typeof MEDIA_FOLDER_DEFAULTS;

// Runtime override cache, populated once by useMediaFolders() from the media_folders table.
// Stays empty while loading / on error -> resolver falls back to the hardcoded map (strangler).
let folderOverrides: Record<string, string> = {};

export function setMediaFolderOverrides(map: Record<string, string>): void {
  folderOverrides = map ?? {};
}

// GUARD 2: never returns undefined. Resolution order: DB override -> hardcoded default -> the key itself.
export function resolveMediaFolder(contentKey: string): string {
  return (
    folderOverrides[contentKey] ??
    (MEDIA_FOLDER_DEFAULTS as Record<string, string>)[contentKey] ??
    contentKey
  );
}
