// Helpers for hero image filenames stored in Supabase Storage bucket
// `component-media`, folder `heroes/`. The folder mixes hero portraits
// and specialty cards, so we identify portraits by exclusion: not a
// specialty card filename and not the deck-back placeholder.

const SPECIALTY_PREFIXES = ["hero_specialties-", "herospecialties-"] as const;
const PLACEHOLDER_FILENAME = "player-deck-back.webp";

export function isHeroPortraitFilename(
  image: string | null | undefined,
): image is string {
  if (!image) return false;
  if (image === PLACEHOLDER_FILENAME) return false;
  return !SPECIALTY_PREFIXES.some((p) => image.startsWith(p));
}
