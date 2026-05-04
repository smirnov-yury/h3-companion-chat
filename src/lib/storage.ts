import { SUPABASE_URL } from "@/integrations/supabase/client";

export const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public`;

/** Build a public storage URL for a bucket + path. */
export function storageUrl(bucket: string, path: string): string {
  return `${STORAGE_BASE}/${bucket}/${path}`;
}

/** Common bucket helpers. */
export const componentMediaUrl = (path: string) => storageUrl("component-media", path);
export const scenarioMediaUrl  = (path: string) => storageUrl("scenario-media", path);
