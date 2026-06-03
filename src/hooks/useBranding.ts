import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { setBrandingOverrides } from "@/config/branding";

interface BrandingTokenRow {
  token_key: string;
  token_value: string;
}

/**
 * Fetches branding_tokens once (react-query dedupes) and writes the values into the neutral
 * module cache that resolveBranding() reads synchronously. While loading / on error / empty ->
 * cache stays empty -> the hardcoded BRANDING_DEFAULTS fallback is used (strangler, byte-identical for H3).
 */
export function useBranding(): void {
  const { data } = useQuery({
    queryKey: ["branding_tokens"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("branding_tokens").select("token_key,token_value");
      if (error) throw error;
      return (data ?? []) as unknown as BrandingTokenRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!data) return;
    const map: Record<string, string> = {};
    for (const r of data) if (r.token_key && r.token_value) map[r.token_key] = r.token_value;
    setBrandingOverrides(map);
  }, [data]);
}
