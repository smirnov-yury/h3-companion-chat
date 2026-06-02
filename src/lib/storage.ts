import { SUPABASE_URL } from "@/integrations/supabase/client";
import {
  MEDIA_FOLDER_DEFAULTS,
  resolveMediaFolder,
  type ComponentMediaTable,
} from "@/config/mediaFolders";

// Route public storage media through Cloudflare Worker proxy on
// media.h3master.app so the CF edge absorbs the bandwidth instead of
// Supabase Storage. See HMM APP/infra/cf-worker/media-proxy.js +
// DEPLOY-MEDIA.md. Falls back to direct Supabase URL if the env var is
// not present (eg. local dev without DNS).
const MEDIA_PROXY_BASE = (import.meta.env.VITE_MEDIA_PROXY_BASE as string | undefined)
  ?? "https://media.h3master.app";

// STORAGE_BASE points at the CF proxy in production. Falls back to the
// Supabase origin for buckets we do NOT proxy (none currently - kept for
// future-proofing).
export const STORAGE_BASE = MEDIA_PROXY_BASE;
export const STORAGE_BASE_DIRECT = `${SUPABASE_URL}/storage/v1/object/public`;

/** Build a public storage URL for a bucket + path. */
export function storageUrl(bucket: string, path: string): string {
  return `${STORAGE_BASE}/${bucket}/${path}`;
}

/** Common bucket helpers. */
export const componentMediaUrl = (path: string) => storageUrl("component-media", path);
export const scenarioMediaUrl = (path: string) => storageUrl("scenario-media", path);

/**
 * Back-compat re-export. The canonical table->folder map now lives in the neutral
 * module src/config/mediaFolders.ts so storage.ts and the useMediaFolders hook both
 * import it without a circular import. componentImageUrl/componentImagePath resolve
 * the folder via resolveMediaFolder(), which reads the DB-driven override
 * (media_folders) with this map as the hardcoded fallback (strangler) and the key
 * itself as the default for unknown keys.
 */
export const COMPONENT_MEDIA_FOLDERS = MEDIA_FOLDER_DEFAULTS;
export type { ComponentMediaTable };

/**
 * Public URL for an image stored under component-media for the given table.
 *
 * If `updatedAt` is provided, a `?v=<updatedAt>` query parameter is appended
 * to bust the browser / service worker cache whenever the row is updated.
 * Pass the row's `updated_at` value directly - the column is `timestamptz`
 * with a BEFORE UPDATE trigger, so any admin change rotates the cache key.
 */
export function componentImageUrl(
  table: ComponentMediaTable,
  filename: string,
  updatedAt?: string | null,
): string {
  const base = componentMediaUrl(`${resolveMediaFolder(table)}/${filename}`);
  if (!updatedAt) return base;
  return `${base}?v=${encodeURIComponent(updatedAt)}`;
}

/** Storage path (relative to component-media bucket) for table + filename. */
export function componentImagePath(table: ComponentMediaTable, filename: string): string {
  return `${resolveMediaFolder(table)}/${filename}`;
}

/** Hard limit on uploaded image size in bytes. Mirrors bucket file_size_limit. */
export const COMPONENT_MEDIA_MAX_BYTES = 1024 * 1024;
