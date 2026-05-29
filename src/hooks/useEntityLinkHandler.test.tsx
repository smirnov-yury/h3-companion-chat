import { describe, it, expect } from "vitest";
import { entityLinkUrl } from "./useEntityLinkHandler";

// Pure-function routing matrix. Keeps in sync with the renderGlyphs regex
// type whitelist in src/utils/renderGlyphs.ts.
const CASES: Array<[string, string, string | null]> = [
  // [type, id, expected URL (or null for handled-elsewhere types)]
  ["spell",         "fireball",            "/decks/spells/fireball"],
  ["ability",       "leadership",          "/decks/abilities/leadership"],
  ["artifact",      "angel_wings",         "/decks/artifacts/angel_wings"],
  ["unit",          "archangels_few",      "/units/archangels_few"],
  ["hero",          "adelaide",            "/heroes/adelaide"],
  ["rule",          "abc-123",             "/rules/abc-123"],
  ["field",         "black_market",        "/map-elements/black_market"],
  ["event",         "harvest_festival",    "/events/harvest_festival"],
  ["astrologer",    "magic_resistance",    "/events/magic_resistance?section=astrologers"],
  ["war_machine",   "ballista",            "/decks/warmachines/ballista"],
  ["ai_card",       "ai_aggressive",       "/events?section=ai"],
  ["morale",        "morale_low",          "/events?section=morale"],
  ["map_event",     "earthquake",          "/map-elements?section=map_events"],
  ["pandora",       "pandora_5",           "/map-elements?section=pandora"],
  ["statistic",     "attack",              "/decks/attributes/attack"],
  ["town_building", "castle_townhall",     "/towns/castle"],
  ["building",      "tower_capitol",       "/towns/tower"],
  ["rule_ext",      "42",                  null], // routed via RuleExtModal, not URL
  ["glyph",         "fire_glyph",          null], // icon-only
];

describe("entityLinkUrl", () => {
  it.each(CASES)("type=%s id=%s -> %s", (type, id, expected) => {
    expect(entityLinkUrl(type, id)).toBe(expected);
  });

  it("returns null for unknown entity types", () => {
    expect(entityLinkUrl("nonsense", "x")).toBeNull();
    expect(entityLinkUrl("", "x")).toBeNull();
  });

  it("town_building / building requires an underscore in id (falls back to null)", () => {
    // id without underscore -> townId === id ('orphan'), still returns /towns/orphan.
    // Empty string left of underscore -> townId is '' (falsy) -> null.
    expect(entityLinkUrl("town_building", "")).toBeNull();
    expect(entityLinkUrl("building", "_foo")).toBeNull();
  });
});
