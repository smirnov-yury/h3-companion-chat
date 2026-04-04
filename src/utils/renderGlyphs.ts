export type GlyphMap = Record<string, { description: string; image: string }>;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export function renderGlyphs(text: string | null | undefined, glyphs: GlyphMap): string {
  if (!text) return '';
  return text.replace(/<([a-z_0-9]+)>/gi, (match, token) => {
    const glyph = glyphs[token];
    if (!glyph) return match;
    const src = `${SUPABASE_URL}/storage/v1/object/public/component-media/glyphs/${glyph.image}`;
    return `<img src="${src}" alt="${glyph.description}" title="${glyph.description}" class="glyph-icon" style="display:inline-block;width:18px;height:18px;vertical-align:middle;margin:0 1px;object-fit:contain;" loading="lazy" />`;
  });
}