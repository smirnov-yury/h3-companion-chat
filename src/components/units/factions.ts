// Faction towns that get slug-grouped in UnitsTab.
// "summoned" must be present so Water/Air/Earth/Fire Elementals collapse
// from 8 standalone cards into 4 grouped cards (Few + Pack per element).
// Towns NOT in this list (Neutral, Creature Bank) render as standalone
// cards via the neutralUnits bucket.
export const FACTIONS = [
  "castle",
  "necropolis",
  "dungeon",
  "tower",
  "fortress",
  "rampart",
  "inferno",
  "conflux",
  "stronghold",
  "cove",
  "summoned",
] as const;

export type FactionTown = (typeof FACTIONS)[number];
