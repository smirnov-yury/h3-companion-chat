import { useState, useEffect } from "react";
import { Search, X, Swords, Shield, Wand2, BookOpen, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { Dialog } from "@/components/ui/dialog";
import { CardDialogContent } from "@/components/ui/card-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState, SkeletonGrid } from "@/components/ui/empty-state";
import { useEntityLinkHandler, entityLinkUrl } from "@/hooks/useEntityLinkHandler";
import { useEntityLinks } from "@/hooks/useEntityLinks";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;

interface Hero {
  id: string;
  name_en: string;
  name_ru: string | null;
  town: string | null;
  class_en: string | null;
  class_ru: string | null;
  ability_id: string | null;
  specialty_en: string | null;
  specialty_ru: string | null;
  attack: number | null;
  defense: number | null;
  power: number | null;
  knowledge: number | null;
  specialty_levels: SpecialtyLevel[] | null;
  notes_en: string | null;
  notes_ru: string | null;
  image: string | null;
  sort_order: number | null;
}

interface SpecialtyLevel {
  level: string;
  image?: string;
  effect_en?: string;
  effect_ru?: string;
}

function hasPortrait(image: string | null): boolean {
  return !!image && image.startsWith("heroes-") && image !== "player-deck-back.webp";
}

const FACTION_BADGE: Record<string, string> = {
  Castle: "bg-blue-500/20 text-blue-300 border-blue-400/40",
  Necropolis: "bg-violet-500/20 text-violet-300 border-violet-400/40",
  Dungeon: "bg-red-600/20 text-red-300 border-red-400/40",
  Tower: "bg-cyan-500/20 text-cyan-300 border-cyan-400/40",
  Fortress: "bg-emerald-700/20 text-emerald-300 border-emerald-400/40",
  Rampart: "bg-green-500/20 text-green-300 border-green-400/40",
  Inferno: "bg-orange-600/20 text-orange-300 border-orange-400/40",
  Conflux: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/40",
  Stronghold: "bg-amber-700/20 text-amber-300 border-amber-400/40",
  Cove: "bg-teal-500/20 text-teal-300 border-teal-400/40",
};

const FACTION_SILHOUETTE_BG: Record<string, string> = {
  Castle: "bg-blue-900/40",
  Necropolis: "bg-violet-900/40",
  Dungeon: "bg-red-900/40",
  Tower: "bg-cyan-900/40",
  Fortress: "bg-emerald-900/40",
  Rampart: "bg-green-900/40",
  Inferno: "bg-orange-900/40",
  Conflux: "bg-fuchsia-900/40",
  Stronghold: "bg-amber-900/40",
  Cove: "bg-teal-900/40",
};

function FactionBadge({ town }: { town: string }) {
  const cls = FACTION_BADGE[town] || "bg-muted text-muted-foreground border-border";
  const matchKey = Object.keys(FACTION_BADGE).find(k => k.toLowerCase() === town.toLowerCase());
  const colorCls = matchKey ? FACTION_BADGE[matchKey] : cls;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${colorCls}`}>
      {town}
    </span>
  );
}

function HeroSilhouette({ town, className = "" }: { town: string | null; className?: string }) {
  const matchKey = town ? Object.keys(FACTION_SILHOUETTE_BG).find(k => k.toLowerCase() === town.toLowerCase()) : undefined;
  const bg = matchKey ? FACTION_SILHOUETTE_BG[matchKey] : "bg-muted";
  return (
    <div className={`w-full h-full flex items-center justify-center ${bg} ${className}`}>
      <User className="w-16 h-16 text-white/30" />
    </div>
  );
}

function AbilityChip({ abilityId }: { abilityId: string }) {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [name, setName] = useState<{ en: string; ru: string | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("abilities")
      .select("name_en, name_ru")
      .eq("id", abilityId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setName({ en: data.name_en, ru: data.name_ru });
      });
    return () => { cancelled = true; };
  }, [abilityId]);
  const label = (lang === "RU" ? name?.ru || name?.en : name?.en) || abilityId;
  const url = entityLinkUrl("ability", abilityId);
  return (
    <button
      onClick={() => url && navigate(url)}
      disabled={!url}
      className="text-[11px] px-2 py-0.5 rounded-full border border-[#E1BB3A] text-[#E1BB3A] bg-[#E1BB3A]/10 hover:bg-[#E1BB3A]/20 transition-colors disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function HeroLinksRow({ heroId, abilityId, lang }: { heroId: string; abilityId: string | null; lang: "EN" | "RU" }) {
  const navigate = useNavigate();
  const { links } = useEntityLinks("hero", heroId);
  if (!abilityId && links.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      <span className="text-[#E1BB3A] text-sm shrink-0">→</span>
      {abilityId && <AbilityChip abilityId={abilityId} />}
      {links.map((l) => {
        const name = (lang === "RU" ? l.name_ru || l.name_en : l.name_en) || l.to_id;
        const url = entityLinkUrl(l.to_type, l.to_id);
        return (
          <button
            key={`${l.to_type}-${l.to_id}`}
            onClick={() => url && navigate(url)}
            disabled={!url}
            className="text-[11px] px-2 py-0.5 rounded-full border border-[#E1BB3A] text-[#E1BB3A] bg-[#E1BB3A]/10 hover:bg-[#E1BB3A]/20 transition-colors disabled:opacity-50"
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}

interface HeroesTabProps {
  initialFilter?: string;
  initialCardId?: string;
  initialSearch?: string;
  onFilterChange?: (filterValue: string | null) => void;
  onCardOpen?: (cardId: string, currentFilter?: string | null) => void;
  onCardClose?: (currentFilter?: string | null) => void;
}

export default function HeroesTab({ initialFilter, initialCardId, initialSearch, onFilterChange, onCardOpen, onCardClose }: HeroesTabProps = {}) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const handleEntityClick = useEntityLinkHandler();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [faction, setFaction] = useState("all");
  const [searchQuery, setSearchQuery] = useState(initialSearch ?? "");
  const [selected, setSelected] = useState<Hero | null>(null);
  const [specialtyTab, setSpecialtyTab] = useState(0);

  useEffect(() => {
    supabase.from("heroes").select("*").order("sort_order").then(({ data }) => {
      setHeroes((data as unknown as Hero[]) ?? []);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    const towns = Array.from(new Set(heroes.map(h => h.town).filter(Boolean) as string[]));
    let candidate = initialFilter;
    if (!candidate && initialCardId && !heroes.some(h => h.id === initialCardId)) {
      candidate = initialCardId;
    }
    if (!candidate) { setFaction("all"); return; }
    const match = towns.find(t => t.toLowerCase().replace(/\s+/g, "-") === candidate);
    setFaction(match ?? "all");
  }, [initialFilter, initialCardId, heroes]);

  const setFactionAndUrl = (next: string) => {
    setFaction(next);
    onFilterChange?.(next === "all" ? null : next);
  };

  useEffect(() => {
    if (!loaded || !initialCardId) return;
    const found = heroes.find(h => h.id === initialCardId);
    if (found) { setSelected(found); setSpecialtyTab(0); }
  }, [loaded, initialCardId, heroes]);

  const openCard = (h: Hero) => { setSelected(h); setSpecialtyTab(0); onCardOpen?.(h.id, faction === "all" ? null : faction); };
  const closeCard = () => { setSelected(null); onCardClose?.(faction === "all" ? null : faction); };

  const hasFilters = faction !== "all" || !!searchQuery;
  const resetFilters = () => { setFactionAndUrl("all"); setSearchQuery(""); };

  const towns = Array.from(new Set(heroes.map(h => h.town).filter(Boolean) as string[])).sort();
  const q = searchQuery.toLowerCase();
  const filtered = heroes.filter(h => {
    if (faction !== "all" && h.town !== faction) return false;
    if (q) {
      const n = lang === "RU" ? (h.name_ru || h.name_en) : h.name_en;
      if (!n.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const name = (h: Hero) => lang === "RU" && h.name_ru ? h.name_ru : h.name_en;
  const cls = (h: Hero) => lang === "RU" && h.class_ru ? h.class_ru : h.class_en;
  const specialty = (h: Hero) => lang === "RU" && h.specialty_ru ? h.specialty_ru : h.specialty_en;
  const notes = (h: Hero) => lang === "RU" && h.notes_ru ? h.notes_ru : h.notes_en;

  const levels = (h: Hero): SpecialtyLevel[] => {
    if (!h.specialty_levels) return [];
    if (Array.isArray(h.specialty_levels)) return h.specialty_levels;
    return [];
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-3 pt-3 pb-2 shrink-0 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === "RU" ? "Поиск героев…" : "Search heroes…"}
            className="w-full bg-muted rounded-lg pl-8 pr-8 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFactionAndUrl("all")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              faction === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {lang === "RU" ? "Все" : "All"}
          </button>
          {towns.map(t => (
            <button
              key={t}
              onClick={() => setFactionAndUrl(t)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap capitalize ${
                faction === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pb-3 flex-1">
        {!loaded ? (
          <SkeletonGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3" />
        ) : filtered.length === 0 ? (
          <EmptyState onReset={hasFilters ? resetFilters : undefined} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {filtered.map(h => (
              <button key={h.id} onClick={() => openCard(h)} className="flex flex-col rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer">
                <div className="relative aspect-square bg-muted">
                  {hasPortrait(h.image) ? (
                    <img
                      src={`${STORAGE}/heroes/${h.image}`}
                      alt={name(h)}
                      className="w-full h-full object-cover object-left"
                    />
                  ) : (
                    <HeroSilhouette town={h.town} />
                  )}

                  <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
                    {h.town && <FactionBadge town={h.town} />}
                    {h.class_en && (() => {
                      const isMagic = h.class_en.includes('<magic>');
                      const heroType = isMagic ? 'Magic' : 'Might';
                      const rawClass = (lang === "RU" && h.class_ru ? h.class_ru : h.class_en).replace(/<magic>|<might>/g, '').trim();
                      return (
                        <>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full backdrop-blur-sm text-white ${isMagic ? 'bg-blue-600/80' : 'bg-red-700/80'}`}>
                            {heroType}
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full backdrop-blur-sm bg-black/50 text-white"
                            dangerouslySetInnerHTML={{ __html: renderGlyphs(rawClass, glyphs) }}
                          />
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-foreground truncate">{name(h)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={open => { if (!open) closeCard(); }} >
        {selected && (
          <CardDialogContent className="w-[95vw] max-w-md">
            {/* FIXED HEADER */}
            <div className="shrink-0 px-4 pt-4 pb-2">
              {hasPortrait(selected.image) ? (
                <img
                  src={`${STORAGE}/heroes/${selected.image}`}
                  alt={name(selected)}
                  className="max-h-[200px] object-contain mx-auto"
                />
              ) : (
                <div className="max-h-[200px] h-[200px] aspect-square mx-auto">
                  <HeroSilhouette town={selected.town} className="rounded-lg" />
                </div>
              )}
              <div className="flex items-center justify-center gap-2 flex-wrap mt-2 mb-1 px-4">
                <h2 className="text-lg font-bold text-foreground">{name(selected)}</h2>
                {cls(selected) && (
                  <span
                    className="text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: renderGlyphs(cls(selected), glyphs) }}
                  />
                )}
                {selected.town && <FactionBadge town={selected.town} />}
              </div>
            </div>

            {/* TABS */}
            <Tabs defaultValue="info" className="flex-1 min-h-0 flex flex-col">
              <TabsList className="mx-4 shrink-0 grid grid-cols-2">
                <TabsTrigger value="info">{lang === "RU" ? "Инфо" : "Info"}</TabsTrigger>
                <TabsTrigger value="specialty">{lang === "RU" ? "Специальность" : "Specialty"}</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col outline-none mt-0">
                <div className="relative flex-1 min-h-0">
                  <div onClick={handleEntityClick} className="h-full overflow-y-auto overscroll-contain px-4 py-3 space-y-3" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <Swords className="w-4 h-4 mx-auto mb-1 text-red-400" />
                        <div className="text-sm font-bold text-foreground">{selected.attack ?? "–"}</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <Shield className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                        <div className="text-sm font-bold text-foreground">{selected.defense ?? "–"}</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <Wand2 className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                        <div className="text-sm font-bold text-foreground">{selected.power ?? "–"}</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <BookOpen className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                        <div className="text-sm font-bold text-foreground">{selected.knowledge ?? "–"}</div>
                      </div>
                    </div>

                    {notes(selected) && (
                      <div className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderGlyphs(notes(selected), glyphs) }} />
                    )}

                    <HeroLinksRow heroId={selected.id} abilityId={selected.ability_id} lang={lang as "EN" | "RU"} />
                  </div>
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent" />
                </div>
              </TabsContent>

              <TabsContent value="specialty" className="flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col outline-none mt-0">
                <div className="relative flex-1 min-h-0">
                  <div onClick={handleEntityClick} className="h-full overflow-y-auto overscroll-contain px-4 py-3 space-y-3" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}>
                    {specialty(selected) && (
                      <p
                        className="text-sm font-bold text-foreground text-center"
                        dangerouslySetInnerHTML={{ __html: renderGlyphs(specialty(selected), glyphs) }}
                      />
                    )}

                    {levels(selected).length > 0 && (
                      <div>
                        {levels(selected).length > 1 && (
                          <div className="flex gap-1.5 mb-2 justify-center">
                            {levels(selected).map((lvl, i) => (
                              <button
                                key={i}
                                onClick={() => setSpecialtyTab(i)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  specialtyTab === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                                }`}
                              >
                                {lvl.level}
                              </button>
                            ))}
                          </div>
                        )}
                        {(() => {
                          const idx = levels(selected).length > 1 ? specialtyTab : 0;
                          const lvl = levels(selected)[idx];
                          if (!lvl) return null;
                          const effect = lang === "RU" ? lvl.effect_ru : lvl.effect_en;
                          return (
                            <div key={idx} className="bg-muted rounded-lg p-3 space-y-2 transition-opacity duration-200 opacity-100">
                              {lvl.image && (
                                <img
                                  src={`${STORAGE}/heroes/${lvl.image}`}
                                  alt={lvl.level}
                                  className="w-full object-contain"
                                  onError={e => (e.currentTarget.style.display = "none")}
                                />
                              )}
                              {effect && (
                                <div className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderGlyphs(effect, glyphs) }} />
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent" />
                </div>
              </TabsContent>
            </Tabs>
          </CardDialogContent>
        )}
      </Dialog>
    </div>
  );
}
