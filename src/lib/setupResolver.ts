// ============================================================
// Types
// ============================================================

export type Tier = "bronze" | "silver" | "golden";
export type Squad = "Few" | "Pack";

export interface ParsedUnitFormula {
  count: number;
  squad: Squad;
  tier: Tier;
  sort: "highest" | "lowest" | null;
}

export interface ResolvedUnit {
  squad: Squad;
  unit_id: string;
  name_en: string;
  name_ru: string | null;
  image: string | null;
  cost: string;
  tier: Tier;
}

export interface ParsedBuilding {
  kind: "dwelling" | "standard";
  tier?: Tier;
  name?: string;
}

export interface ResolvedBuilding {
  id: string;
  name_en: string;
  name_ru: string | null;
  kind: "dwelling" | "standard";
  tier?: Tier;
  cost: string | null;
}

export interface UnitRow {
  id: string;
  name_en: string;
  name_ru: string | null;
  town: string | null;
  tier: string | null;
  number: string | null;
  cost: string | null;
  image: string | null;
}

export interface BuildingRow {
  id: string;
  town_id: string;
  name_en: string;
  name_ru: string | null;
  cost: string | null;
  dwelling_tier: string | null;
}

export interface MapVariantRow {
  id: number;
  scenario_id: string;
  player_count: number | null;
  variant_label_en: string | null;
  variant_label_ru: string | null;
  map_setup_text_en: string | null;
  map_setup_text_ru: string | null;
  tile_counts: Record<string, number> | null;
  layout_notes_en: string | null;
  layout_notes_ru: string | null;
  map_image: string | null;
  sort_order: number | null;
}

export interface SetupBlockRow {
  id: number;
  scenario_id: string;
  player_count: number | null;
  block_type: string;
  title_en: string | null;
  title_ru: string | null;
  content_en: string | null;
  content_ru: string | null;
  sort_order: number | null;
}

export interface TimedEventRow {
  id: number;
  scenario_id: string;
  player_count: number | null;
  trigger_type: string | null;
  trigger_round: number | null;
  trigger_label_en: string | null;
  trigger_label_ru: string | null;
  condition_en: string | null;
  condition_ru: string | null;
  effect_en: string | null;
  effect_ru: string | null;
}

// ============================================================
// Campaign / solo extension types
// ============================================================

export interface AISetupRow {
  scenario_id: string;
  ai_faction_en: string | null;
  ai_faction_ru: string | null;
  enemy_heroes_en: string[] | null;
  enemy_heroes_ru: string[] | null;
  enemy_armies_en: Array<{ name: string; units: string }> | null;
  enemy_armies_ru: Array<{ name: string; units: string }> | null;
  enemy_decks_en: Array<{ name: string; cards: string }> | null;
  enemy_decks_ru: Array<{ name: string; cards: string }> | null;
  enemy_spell_deck_en: Array<{ name: string; cards: string }> | null;
  enemy_spell_deck_ru: Array<{ name: string; cards: string }> | null;
  special_setup_en: string | null;
  special_setup_ru: string | null;
  notes_en: string | null;
  notes_ru: string | null;
}

export interface StorySectionRow {
  scenario_id: string;
  section_key: string;
  title_en: string | null;
  title_ru: string | null;
  trigger_text_en: string | null;
  trigger_text_ru: string | null;
  content_en: string | null;
  content_ru: string | null;
  sort_order: number | null;
}

export interface PayloadAISetup {
  ai_faction_en: string | null;
  ai_faction_ru: string | null;
  enemy_heroes_en: string[];
  enemy_heroes_ru: string[];
  enemy_armies_en: Array<{ name: string; units: string }>;
  enemy_armies_ru: Array<{ name: string; units: string }>;
  enemy_decks_en: Array<{ name: string; cards: string }>;
  enemy_decks_ru: Array<{ name: string; cards: string }>;
  enemy_spell_deck_en: Array<{ name: string; cards: string }>;
  enemy_spell_deck_ru: Array<{ name: string; cards: string }>;
  special_setup_en: string | null;
  special_setup_ru: string | null;
  notes_en: string | null;
  notes_ru: string | null;
}

export interface PayloadStorySection {
  section_key: string;
  title_en: string | null;
  title_ru: string | null;
  trigger_text_en: string | null;
  trigger_text_ru: string | null;
  content_en: string | null;
  content_ru: string | null;
  sort_order: number;
}

// ============================================================
// Parsers
// ============================================================

function normalizeFormula(raw: string): string {
  return raw
    .replace(/^each\s+player\s+starts\s+with\s*:\s*/i, "")
    .replace(/\.\s*$/, "")
    .trim();
}

export function parseOneUnitFormula(s: string): ParsedUnitFormula | null {
  const re = /^(\d+)\s*[×x]\s*(?:A\s+)?(Few|Pack)(?:\s+of)?\s*<(golden|silver|bronze)>(?:\s+units?)?(?:\s+with\s+the\s+(highest|lowest)\s+Recruitment\s+cost)?$/i;
  const m = s.trim().match(re);
  if (!m) return null;
  return {
    count: parseInt(m[1], 10),
    squad: (m[2][0].toUpperCase() + m[2].slice(1).toLowerCase()) as Squad,
    tier: m[3].toLowerCase() as Tier,
    sort: m[4] ? (m[4].toLowerCase() as "highest" | "lowest") : null,
  };
}

export function parseStartingUnits(content: string): ParsedUnitFormula[] | null {
  const norm = normalizeFormula(content);
  const subs = norm.split(/\s*,\s*/).filter(Boolean);
  const out: ParsedUnitFormula[] = [];
  for (const sub of subs) {
    const parsed = parseOneUnitFormula(sub);
    if (!parsed) return null;
    out.push(parsed);
  }
  return out;
}

export function extractGoldCost(cost: string | null): number {
  if (!cost) return 0;
  const m = cost.match(/(\d+)\s*<gold>/);
  if (m) return parseInt(m[1], 10);
  const m2 = cost.match(/(\d+)/);
  return m2 ? parseInt(m2[1], 10) : 0;
}

export function parseOneBuilding(s: string): ParsedBuilding | null {
  const t = s.trim();
  let m = t.match(/^<(golden|silver|bronze)>\s+Dwelling$/i);
  if (m) return { kind: "dwelling", tier: m[1].toLowerCase() as Tier };
  m = t.match(/^Dwelling\s*\(<(golden|silver|bronze)>\)$/i);
  if (m) return { kind: "dwelling", tier: m[1].toLowerCase() as Tier };
  m = t.match(/^(Citadel|Mage\s+Guild|City\s+Hall)$/i);
  if (m) return { kind: "standard", name: m[1].replace(/\s+/g, " ") };
  return null;
}

export function parseStartingBuildings(content: string): ParsedBuilding[] | null {
  const norm = normalizeFormula(content);
  const subs = norm.split(/\s*,\s*/).filter(Boolean);
  const out: ParsedBuilding[] = [];
  for (const sub of subs) {
    const parsed = parseOneBuilding(sub);
    if (!parsed) return null;
    out.push(parsed);
  }
  return out;
}

// ============================================================
// Resolvers
// ============================================================

export function resolveStartingUnits(
  formulas: ParsedUnitFormula[],
  town: string,
  allUnits: UnitRow[],
): ResolvedUnit[] {
  const out: ResolvedUnit[] = [];
  for (const f of formulas) {
    const candidates = allUnits.filter(
      (u) => u.town === town && u.tier === f.tier && u.number === f.squad,
    );
    let sorted = [...candidates];
    if (f.sort === "highest") {
      sorted.sort((a, b) => extractGoldCost(b.cost) - extractGoldCost(a.cost));
    } else if (f.sort === "lowest") {
      sorted.sort((a, b) => extractGoldCost(a.cost) - extractGoldCost(b.cost));
    } else {
      sorted.sort(() => Math.random() - 0.5);
    }
    const taken = sorted.slice(0, f.count);
    for (const u of taken) {
      out.push({
        squad: f.squad,
        unit_id: u.id,
        name_en: u.name_en,
        name_ru: u.name_ru,
        image: u.image,
        cost: u.cost ?? "",
        tier: f.tier,
      });
    }
  }
  return out;
}

export function resolveStartingBuildings(
  parsed: ParsedBuilding[],
  town: string,
  allBuildings: BuildingRow[],
): ResolvedBuilding[] {
  const out: ResolvedBuilding[] = [];
  for (const p of parsed) {
    if (p.kind === "dwelling" && p.tier) {
      const row = allBuildings.find(
        (b) => b.town_id === town.toLowerCase() && b.dwelling_tier === p.tier,
      );
      if (row) {
        out.push({
          id: row.id,
          name_en: row.name_en,
          name_ru: row.name_ru,
          kind: "dwelling",
          tier: p.tier,
          cost: row.cost,
        });
      }
    } else if (p.kind === "standard" && p.name) {
      const target = p.name.toLowerCase();
      const row = allBuildings.find(
        (b) =>
          b.town_id === town.toLowerCase() &&
          b.name_en.toLowerCase() === target,
      );
      if (row) {
        out.push({
          id: row.id,
          name_en: row.name_en,
          name_ru: row.name_ru,
          kind: "standard",
          cost: row.cost,
        });
      }
    }
  }
  return out;
}

// ============================================================
// Map scaler
// ============================================================

export interface ScaledMap {
  variant_id: number;
  variant_label_en: string | null;
  variant_label_ru: string | null;
  player_count: number;
  tile_counts: Record<string, number>;
  baseline_player_count: number;
  scaled: boolean;
  baseline_tile_counts: Record<string, number>;
  map_setup_text_en: string | null;
  map_setup_text_ru: string | null;
  layout_notes_en: string | null;
  layout_notes_ru: string | null;
  map_image: string | null;
}

export function scaleMap(
  variants: MapVariantRow[],
  targetPlayerCount: number,
): ScaledMap | null {
  if (!variants.length) return null;
  const nativeVariant = variants.find((v) => v.player_count === targetPlayerCount);
  if (nativeVariant) {
    const tc = nativeVariant.tile_counts ?? {};
    return {
      variant_id: nativeVariant.id,
      variant_label_en: nativeVariant.variant_label_en,
      variant_label_ru: nativeVariant.variant_label_ru,
      player_count: targetPlayerCount,
      tile_counts: tc,
      baseline_player_count: targetPlayerCount,
      scaled: false,
      baseline_tile_counts: tc,
      map_setup_text_en: nativeVariant.map_setup_text_en,
      map_setup_text_ru: nativeVariant.map_setup_text_ru,
      layout_notes_en: nativeVariant.layout_notes_en,
      layout_notes_ru: nativeVariant.layout_notes_ru,
      map_image: nativeVariant.map_image,
    };
  }
  const candidates = variants.filter((v) => v.player_count !== null);
  const baseline =
    candidates
      .filter((v) => (v.player_count ?? 0) <= targetPlayerCount)
      .sort((a, b) => (b.player_count ?? 0) - (a.player_count ?? 0))[0] ??
    candidates.sort((a, b) => (a.player_count ?? 0) - (b.player_count ?? 0))[0];
  if (!baseline || !baseline.player_count) return null;
  const baseTC = baseline.tile_counts ?? {};
  const scaled: Record<string, number> = {};
  for (const [k, v] of Object.entries(baseTC)) {
    // Any key starting with "starting" is one-per-player invariant (e.g. "starting", "starting_I").
    if (k === "starting" || k.startsWith("starting_")) {
      scaled[k] = targetPlayerCount;
    }
    // Any key starting with "center" is a shared focal point — never scaled (e.g. "center", "center_VI_VII_grail").
    else if (k === "center" || k.startsWith("center_")) {
      scaled[k] = v;
    }
    // Everything else scales by per-player ratio.
    else {
      scaled[k] = Math.max(0, Math.round((v * targetPlayerCount) / baseline.player_count));
    }
  }
  return {
    variant_id: baseline.id,
    variant_label_en: baseline.variant_label_en,
    variant_label_ru: baseline.variant_label_ru,
    player_count: targetPlayerCount,
    tile_counts: scaled,
    baseline_player_count: baseline.player_count,
    scaled: true,
    baseline_tile_counts: baseTC,
    map_setup_text_en: baseline.map_setup_text_en,
    map_setup_text_ru: baseline.map_setup_text_ru,
    layout_notes_en: baseline.layout_notes_en,
    layout_notes_ru: baseline.layout_notes_ru,
    map_image: baseline.map_image,
  };
}

// ============================================================
// Block picker
// ============================================================

export function pickSetupBlock(
  blocks: SetupBlockRow[],
  blockType: string,
  targetPlayerCount: number,
): SetupBlockRow | null {
  const sameType = blocks.filter((b) => b.block_type === blockType);
  const exact = sameType.find((b) => b.player_count === targetPlayerCount);
  if (exact) return exact;
  const universal = sameType.find((b) => b.player_count === null);
  if (universal) return universal;
  const smaller = sameType
    .filter((b) => (b.player_count ?? 0) <= targetPlayerCount && b.player_count !== null)
    .sort((a, b) => (b.player_count ?? 0) - (a.player_count ?? 0))[0];
  return smaller ?? null;
}

// ============================================================
// Top-level payload builder
// ============================================================

export interface PayloadPlayer {
  index: number;
  name: string;
  town: string;
  hero: {
    id: string;
    name_en: string;
    name_ru: string | null;
    image: string | null;
    attack: number | null;
    defense: number | null;
    power: number | null;
    knowledge: number | null;
    class_en: string | null;
    class_ru: string | null;
  } | null;
  starting_resources_text_en: string | null;
  starting_resources_text_ru: string | null;
  income_text_en: string | null;
  income_text_ru: string | null;
  starting_buildings_raw_en: string | null;
  starting_buildings_raw_ru: string | null;
  starting_buildings: ResolvedBuilding[];
  starting_units_raw_en: string | null;
  starting_units_raw_ru: string | null;
  starting_units: ResolvedUnit[];
  starting_units_resolved: boolean;
}

export interface Payload {
  version: 1;
  scenario: {
    id: string;
    title_en: string;
    title_ru: string | null;
    summary_en: string | null;
    summary_ru: string | null;
    mode: string;
    rounds_min: number | null;
    rounds_max: number | null;
    book_id: string;
    book_title_en: string | null;
    book_title_ru: string | null;
  };
  player_count: number;
  map: ScaledMap | null;
  common: {
    victory_en: string | null;
    victory_ru: string | null;
    lose_en: string | null;
    lose_ru: string | null;
    additional_rules_en: string | null;
    additional_rules_ru: string | null;
    timed_events: Array<{
      round: number | null;
      label_en: string | null;
      label_ru: string | null;
      condition_en: string | null;
      condition_ru: string | null;
      effect_en: string | null;
      effect_ru: string | null;
    }>;
  };
  players: PayloadPlayer[];
  starting_player_index: number | null;
}

export interface BuildPayloadInput {
  form: {
    scenarioId: string;
    playerCount: number;
    players: Array<{ name: string; town: string | null; heroId: string | null }>;
    startingPlayerIndex: number | null;
  };
  scenario: {
    id: string;
    title_en: string;
    title_ru: string | null;
    summary_en: string | null;
    summary_ru: string | null;
    mode: string;
    rounds_min: number | null;
    rounds_max: number | null;
    book_id: string;
  };
  book: { id: string; title_en: string | null; title_ru: string | null } | null;
  setupBlocks: SetupBlockRow[];
  mapVariants: MapVariantRow[];
  timedEvents: TimedEventRow[];
  heroes: Array<{
    id: string; name_en: string; name_ru: string | null; image: string | null;
    attack: number | null; defense: number | null; power: number | null; knowledge: number | null;
    class_en?: string | null; class_ru?: string | null;
  }>;
  units: UnitRow[];
  buildings: BuildingRow[];
}

export function buildPayload(input: BuildPayloadInput): Payload {
  const { form, scenario, book, setupBlocks, mapVariants, timedEvents, heroes, units, buildings } = input;
  const map = scaleMap(mapVariants, form.playerCount);
  const baselinePlayerCount = map?.baseline_player_count ?? form.playerCount;

  const victoryBlock = pickSetupBlock(setupBlocks, "victory_conditions", baselinePlayerCount);
  const loseBlock = pickSetupBlock(setupBlocks, "lose_conditions", baselinePlayerCount);
  const additionalBlock = pickSetupBlock(setupBlocks, "additional_rules", baselinePlayerCount);
  const resourcesBlock = pickSetupBlock(setupBlocks, "starting_resources", baselinePlayerCount);
  const incomeBlock = pickSetupBlock(setupBlocks, "player_income", baselinePlayerCount);
  const buildingsBlock = pickSetupBlock(setupBlocks, "starting_buildings", baselinePlayerCount);
  const unitsBlock = pickSetupBlock(setupBlocks, "starting_units", baselinePlayerCount);

  const players: PayloadPlayer[] = form.players.map((p, i) => {
    const hero = heroes.find((h) => h.id === p.heroId) ?? null;
    let resolvedUnits: ResolvedUnit[] = [];
    let unitsResolved = false;
    if (unitsBlock?.content_en && p.town) {
      const formulas = parseStartingUnits(unitsBlock.content_en);
      if (formulas) {
        resolvedUnits = resolveStartingUnits(formulas, p.town, units);
        unitsResolved = true;
      }
    }
    let resolvedBuildings: ResolvedBuilding[] = [];
    if (buildingsBlock?.content_en && p.town) {
      const parsed = parseStartingBuildings(buildingsBlock.content_en);
      if (parsed) {
        resolvedBuildings = resolveStartingBuildings(parsed, p.town, buildings);
      }
    }
    return {
      index: i,
      name: p.name,
      town: p.town ?? "",
      hero: hero
        ? {
            id: hero.id, name_en: hero.name_en, name_ru: hero.name_ru, image: hero.image,
            attack: hero.attack, defense: hero.defense, power: hero.power, knowledge: hero.knowledge,
            class_en: hero.class_en ?? null,
            class_ru: hero.class_ru ?? null,
          }
        : null,
      starting_resources_text_en: resourcesBlock?.content_en ?? null,
      starting_resources_text_ru: resourcesBlock?.content_ru ?? null,
      income_text_en: incomeBlock?.content_en ?? null,
      income_text_ru: incomeBlock?.content_ru ?? null,
      starting_buildings_raw_en: buildingsBlock?.content_en ?? null,
      starting_buildings_raw_ru: buildingsBlock?.content_ru ?? null,
      starting_buildings: resolvedBuildings,
      starting_units_raw_en: unitsBlock?.content_en ?? null,
      starting_units_raw_ru: unitsBlock?.content_ru ?? null,
      starting_units: resolvedUnits,
      starting_units_resolved: unitsResolved,
    };
  });

  return {
    version: 1,
    scenario: {
      id: scenario.id,
      title_en: scenario.title_en,
      title_ru: scenario.title_ru,
      summary_en: scenario.summary_en,
      summary_ru: scenario.summary_ru,
      mode: scenario.mode,
      rounds_min: scenario.rounds_min,
      rounds_max: scenario.rounds_max,
      book_id: scenario.book_id,
      book_title_en: book?.title_en ?? null,
      book_title_ru: book?.title_ru ?? null,
    },
    player_count: form.playerCount,
    map,
    common: {
      victory_en: victoryBlock?.content_en ?? null,
      victory_ru: victoryBlock?.content_ru ?? null,
      lose_en: loseBlock?.content_en ?? null,
      lose_ru: loseBlock?.content_ru ?? null,
      additional_rules_en: additionalBlock?.content_en ?? null,
      additional_rules_ru: additionalBlock?.content_ru ?? null,
      timed_events: timedEvents
        .filter((e) => e.player_count === form.playerCount || e.player_count === null)
        .sort((a, b) => (a.trigger_round ?? 0) - (b.trigger_round ?? 0))
        .map((e) => ({
          round: e.trigger_round,
          label_en: e.trigger_label_en,
          label_ru: e.trigger_label_ru,
          condition_en: e.condition_en,
          condition_ru: e.condition_ru,
          effect_en: e.effect_en,
          effect_ru: e.effect_ru,
        })),
    },
    players,
    starting_player_index: form.startingPlayerIndex,
  };
}
