export type GlyphMap = Record<string, { description: string; image: string }>;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

// Tier star tokens get their own color class instead of yellow
const TIER_TOKENS = new Set(['bronze', 'silver', 'golden', 'azure']);
// Resource tokens render in natural colors (no filter)
const NATURAL_TOKENS = new Set(['gold', 'buildingmaterials', 'valuables']);

export function renderGlyphs(text: string | null | undefined, glyphs: GlyphMap): string {
  if (!text) return '';
  return text.replace(/<([a-z_0-9]+)>/gi, (match, token) => {
    const lowerToken = token.toLowerCase();
    const glyph = glyphs[token] || glyphs[lowerToken];
    if (!glyph) return match;
    const src = `${SUPABASE_URL}/storage/v1/object/public/component-media/glyphs/${glyph.image}`;

    let cssClass = 'glyph-icon';
    if (TIER_TOKENS.has(lowerToken)) {
      cssClass = `glyph-icon glyph-tier-${lowerToken}`;
    } else if (NATURAL_TOKENS.has(lowerToken)) {
      cssClass = 'glyph-icon glyph-natural';
    }

    return `<img src="${src}" alt="${glyph.description}" title="${glyph.description}" class="${cssClass}" style="display:inline-block;width:18px;height:18px;vertical-align:middle;margin:0 1px;object-fit:contain;" loading="lazy" />`;
  });
}