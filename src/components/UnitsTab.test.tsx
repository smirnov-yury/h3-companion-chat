import { describe, expect, it } from "vitest";

// Mirror the production constants from UnitsTab.tsx. Keep this in sync if FACTIONS changes.
const FACTIONS = [
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
];

type UnitStat = {
  id: string;
  slug: string | null;
  town: string | null;
  name_en: string;
};

const isNeutral = (unit: UnitStat) =>
  !FACTIONS.includes(unit.town?.toLowerCase() ?? "");

function deriveGroups(units: UnitStat[]) {
  const factionGroups: Record<string, UnitStat[]> = {};
  const neutralUnits: UnitStat[] = [];
  units.forEach((u) => {
    if (isNeutral(u)) {
      neutralUnits.push(u);
    } else {
      (factionGroups[u.slug ?? "__null__"] ??= []).push(u);
    }
  });
  return { factionGroups, neutralUnits };
}

describe("UnitsTab faction grouping derivation", () => {
  it("groups Summoned elementals by slug (regression: s93 #97)", () => {
    const fixture: UnitStat[] = [
      { id: "air_elementals_few", slug: "air_elementals", town: "Summoned", name_en: "Air Elementals" },
      { id: "air_elementals_pack", slug: "air_elementals", town: "Summoned", name_en: "Air Elementals" },
      { id: "water_elementals_few", slug: "water_elementals", town: "Summoned", name_en: "Water Elementals" },
      { id: "water_elementals_pack", slug: "water_elementals", town: "Summoned", name_en: "Water Elementals" },
    ];
    const { factionGroups, neutralUnits } = deriveGroups(fixture);
    expect(neutralUnits).toHaveLength(0);
    expect(Object.keys(factionGroups).sort()).toEqual(["air_elementals", "water_elementals"]);
    expect(factionGroups.air_elementals).toHaveLength(2);
    expect(factionGroups.water_elementals).toHaveLength(2);
  });

  it("groups Castle units by slug", () => {
    const fixture: UnitStat[] = [
      { id: "halberdiers", slug: "halberdiers", town: "Castle", name_en: "Halberdiers" },
      { id: "marksmen", slug: "marksmen", town: "Castle", name_en: "Marksmen" },
    ];
    const { factionGroups, neutralUnits } = deriveGroups(fixture);
    expect(neutralUnits).toHaveLength(0);
    expect(Object.keys(factionGroups).sort()).toEqual(["halberdiers", "marksmen"]);
  });

  it("routes true-neutral towns into neutralUnits", () => {
    const fixture: UnitStat[] = [
      { id: "peasant_neutral", slug: null, town: "Neutral", name_en: "Peasant" },
      { id: "creature_bank_unit", slug: null, town: "Creature Bank", name_en: "Bank Guard" },
    ];
    const { factionGroups, neutralUnits } = deriveGroups(fixture);
    expect(Object.keys(factionGroups)).toHaveLength(0);
    expect(neutralUnits).toHaveLength(2);
  });

  it("handles case-insensitive town names", () => {
    const fixture: UnitStat[] = [
      { id: "x_few", slug: "x", town: "summoned", name_en: "Lowercase Summoned" },
      { id: "y_few", slug: "y", town: "SUMMONED", name_en: "Upper Summoned" },
    ];
    const { factionGroups, neutralUnits } = deriveGroups(fixture);
    expect(neutralUnits).toHaveLength(0);
    expect(factionGroups.x).toHaveLength(1);
    expect(factionGroups.y).toHaveLength(1);
  });

  it("covers every known faction town in FACTIONS list", () => {
    const knownTowns = [
      "Castle",
      "Necropolis",
      "Dungeon",
      "Tower",
      "Fortress",
      "Rampart",
      "Inferno",
      "Conflux",
      "Stronghold",
      "Cove",
      "Summoned",
    ];
    knownTowns.forEach((town) => {
      const u: UnitStat = { id: `${town}_x`, slug: `${town}_slug`, town, name_en: town };
      expect(isNeutral(u)).toBe(false);
    });
  });
});
