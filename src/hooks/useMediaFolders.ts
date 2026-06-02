import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { setMediaFolderOverrides } from "@/config/mediaFolders";

interface MediaFolderRow {
  content_key: string;
  folder: string;
}

/**
 * Fetches the media_folders config once (react-query dedupes) and writes the folder
 * overrides into the neutral module cache that componentImageUrl/componentImagePath
 * read synchronously. While loading / on error / empty -> cache stays empty -> the
 * hardcoded MEDIA_FOLDER_DEFAULTS fallback is used (strangler, byte-identical for H3).
 */
export function useMediaFolders(): void {
  const { data } = useQuery({
    queryKey: ["media_folders"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("media_folders").select("content_key,folder");
      if (error) throw error;
      return (data ?? []) as unknown as MediaFolderRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!data) return;
    const map: Record<string, string> = {};
    for (const r of data) if (r.content_key && r.folder) map[r.content_key] = r.folder;
    setMediaFolderOverrides(map);
  }, [data]);
}
