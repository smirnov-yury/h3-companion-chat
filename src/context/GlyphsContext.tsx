import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlyphMap } from "@/utils/renderGlyphs";

interface GlyphsContextType { glyphs: GlyphMap; glyphsLoaded: boolean; }
const GlyphsContext = createContext<GlyphsContextType>({ glyphs: {}, glyphsLoaded: false });

async function fetchGlyphs(): Promise<GlyphMap> {
  const { data, error } = await supabase
    .from("glyphs")
    .select("id, description_en, image")
    .order("sort_order");
  if (error) {
    console.error("Failed to load glyphs:", error.message);
    return {};
  }
  const map: GlyphMap = {};
  (data ?? []).forEach((g) => {
    map[g.id] = {
      description: g.description_en ?? g.id,
      image: g.image ?? `glyph-${g.id}.png`,
    };
  });
  return map;
}

export function GlyphsProvider({ children }: { children: ReactNode }) {
  const { data: glyphs = {}, isLoading } = useQuery({
    queryKey: ["glyphs"],
    queryFn: fetchGlyphs,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  return (
    <GlyphsContext.Provider value={{ glyphs, glyphsLoaded: !isLoading }}>
      {children}
    </GlyphsContext.Provider>
  );
}

export function useGlyphs() { return useContext(GlyphsContext); }
