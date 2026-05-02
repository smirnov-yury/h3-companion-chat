import { useState, useEffect } from "react";
import { Users, Clock, Gauge, Map as MapIcon, BookOpen, Zap, Swords, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import type { Json } from "@/integrations/supabase/types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const MODE_LABELS_EN: Record<string, string> = { clash: "Clash", cooperative: "Cooperative", campaign: "Campaign" };
const MODE_LABELS_RU: Record<string, string> = { clash: "Столкновение", cooperative: "Кооператив", campaign: "Кампания" };
const MODE_COLORS: Record<string, string> = {
  clash: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  cooperative: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  campaign: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const TRIGGER_LABELS_EN: Record<string, string> = {
  round_start: "Round Start",
  round_end: "Round End",
  on_discover_tile: "On Tile Discovery",
  on_visit_field: "On Visit",
  on_capture_location: "On Capture",
  on_complete: "On Completion",
  custom: "Special",
};

const TRIGGER_LABELS_RU: Record<string, string> = {
  round_start: "Начало раунда",
  round_end: "Конец раунда",
  on_discover_tile: "При открытии тайла",
  on_visit_field: "При посещении",
  on_capture_location: "При захвате",
  on_complete: "При выполнении",
  custom: "Особое",
};

interface ScenarioDetailProps {
  scenario: {
    id: string;
    mode: string;
    title_en: string;
    title_ru: string | null;
    summary_en: string | null;
    summary_ru: string | null;
    min_players: number | null;
    max_players: number | null;
    rounds_min: number | null;
    rounds_max: number | null;
    difficulty_text_en: string | null;
    difficulty_text_ru: string | null;
    has_map_variants: boolean;
    has_story: boolean;
    has_ai_setup: boolean;
  };
  onClose: () => void;
}

function GlyphHtml({ text, glyphs }: { text: string; glyphs: Record<string, { description: string; image: string }> }) {
  const html = renderGlyphs(text, glyphs);
  return html !== text
    ? <span dangerouslySetInnerHTML={{ __html: html }} />
    : <>{text}</>;
}

export default function ScenarioDetail({ scenario, onClose }: ScenarioDetailProps) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const s = scenario;

  const title = lang === "RU" ? (s.title_ru || s.title_en) : s.title_en;
  const modeLabel = lang === "RU" ? (MODE_LABELS_RU[s.mode] || s.mode) : (MODE_LABELS_EN[s.mode] || s.mode);

  const playerText = s.min_players
    ? s.min_players === s.max_players ? `${s.min_players}` : `${s.min_players}–${s.max_players}`
    : null;
  const roundsText = s.rounds_min
    ? s.rounds_min === s.rounds_max ? `${s.rounds_min}` : `${s.rounds_min}–${s.rounds_max}`
    : null;
  const diff = lang === "RU" ? (s.difficulty_text_ru || s.difficulty_text_en) : s.difficulty_text_en;

  const [tabsReady, setTabsReady] = useState(false);
  const [hasSetup, setHasSetup] = useState(false);
  const [hasMap, setHasMap] = useState(false);
  const [hasEvents, setHasEvents] = useState(false);
  const [hasStory, setHasStory] = useState(false);
  const [hasAI, setHasAI] = useState(false);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    if (!scenario?.id) return;
    setTabsReady(false);
    const id = scenario.id;
    Promise.all([
      supabase.from("scenario_setup_blocks" as never).select("id").eq("scenario_id", id).limit(1),
      supabase.from("scenario_map_variants" as never).select("id").eq("scenario_id", id).limit(1),
      supabase.from("scenario_timed_events" as never).select("id").eq("scenario_id", id).limit(1),
      supabase.from("scenario_story_sections" as never).select("id").eq("scenario_id", id).limit(1),
      supabase.from("scenario_ai_setup" as never).select("id").eq("scenario_id", id).limit(1),
    ]).then(([setup, map, events, story, ai]) => {
      setHasSetup(((setup.data as unknown[]) ?? []).length > 0);
      setHasMap(((map.data as unknown[]) ?? []).length > 0);
      setHasEvents(((events.data as unknown[]) ?? []).length > 0);
      setHasStory(((story.data as unknown[]) ?? []).length > 0);
      setHasAI(((ai.data as unknown[]) ?? []).length > 0);
      setTabsReady(true);
      setActiveTab("");
    });
  }, [scenario?.id]);

  const tabs = [
    hasSetup && "setup",
    hasMap && "map",
    hasEvents && "events",
    hasStory && "story",
    hasAI && "ai",
  ].filter(Boolean) as string[];

  const currentTab = tabs.includes(activeTab) ? activeTab : tabs[0] ?? "";

  const tabLabel = (key: string) => {
    if (lang === "RU") {
      return { setup: "Настройка", map: "Карта", events: "События", story: "Сюжет", ai: "ИИ враг" }[key] || key;
    }
    return { setup: "Setup", map: "Map", events: "Events", story: "Story", ai: "AI Setup" }[key] || key;
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90dvh] flex flex-col overflow-hidden rounded-xl [&>button.absolute.right-4]:hidden">
        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute top-3 right-3 z-50 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background/80 backdrop-blur-sm transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background"
          style={{ borderColor: "#E1BB3A", color: "#E1BB3A" }}
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </DialogPrimitive.Close>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base">{title}</DialogTitle>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${MODE_COLORS[s.mode] || ""}`}>{modeLabel}</span>
            {playerText && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Users size={11} />{playerText}</span>}
            {roundsText && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock size={11} />{roundsText} {lang === "RU" ? "раунд." : "rounds"}</span>}
            {diff && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Gauge size={11} />{diff}</span>}
          </div>
        </DialogHeader>

        {!tabsReady ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : tabs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            {lang === "RU" ? "Нет подробных данных для этого сценария." : "No detailed data available for this scenario."}
          </p>
        ) : (
          <Tabs value={currentTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="shrink-0 w-full justify-start overflow-x-auto">
              {tabs.map((t) => (
                <TabsTrigger key={t} value={t}>{tabLabel(t)}</TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-2">
              {hasSetup && <TabsContent value="setup" className="mt-0"><SetupPane scenarioId={s.id} /></TabsContent>}
              {hasMap && <TabsContent value="map" className="mt-0"><MapPane scenarioId={s.id} /></TabsContent>}
              {hasEvents && <TabsContent value="events" className="mt-0"><EventsPane scenarioId={s.id} /></TabsContent>}
              {hasStory && <TabsContent value="story" className="mt-0"><StoryPane scenarioId={s.id} /></TabsContent>}
              {hasAI && <TabsContent value="ai" className="mt-0"><AiPane scenarioId={s.id} /></TabsContent>}
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Setup Tab ── */
function SetupPane({ scenarioId }: { scenarioId: string }) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const [blocks, setBlocks] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("scenario_setup_blocks").select("*").eq("scenario_id", scenarioId).order("sort_order")
      .then(({ data }) => data && setBlocks(data));
  }, [scenarioId]);

  if (!blocks.length) return <p className="text-xs text-muted-foreground p-2">{lang === "RU" ? "Нет данных" : "No data"}</p>;

  return (
    <div className="space-y-3 pr-1">
      {blocks.map(b => {
        const blockTitle = lang === "RU" ? (b.title_ru || b.title_en) : b.title_en;
        const content = lang === "RU" ? (b.content_ru || b.content_en) : b.content_en;
        return (
          <div key={b.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold text-foreground">{blockTitle}</p>
              {b.player_count && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {b.player_count}P
                </span>
              )}
            </div>
            {content && (
              <p className="text-xs text-muted-foreground whitespace-pre-line">
                <GlyphHtml text={content} glyphs={glyphs} />
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Map Tab ── */
function MapPane({ scenarioId }: { scenarioId: string }) {
  const { lang } = useLang();
  const [variants, setVariants] = useState<any[]>([]);
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);
  useEffect(() => {
    supabase.from("scenario_map_variants").select("*").eq("scenario_id", scenarioId).order("sort_order")
      .then(({ data }) => data && setVariants(data));
  }, [scenarioId]);

  if (!variants.length) return <p className="text-xs text-muted-foreground p-2">{lang === "RU" ? "Нет данных" : "No data"}</p>;

  return (
    <div className="space-y-3 pr-1">
      {variants.map(v => {
        const label = lang === "RU" ? (v.variant_label_ru || v.variant_label_en) : v.variant_label_en;
        const setupText = lang === "RU" ? (v.map_setup_text_ru || v.map_setup_text_en) : v.map_setup_text_en;
        const notes = lang === "RU" ? (v.layout_notes_ru || v.layout_notes_en) : v.layout_notes_en;
        const tiles = v.tile_counts && typeof v.tile_counts === "object" ? Object.entries(v.tile_counts as Record<string, unknown>) : [];
        return (
          <div key={v.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 mb-1">
              <MapIcon size={14} className="text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">{label || `${v.player_count}P`}</p>
            </div>
            {v.map_image && (
              <img
                src={`${SUPABASE_URL}/storage/v1/object/public/component-media/scenario-maps/${v.map_image}`}
                alt="map"
                className="w-full rounded-lg border border-border mb-2 cursor-zoom-in object-contain max-h-64"
                onClick={() => setZoomedImg(`${SUPABASE_URL}/storage/v1/object/public/component-media/scenario-maps/${v.map_image}`)}
              />
            )}
            {setupText && <p className="text-xs text-muted-foreground whitespace-pre-line mb-2">{setupText}</p>}
            {tiles.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold text-foreground mb-1">{lang === "RU" ? "Тайлы" : "Tiles"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {tiles.map(([k, v2]) => (
                    <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {k.replace(/_/g, " ")}: {String(v2)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {notes && <p className="text-[10px] text-muted-foreground italic">{notes}</p>}
          </div>
        );
      })}
      {zoomedImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomedImg(null)}
        >
          <img
            src={zoomedImg}
            alt="map zoomed"
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
}

/* ── Events Tab ── */
function EventsPane({ scenarioId }: { scenarioId: string }) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("scenario_timed_events").select("*").eq("scenario_id", scenarioId).order("sort_order")
      .then(({ data }) => data && setEvents(data));
  }, [scenarioId]);

  if (!events.length) return <p className="text-xs text-muted-foreground p-2">{lang === "RU" ? "Нет событий" : "No events"}</p>;

  // Group by trigger_type
  const groups = new Map<string, any[]>();
  events.forEach(e => {
    const key = e.trigger_type || "custom";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  });

  return (
    <div className="space-y-3 pr-1">
      {Array.from(groups.entries()).map(([type, items]) => (
        <div key={type}>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
            {(lang === "RU" ? TRIGGER_LABELS_RU[type] : TRIGGER_LABELS_EN[type]) || type}
          </p>
          <div className="space-y-2">
            {items.map(e => {
              const label = lang === "RU" ? (e.trigger_label_ru || e.trigger_label_en) : e.trigger_label_en;
              const condition = lang === "RU" ? (e.condition_ru || e.condition_en) : e.condition_en;
              const effect = lang === "RU" ? (e.effect_ru || e.effect_en) : e.effect_en;
              return (
                <div key={e.id} className="rounded-lg border border-border p-3">
                  {label && <p className="text-xs font-semibold text-foreground mb-0.5">{label}</p>}
                  {condition && <p className="text-[10px] text-muted-foreground italic mb-1">{condition}</p>}
                  {effect && (
                    <p className="text-xs text-muted-foreground">
                      <GlyphHtml text={effect} glyphs={glyphs} />
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Story Tab ── */
function StoryPane({ scenarioId }: { scenarioId: string }) {
  const { lang } = useLang();
  const [sections, setSections] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("scenario_story_sections").select("*").eq("scenario_id", scenarioId).order("sort_order")
      .then(({ data }) => data && setSections(data));
  }, [scenarioId]);

  if (!sections.length) return <p className="text-xs text-muted-foreground p-2">{lang === "RU" ? "Нет сюжета" : "No story"}</p>;

  return (
    <div className="space-y-4 pr-1">
      {sections.map(sec => {
        const sTitle = lang === "RU" ? (sec.title_ru || sec.title_en) : sec.title_en;
        const trigger = lang === "RU" ? (sec.trigger_text_ru || sec.trigger_text_en) : sec.trigger_text_en;
        const content = lang === "RU" ? (sec.content_ru || sec.content_en) : sec.content_en;
        return (
          <div key={sec.id}>
            <p className="text-xs font-bold text-foreground mb-0.5">{sTitle}</p>
            {trigger && <p className="text-[10px] text-muted-foreground italic mb-1">{trigger}</p>}
            {content && (
              <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                {content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── AI Setup Tab ── */
function AiPane({ scenarioId }: { scenarioId: string }) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const [setup, setSetup] = useState<any | null>(null);
  useEffect(() => {
    supabase.from("scenario_ai_setup").select("*").eq("scenario_id", scenarioId).single()
      .then(({ data }) => data && setSetup(data));
  }, [scenarioId]);

  if (!setup) return <p className="text-xs text-muted-foreground p-2">{lang === "RU" ? "Нет данных" : "No data"}</p>;

  const faction = lang === "RU" ? (setup.ai_faction_ru || setup.ai_faction_en) : setup.ai_faction_en;
  const specialSetup = lang === "RU" ? (setup.special_setup_ru || setup.special_setup_en) : setup.special_setup_en;
  const notes = lang === "RU" ? (setup.notes_ru || setup.notes_en) : setup.notes_en;
  const heroes = (lang === "RU" ? setup.enemy_heroes_ru : null) || setup.enemy_heroes_en;
  const armies = (lang === "RU" ? setup.enemy_armies_ru : null) || setup.enemy_armies_en;
  const decks = (lang === "RU" ? setup.enemy_decks_ru : null) || setup.enemy_decks_en;
  const spellDeck = (lang === "RU" ? setup.enemy_spell_deck_ru : null) || setup.enemy_spell_deck_en;

  return (
    <div className="space-y-3 pr-1">
      {faction && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">{lang === "RU" ? "Фракция ИИ" : "AI Faction"}</p>
          <p className="text-xs text-foreground font-semibold">{faction}</p>
        </div>
      )}

      {specialSetup && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">{lang === "RU" ? "Спец. настройка" : "Special Setup"}</p>
          <p className="text-xs text-muted-foreground whitespace-pre-line">
            <GlyphHtml text={specialSetup} glyphs={glyphs} />
          </p>
        </div>
      )}

      {Array.isArray(heroes) && heroes.length > 0 && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">{lang === "RU" ? "Герои врага" : "Enemy Heroes"}</p>
          <div className="space-y-1">
            {heroes.map((h: any, i: number) => (
              <div key={i} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{h.name || h.hero}</span>
                {h.role && <span className="ml-1">— {h.role}</span>}
                {h.placement && <span className="ml-1 text-[10px]">({h.placement})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(armies) && armies.length > 0 && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">{lang === "RU" ? "Армии врага" : "Enemy Armies"}</p>
          <div className="space-y-2">
            {armies.map((a: any, i: number) => (
              <div key={i}>
                <p className="text-xs font-medium text-foreground">{a.hero}</p>
                {Array.isArray(a.units) && (
                  <ul className="list-disc list-inside text-[10px] text-muted-foreground ml-1">
                    {a.units.map((u: string, j: number) => <li key={j}>{u}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(decks) && decks.length > 0 && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">{lang === "RU" ? "Колоды врага" : "Enemy Decks"}</p>
          <div className="space-y-2">
            {decks.map((d: any, i: number) => (
              <div key={i}>
                <p className="text-xs font-medium text-foreground">{d.hero}</p>
                {Array.isArray(d.cards) && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {d.cards.map((c: any, j: number) => (
                      <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {c.count}× {c.type}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(spellDeck) && spellDeck.length > 0 && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">{lang === "RU" ? "Заклинания врага" : "Enemy Spell Deck"}</p>
          {spellDeck.map((sd: any, i: number) => (
            <div key={i}>
              {sd.hero && <p className="text-xs font-medium text-foreground">{sd.hero}</p>}
              {sd.shared && <p className="text-[10px] text-muted-foreground italic">{lang === "RU" ? "Общая колода" : "Shared deck"}</p>}
              {Array.isArray(sd.spells) && sd.spells.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {sd.spells.map((sp: any, j: number) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {sp.count ? `${sp.count}× ` : ""}{sp.name || sp}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {notes && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">{lang === "RU" ? "Заметки" : "Notes"}</p>
          <p className="text-xs text-muted-foreground whitespace-pre-line">{notes}</p>
        </div>
      )}
    </div>
  );
}
