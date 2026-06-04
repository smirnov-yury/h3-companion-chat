import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EntityRow, EntityTypeRow } from "@/config/genericEntities";

export interface GenericSectionData {
  entityType: EntityTypeRow | null;
  entities: EntityRow[];
}

export function useGenericSection(tabId: string) {
  return useQuery<GenericSectionData>({
    queryKey: ["generic_section", tabId],
    queryFn: async () => {
      const section = await (supabase.from as any)("sections")
        .select("data_source")
        .eq("id", tabId)
        .maybeSingle();
      const ds = section.data?.data_source as string | null | undefined;
      if (!ds) return { entityType: null, entities: [] };

      const et = await (supabase.from as any)("entity_types")
        .select("type_key,label_en,label_ru,fields,layout_ref")
        .eq("type_key", ds)
        .maybeSingle();
      if (!et.data) return { entityType: null, entities: [] };

      const rows = await (supabase.from as any)("entities")
        .select("id,type_key,slug,name_en,name_ru,attrs,image,sort_order")
        .eq("type_key", ds)
        .order("sort_order", { ascending: true });

      return {
        entityType: et.data as EntityTypeRow,
        entities: (rows.data ?? []) as EntityRow[],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
