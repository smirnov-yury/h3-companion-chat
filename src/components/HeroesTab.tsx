import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, SkeletonGrid } from "@/components/ui/empty-state";
import { useEntityLinkHandler } from "@/hooks/useEntityLinkHandler";
import TagBadges from "@/components/TagBadges";
import SeeAlso from "@/components/SeeAlso";

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
  return !!image && image.startsWith("heroes-");
}

function heroInitials(name: string): string {
  return name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
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

  // Sync URL filter slug → internal faction. Compare against towns lowercased+hyphenated.
  // Fall back to initialCardId in the ambiguous single-segment case, but only if it
  // doesn't match a hero id (otherwise it's a card deep link, not a filter).
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

  // Auto-open card from URL
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

  const stats = (h: Hero) => [
    { label: "ATK", value: h.attack },
    { label: "DEF", value: h.defense },
    { label: "PWR", value: h.power },
    { label: "KNW", value: h.knowledge },
  ];

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
          <SkeletonGrid className="grid grid-cols-2 lg:grid-cols-4 gap-3" />
        ) : filtered.length === 0 ? (
          <EmptyState onReset={hasFilters ? resetFilters : undefined} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {filtered.map(h => (
              <button key={h.id} onClick={() => openCard(h)} className="flex flex-col rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer">
                <div className="relative aspect-square bg-muted">
                  {hasPortrait(h.image) ? (
                    <img src={`${STORAGE}/heroes/${h.image}`} alt={name(h)} className="w-full h-full object-cover object-left" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-muted-foreground/40">{heroInitials(h.name_en)}</span>
                    </div>
                  )}
                  {h.class_en && (() => {
                    const isMagic = h.class_en.includes('<magic>');
                    const heroType = isMagic ? 'Magic' : 'Might';
                    const rawClass = (lang === "RU" && h.class_ru ? h.class_ru : h.class_en).replace(/<magic>|<might>/g, '').trim();
                    return (
                      <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full backdrop-blur-sm text-white ${isMagic ? 'bg-blue-600/80' : 'bg-red-700/80'}`}>
                          {heroType}
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full backdrop-blur-sm bg-black/50 text-white"
                          dangerouslySetInnerHTML={{ __html: renderGlyphs(rawClass, glyphs) }}
                        />
                      </div>
                    );
                  })()}
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-foreground truncate">{name(h)}</p>
                  {h.town && <p className="text-[10px] text-muted-foreground capitalize">{h.town}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={open => { if (!open) closeCard(); }} >
        {selected && (
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogTitle className="sr-only">{name(selected)}</DialogTitle>
            {hasPortrait(selected.image) ? (
              <img src={`${STORAGE}/heroes/${selected.image}`} alt={name(selected)} className="w-full rounded-lg object-contain" />
            ) : (
              <div className="w-full aspect-[3/4] bg-muted-foreground/10 flex items-center justify-center rounded-lg">
                <span className="text-4xl font-bold text-muted-foreground/40">{heroInitials(selected.name_en)}</span>
              </div>
            )}

            <TagBadges entityType="hero" entityId={selected.id} lang={lang as "EN" | "RU"} />

            <div onClick={handleEntityClick} className="space-y-3">
              <p className="text-lg font-semibold text-foreground">{name(selected)}</p>
              {cls(selected) && <p className="text-sm text-muted-foreground -mt-3" dangerouslySetInnerHTML={{ __html: renderGlyphs(cls(selected), glyphs) }} />}

              <div className="flex gap-2">
                {stats(selected).map(s => (
                  <div key={s.label} className="flex-1 bg-muted rounded text-center text-xs py-1.5">
                    <span className="text-muted-foreground">{s.label}</span>{" "}
                    <span className="font-bold text-foreground">{s.value ?? "–"}</span>
                  </div>
                ))}
              </div>

              {specialty(selected) && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">{lang === "RU" ? "Специальность" : "Specialty"}</p>
                  <div className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderGlyphs(specialty(selected), glyphs) }} />
                </div>
              )}

              {levels(selected).length > 0 && (
                <div>
                  {levels(selected).length > 1 && (
                    <div className="flex gap-1.5 mb-2">
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
                    const lvl = levels(selected)[levels(selected).length > 1 ? specialtyTab : 0];
                    if (!lvl) return null;
                    return (
                      <div className="bg-muted rounded-lg p-3">
                        {lvl.image && (
                          <img
                            src={`${STORAGE}/heroes/${lvl.image}`}
                            alt={lvl.level}
                            className="w-full object-contain"
                            onError={e => (e.currentTarget.style.display = "none")}
                          />
                        )}
                        {(lang === "RU" && lvl.effect_ru ? lvl.effect_ru : lvl.effect_en) && (
                          <div className="text-xs text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" && lvl.effect_ru ? lvl.effect_ru : lvl.effect_en, glyphs) }} />
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {notes(selected) && (
                <div className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderGlyphs(notes(selected), glyphs) }} />
              )}
            </div>

            <SeeAlso entityType="hero" entityId={selected.id} lang={lang as "EN" | "RU"} />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
