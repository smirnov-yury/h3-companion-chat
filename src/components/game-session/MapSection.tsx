import { useState } from "react";
import { AlertTriangle, ChevronDown, MapPin } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { scenarioMediaUrl } from "@/lib/storage";
import ImageWithSpinner from "@/components/ImageWithSpinner";
import type { ScaledMap } from "@/lib/setupResolver";

type TileCategory = "starting" | "near" | "center" | "far";

interface TileGroup {
  category: TileCategory;
  primaryCount: number;
  qualifiers: Array<{ keySuffix: string; count: number }>;
}

const CATEGORY_LABELS: Record<TileCategory, { ru: string; en: string }> = {
  starting: { ru: "Стартовые позиции (I)", en: "Starting (I)" },
  near:     { ru: "Ближние (IV-V)",         en: "Near (IV-V)" },
  center:   { ru: "Центральные (VI-VII)",   en: "Center (VI-VII)" },
  far:      { ru: "Дальние (II-III)",       en: "Far (II-III)" },
};

const QUALIFIER_LABELS: Record<string, { ru: string; en: string }> = {
  with_obelisk: { ru: "из них с обелиском", en: "of which with Obelisk" },
  grail:        { ru: "из них с Граалем",   en: "of which with Grail" },
};

function groupTileCounts(tc: Record<string, number>): TileGroup[] {
  const groups: Record<TileCategory, TileGroup> = {
    starting: { category: "starting", primaryCount: 0, qualifiers: [] },
    far:      { category: "far",      primaryCount: 0, qualifiers: [] },
    near:     { category: "near",     primaryCount: 0, qualifiers: [] },
    center:   { category: "center",   primaryCount: 0, qualifiers: [] },
  };
  const PRIMARY: Record<TileCategory, RegExp[]> = {
    starting: [/^starting$/, /^starting_I$/i],
    near:     [/^near$/, /^near_IV_V$/i, /^near_II_V$/i],
    center:   [/^center$/, /^center_VI_VII$/i],
    far:      [/^far$/, /^far_II_III$/i],
  };
  for (const [k, v] of Object.entries(tc)) {
    let assigned = false;
    for (const cat of Object.keys(groups) as TileCategory[]) {
      const isPrimary = PRIMARY[cat].some((rx) => rx.test(k));
      if (isPrimary) {
        groups[cat].primaryCount = v;
        assigned = true;
        break;
      }
      if (k === cat || k.startsWith(`${cat}_`)) {
        let suffix = k.slice(cat.length + 1);
        suffix = suffix.replace(/^[IVX_]+_/, "");
        groups[cat].qualifiers.push({ keySuffix: suffix, count: v });
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      // unknown prefix — ignore
    }
  }
  return Object.values(groups);
}

function qualifierLabel(suffix: string, lang: "RU" | "EN"): string {
  const known = QUALIFIER_LABELS[suffix];
  if (known) return lang === "RU" ? known.ru : known.en;
  const human = suffix.replace(/_/g, " ");
  return human.charAt(0).toUpperCase() + human.slice(1);
}

function baselineLabel(rawKey: string, lang: "RU" | "EN"): string {
  // Strip trailing roman numeral group (II_III, IV_V, VI_VII, I) — we re-add it in parentheses.
  const m = rawKey.match(/^([a-z_]+?)(?:_(I|II_III|IV_V|VI_VII|II_V))?$/i);
  const stem = (m?.[1] ?? rawKey).toLowerCase();
  const numerals = m?.[2]?.replace(/_/g, "-");

  // Category roots
  const ROOTS_RU: Record<string, string> = {
    starting: "Стартовые",
    far: "Дальние",
    near: "Ближние",
    center: "Центральные",
  };
  const ROOTS_EN: Record<string, string> = {
    starting: "Starting",
    far: "Far",
    near: "Near",
    center: "Center",
  };

  // Qualifier suffix mapping
  const QUALIFIERS_RU: Record<string, string> = {
    with_obelisk: "с обелиском",
    grail: "с Граалем",
    subterranean: "подземные",
  };
  const QUALIFIERS_EN: Record<string, string> = {
    with_obelisk: "with Obelisk",
    grail: "with Grail",
    subterranean: "subterranean",
  };

  // Parse stem: e.g. "near_subterranean", "near_with_obelisk", "center", "starting"
  const parts = stem.split("_");
  const category = parts[0];
  const qualifierKey = parts.slice(1).join("_");

  const root = lang === "RU" ? ROOTS_RU[category] ?? category : ROOTS_EN[category] ?? category;
  let label = root;

  if (qualifierKey) {
    const q = lang === "RU" ? QUALIFIERS_RU[qualifierKey] : QUALIFIERS_EN[qualifierKey];
    if (q) label = `${root} ${q}`;
    else label = `${root} (${qualifierKey})`;
  }

  if (numerals) label += ` (${numerals})`;
  return label;
}

export default function MapSection({ map, playerCount }: { map: ScaledMap | null; playerCount: number }) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const [baselineOpen, setBaselineOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(true);

  if (!map) {
    return (
      <section className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        {lang === "RU"
          ? "Данные карты недоступны для этого сценария"
          : "Map data not available for this scenario"}
      </section>
    );
  }

  const groups = groupTileCounts(map.tile_counts);
  const setupText = (lang === "RU" ? map.map_setup_text_ru : map.map_setup_text_en) || "";
  const layoutNotes = (lang === "RU" ? map.layout_notes_ru : map.layout_notes_en) || "";

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">
          {lang === "RU" ? "Карта" : "Map"}
        </h2>
      </div>

      {map.scaled && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="font-semibold text-sm">
                {lang === "RU" ? "Карта масштабирована" : "Map scaled"}
              </div>
              <div className="text-sm text-muted-foreground">
                {lang === "RU"
                  ? `Сценарий рассчитан на ${map.baseline_player_count} игроков. Размер карты увеличен под ${playerCount} игроков. Проверьте баланс перед стартом.`
                  : `Scenario is designed for ${map.baseline_player_count} players. Map scaled for ${playerCount} players. Check balance before starting.`}
              </div>
            </div>
          </div>
          <Collapsible open={baselineOpen} onOpenChange={setBaselineOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary hover:underline">
              <ChevronDown className={`w-3 h-3 transition-transform ${baselineOpen ? "rotate-180" : ""}`} />
              {lang === "RU" ? "Показать оригинальные tile counts" : "Show original tile counts"}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 ml-4 text-xs space-y-0.5">
              {Object.entries(map.baseline_tile_counts).map(([k, v]) => (
                <div key={k} className="flex justify-between max-w-xs gap-2">
                  <span className="text-muted-foreground">{baselineLabel(k, lang)}</span>
                  <span className="font-mono tabular-nums">{v}</span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      <div>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {lang === "RU" ? "Расстановка тайлов" : "Tile setup"}
        </h3>
        <div className="rounded-lg border border-border divide-y divide-border bg-card">
          {groups
            .filter((g) => g.primaryCount > 0 || g.qualifiers.length > 0)
            .map((g) => {
              const display =
                g.primaryCount > 0
                  ? g.primaryCount
                  : g.qualifiers.reduce((sum, q) => sum + q.count, 0);
              const label = lang === "RU" ? CATEGORY_LABELS[g.category].ru : CATEGORY_LABELS[g.category].en;
              return (
                <div key={g.category} className="px-3 py-2">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium">{label}</span>
                    <span className="font-semibold tabular-nums">{display}</span>
                  </div>
                  {g.qualifiers.length > 0 && (
                    <ul className="mt-1.5 ml-3 space-y-0.5 text-sm text-muted-foreground">
                      {g.qualifiers.map((q) => (
                        <li key={q.keySuffix} className="flex items-baseline justify-between">
                          <span>— {qualifierLabel(q.keySuffix, lang)}</span>
                          <span className="tabular-nums">{q.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {setupText && (
        <Collapsible open={setupOpen} onOpenChange={setSetupOpen} className="rounded-lg border bg-card">
          <CollapsibleTrigger className="w-full flex items-center justify-between p-4">
            <span className="text-sm font-semibold">
              {lang === "RU" ? "Описание карты" : "Map description"}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${setupOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <div
              className="text-sm leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: renderGlyphs(setupText, glyphs) }}
            />
          </CollapsibleContent>
        </Collapsible>
      )}

      {layoutNotes && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="font-semibold text-sm">
                {lang === "RU" ? "Особые требования к расстановке" : "Special placement notes"}
              </div>
              <div
                className="text-sm leading-relaxed whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: renderGlyphs(layoutNotes, glyphs) }}
              />
            </div>
          </div>
        </div>
      )}

      {map.map_image && (
        <ImageWithSpinner
          src={scenarioMediaUrl(map.map_image)}
          alt={(lang === "RU" ? map.variant_label_ru : map.variant_label_en) || "Map"}
          className="max-w-full rounded-lg border cursor-zoom-in"
          loading="lazy"
        />
      )}
    </section>
  );
}
