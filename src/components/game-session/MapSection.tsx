import { useState } from "react";
import { AlertTriangle, ChevronDown, MapPin } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { scenarioMediaUrl } from "@/lib/storage";
import type { ScaledMap } from "@/lib/setupResolver";

type Group = "starting" | "near" | "center" | "far";

const GROUP_META: Record<Group, { ru: string; en: string; dot: string }> = {
  starting: { ru: "Стартовые (I)", en: "Starting (I)", dot: "bg-cyan-500" },
  near:     { ru: "Ближние (IV-V)", en: "Near (IV-V)", dot: "bg-green-500" },
  center:   { ru: "Центр (VI-VII)", en: "Center (VI-VII)", dot: "bg-orange-500" },
  far:      { ru: "Дальние (II-III)", en: "Far (II-III)", dot: "bg-red-500" },
};

function classifyKey(key: string): { group: Group | null; isParent: boolean; subSuffix: string | null } {
  for (const g of Object.keys(GROUP_META) as Group[]) {
    if (key === g) return { group: g, isParent: true, subSuffix: null };
    if (key.startsWith(g + "_")) return { group: g, isParent: false, subSuffix: key.slice(g.length + 1) };
  }
  return { group: null, isParent: false, subSuffix: null };
}

function subKeyLabel(key: string, lang: "RU" | "EN"): string {
  if (key === "near_with_obelisk") return lang === "RU" ? "с обелиском" : "with obelisk";
  if (key === "center_VI_VII_grail") return lang === "RU" ? "с Граалем" : "with Grail";
  const cls = classifyKey(key);
  const suffix = cls.subSuffix ?? key;
  const cleaned = suffix.replace(/_/g, " ").trim();
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

interface GroupedRow {
  parentKey: string | null;
  parentCount: number | null;
  subs: Array<{ key: string; count: number }>;
}

function groupTiles(tc: Record<string, number>): Record<Group, GroupedRow> {
  const out = {} as Record<Group, GroupedRow>;
  (Object.keys(GROUP_META) as Group[]).forEach((g) => {
    out[g] = { parentKey: null, parentCount: null, subs: [] };
  });
  for (const [k, v] of Object.entries(tc)) {
    const { group, isParent } = classifyKey(k);
    if (!group) continue;
    if (isParent) {
      out[group].parentKey = k;
      out[group].parentCount = v;
    } else {
      out[group].subs.push({ key: k, count: v });
    }
  }
  return out;
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

  const grouped = groupTiles(map.tile_counts);
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
                <div key={k} className="flex justify-between max-w-xs">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono">{v}</span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {lang === "RU" ? "Расстановка тайлов" : "Tile setup"}
        </h3>
        <div className="space-y-3">
          {(Object.keys(GROUP_META) as Group[]).map((g) => {
            const row = grouped[g];
            if (row.parentCount == null && row.subs.length === 0) return null;
            const meta = GROUP_META[g];
            return (
              <div key={g} className="space-y-1">
                {row.parentCount != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                    <span className="font-mono w-6 text-right">{row.parentCount}</span>
                    <span>{lang === "RU" ? meta.ru : meta.en}</span>
                  </div>
                )}
                {row.subs.map((s) => (
                  <div key={s.key} className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dot} opacity-60`} />
                    <span className="font-mono w-6 text-right">{s.count}</span>
                    <span>{subKeyLabel(s.key, lang)}</span>
                  </div>
                ))}
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
        <img
          src={scenarioMediaUrl(map.map_image)}
          alt={(lang === "RU" ? map.variant_label_ru : map.variant_label_en) || "Map"}
          className="max-w-full rounded-lg border cursor-zoom-in"
          loading="lazy"
        />
      )}
    </section>
  );
}
