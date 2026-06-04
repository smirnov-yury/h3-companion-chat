import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  buildSectionRouting,
  type RoutingSectionRow,
  type RedirectRow,
  type SectionRouting,
} from "@/config/sectionRouting";

export function useSectionRouting(): SectionRouting & { isReady: boolean } {
  const { data, isFetched } = useQuery({
    queryKey: ["section_routing"],
    queryFn: async (): Promise<{ rows: RoutingSectionRow[]; redirects: RedirectRow[] }> => {
      const [secRes, redRes] = await Promise.all([
        supabase.from("sections").select("id,slug,parent_id,data_source"),
        supabase.from("slug_redirects").select("old_slug,new_slug"),
      ]);
      if (secRes.error) throw secRes.error;
      return {
        rows: (secRes.data ?? []) as RoutingSectionRow[],
        redirects: (redRes.data ?? []) as RedirectRow[],
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const routing = useMemo(
    () => buildSectionRouting(data?.rows ?? [], data?.redirects ?? []),
    [data],
  );

  return { ...routing, isReady: isFetched };
}
