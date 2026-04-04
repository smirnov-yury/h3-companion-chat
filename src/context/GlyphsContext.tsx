import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlyphMap } from '@/utils/renderGlyphs';

interface GlyphsContextType { glyphs: GlyphMap; glyphsLoaded: boolean; }
const GlyphsContext = createContext<GlyphsContextType>({ glyphs: {}, glyphsLoaded: false });

export function GlyphsProvider({ children }: { children: ReactNode }) {
  const [glyphs, setGlyphs] = useState<GlyphMap>({});
  const [glyphsLoaded, setGlyphsLoaded] = useState(false);
  useEffect(() => {
    supabase.from('glyphs').select('id, description_en, image').order('sort_order').then(({ data, error }) => {
      if (error) { console.error('Failed to load glyphs:', error.message); setGlyphsLoaded(true); return; }
      const map: GlyphMap = {};
      (data ?? []).forEach((g) => { map[g.id] = { description: g.description_en ?? g.id, image: g.image ?? `glyph-${g.id}.png` }; });
      setGlyphs(map);
      setGlyphsLoaded(true);
    });
  }, []);
  return <GlyphsContext.Provider value={{ glyphs, glyphsLoaded }}>{children}</GlyphsContext.Provider>;
}

export function useGlyphs() { return useContext(GlyphsContext); }