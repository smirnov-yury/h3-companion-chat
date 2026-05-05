import { SUPABASE_URL } from "@/integrations/supabase/client";

export const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public`;

/** Build a public storage URL for a bucket + path. */
export function storageUrl(bucket: string, path: string): string {
  return `${STORAGE_BASE}/${bucket}/${path}`;
}

/** Common bucket helpers. */
export const componentMediaUrl = (path: string) => storageUrl("component-media", path);
export const scenarioMediaUrl = (path: string) => storageUrl("scenario-media", path);

/**
 * Single source of truth for which folder inside `component-media` holds images
 * for each table. Both the admin uploader and the public reader tabs MUST read
 * the folder name from this map. Adding a new entity? Add one row here.
 */
export const COMPONENT_MEDIA_FOLDERS = {
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

export type ComponentMediaTable = keyof typeof COMPONENT_MEDIA_FOLDERS;

/** Public URL for an image stored under component-media for the given table. */
export function componentImageUrl(table: ComponentMediaTable, filename: string): string {
  return componentMediaUrl(`${COMPONENT_MEDIA_FOLDERS[table]}/${filename}`);
}

/** Storage path (relative to component-media bucket) for table + filename. */
export function componentImagePath(table: ComponentMediaTable, filename: string): string {
  return `${COMPONENT_MEDIA_FOLDERS[table]}/${filename}`;
}

/** Hard limit on uploaded image size in bytes. Mirrors bucket file_size_limit. */
export const COMPONENT_MEDIA_MAX_BYTES = 1024 * 1024;
