import { describe, expect, it } from "vitest";
import { renderGlyphs } from "./renderGlyphs";

const ENTITY_TYPES = [
  "spell",
  "ability",
  "artifact",
  "unit",
  "hero",
  "rule",
  "rule_ext",
  "war_machine",
  "town_building",
  "building",
  "astrologer",
  "field",
  "event",
  "glyph",
  "statistic",
  "ai_card",
  "map_event",
  "morale",
  "pandora",
];

describe("renderGlyphs entity-link parsing", () => {
  it.each(ENTITY_TYPES)(
    "converts [Label](%s:42) markdown to an entity-link span",
    (type) => {
      const html = renderGlyphs(`See [Sample Label](${type}:42) here.`, {});
      expect(html).toContain(`class="entity-link"`);
      expect(html).toContain(`data-entity-type="${type}"`);
      expect(html).toContain(`data-entity-id="42"`);
      expect(html).toContain(`>Sample Label<`);
      expect(html).not.toMatch(/\[Sample Label\]\(/);
    },
  );

  it("strips unknown entity types through to raw markdown", () => {
    const html = renderGlyphs("Bogus [X](nonsense_type:1)", {});
    expect(html).toContain("[X](nonsense_type:1)");
    expect(html).not.toContain("entity-link");
  });

  it("handles multi-word entity ids (underscored slug-ids)", () => {
    const html = renderGlyphs("[Catapult](unit:catapult_hero_war_machine)", {});
    expect(html).toContain(`data-entity-type="unit"`);
    expect(html).toContain(`data-entity-id="catapult_hero_war_machine"`);
  });

  it("returns empty string for null/undefined input", () => {
    expect(renderGlyphs(null, {})).toBe("");
    expect(renderGlyphs(undefined, {})).toBe("");
  });

  it("does not break when no entity-link markdown is present", () => {
    const html = renderGlyphs("Plain text without any links.", {});
    expect(html).toBe("Plain text without any links.");
  });
});
