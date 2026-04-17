// Inline SVG glyphs keyed by token name (e.g. <gold>, <attack>).
// Add entries here to override PNG glyphs with inline SVGs.
// SVGs should use currentColor for theming and have no fixed width/height
// (the .glyph-svg CSS sets 1em).
export const GLYPH_SVGS: Record<string, string> = {
  // Example:
  // gold: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">...</svg>`,
};
