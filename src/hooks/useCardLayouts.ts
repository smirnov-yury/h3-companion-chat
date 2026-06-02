import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CARD_LAYOUT_DEFAULTS, defaultLayoutForGrid, resolveLayoutId, type CardLayout } from "@/config/cardLayouts";

interface CardLayoutRow {
  id: string; aspect_ratio: string | null; width_px: number | null; height_px: number | null;
  cols_base: number; cols_sm: number | null; cols_md: number | null; cols_lg: number | null; cols_xl: number | null;
  object_fit: CardLayout["objectFit"]; object_position: string; gap: number; badge_slots: string[];
}
interface SectionLayoutRow { id: string; layout_ref: string | null; }

function rowToLayout(r: CardLayoutRow): CardLayout {
  return {
    id: r.id, aspectRatio: r.aspect_ratio, widthPx: r.width_px, heightPx: r.height_px,
    colsBase: r.cols_base, colsSm: r.cols_sm, colsMd: r.cols_md, colsLg: r.cols_lg, colsXl: r.cols_xl,
    objectFit: r.object_fit, objectPosition: r.object_position, gap: r.gap,
    badgeSlots: Array.isArray(r.badge_slots) ? r.badge_slots : [],
  };
}

export function useCardLayout(gridKey: string): CardLayout {
  const { data } = useQuery({
    queryKey: ["card_layouts"],
    queryFn: async () => {
      const [layouts, sections] = await Promise.all([
        (supabase.from as any)("card_layouts").select("*"),
        supabase.from("sections").select("id,layout_ref"),
      ]);
      if (layouts.error) throw layouts.error;
      const byId: Record<string, CardLayout> = { ...CARD_LAYOUT_DEFAULTS };
      for (const row of ((layouts.data ?? []) as unknown as CardLayoutRow[])) byId[row.id] = rowToLayout(row);
      const sectionLayout: Record<string, string> = {};
      for (const s of ((sections.data ?? []) as unknown as SectionLayoutRow[])) if (s.layout_ref) sectionLayout[s.id] = s.layout_ref;
      return { byId, sectionLayout };
    },
    staleTime: 5 * 60 * 1000,
  });

  const id = resolveLayoutId(gridKey);
  return data?.byId[id] ?? defaultLayoutForGrid(gridKey);
}
