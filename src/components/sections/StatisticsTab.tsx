import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { Dialog } from "@/components/ui/dialog";
import { CardDialogContent } from "@/components/ui/card-dialog";
import { EmptyState, SkeletonGrid } from "@/components/ui/empty-state";
import { useEntityLinkHandler } from "@/hooks/useEntityLinkHandler";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;

interface Statistic {
  id: string;
  name_en: string | null;
  name_ru: string | null;
  stat_type: string | null;
  card_type: string | null;
  effect_en: string | null;
  effect_ru: string | null;
  effect_en_expert: string | null;
  effect_en_expert_ru: string | null;
  notes_en: string | null;
  notes_ru: string | null;
  image: string | null;
  sort_order: number | null;
}

const STAT_COLORS: Record<string, string> = {
  attack:    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  defense:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  power:     "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  knowledge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const CARD_TYPE_BADGE: Record<string, string> = {
  regular:   "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  empowered: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

function cardTypeLabel(ct: string, lang: "EN" | "RU") {
  if (ct === "empowered") return lang === "RU" ? "✦ Усиленный" : "✦ Empowered";
  return lang === "RU" ? "Обычный" : "Regular";
}

function statTypeLabel(st: string, lang: "EN" | "RU") {
  if (lang !== "RU") return st.charAt(0).toUpperCase() + st.slice(1);
  const map: Record<string, string> = {
    attack: "Атака",
    defense: "Защита",
    power: "Сила",
    knowledge: "Знание",
  };
  return map[st] || st;
}

interface Props {
  searchQuery?: string;
  initialFilter?: string;
  initialCardId?: string;
  onFilterChange?: (filterValue: string | null) => void;
  onCardOpen?: (currentFilter: string | null, cardId: string) => void;
  onCardClose?: (currentFilter: string | null) => void;
}

export default function StatisticsTab({ searchQuery = "", initialCardId, onCardOpen, onCardClose }: Props) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const [items, setItems] = useState<Statistic[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Statistic | null>(null);
  const [filterStat, setFilterStat] = useState("all");

  useEffect(() => {
    supabase.from("statistics").select("*").order("sort_order").then(({ data }) => {
      if (data) setItems(data as Statistic[]);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded || !initialCardId) return;
    const found = items.find(i => i.id === initialCardId);
    if (found) setSelected(found);
  }, [loaded, initialCardId, items]);

  const currentFilter = filterStat === "all" ? null : filterStat;
  const openCard = (i: Statistic) => { setSelected(i); onCardOpen?.(currentFilter, i.id); };
  const closeCard = () => { setSelected(null); onCardClose?.(currentFilter); };

  const statTypes = ["all", ...Array.from(new Set(items.map(i => i.stat_type).filter(Boolean))) as string[]];
  const afterFilter = filterStat === "all" ? items : items.filter(i => i.stat_type === filterStat);
  const q = searchQuery.toLowerCase();
  const filtered = searchQuery
    ? afterFilter.filter(i => {
        const fields = [i.name_en, i.name_ru, i.effect_en];
        return fields.some(f => f && f.toLowerCase().includes(q));
      })
    : afterFilter;

  const name = (i: Statistic) => lang === "RU" ? (i.name_ru || i.name_en || "") : (i.name_en || "");
  const hasFilters = filterStat !== "all" || !!searchQuery;
  const resetFilters = () => setFilterStat("all");

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex gap-1.5 overflow-x-auto px-3 pt-3 pb-2 scrollbar-none shrink-0">
          {statTypes.map(s => (
            <button key={s} onClick={() => setFilterStat(s)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors capitalize ${filterStat === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {s === "all" ? (lang === "RU" ? "Все" : "All") : s}
            </button>
          ))}
        </div>
        <div className="p-3 pt-0 overflow-y-auto flex-1">
          {!loaded ? (
            <SkeletonGrid />
          ) : filtered.length === 0 ? (
            <EmptyState onReset={hasFilters ? resetFilters : undefined} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {filtered.map((item) => {
                const imgSrc = item.image ? `${STORAGE}/statistics/${item.image}` : null;
                return (
                  <div key={item.id} onClick={() => openCard(item)}
                    className="relative aspect-[5/7] bg-muted rounded-lg overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
                    {imgSrc
                      ? <img src={imgSrc} alt={item.name_en || ""} className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                      : <div className="absolute inset-0 flex items-center justify-center"><p className="text-[10px] text-muted-foreground text-center px-1">{item.name_en}</p></div>
                    }
                    {(item.stat_type || item.card_type) && (
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {item.stat_type && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAT_COLORS[item.stat_type] || "bg-muted text-muted-foreground"}`}>
                            {statTypeLabel(item.stat_type, lang as "EN" | "RU")}
                          </span>
                        )}
                        {item.card_type && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CARD_TYPE_BADGE[item.card_type] || "bg-muted text-muted-foreground"}`}>
                            {cardTypeLabel(item.card_type, lang as "EN" | "RU")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && closeCard()}>
        <CardDialogContent>
          {selected && (
            <>
              {selected.image && (
                <div className="relative w-[85%] mx-auto pt-4 mb-0 shrink-0">
                  <img src={`${STORAGE}/statistics/${selected.image}`} alt={selected.name_en || ""} className="w-full max-h-[280px] object-contain rounded-lg shadow-lg" />
                  {(selected.stat_type || selected.card_type) && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {selected.stat_type && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STAT_COLORS[selected.stat_type] || "bg-muted text-muted-foreground"}`}>
                          {statTypeLabel(selected.stat_type, lang as "EN" | "RU")}
                        </span>
                      )}
                      {selected.card_type && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${CARD_TYPE_BADGE[selected.card_type] || "bg-muted text-muted-foreground"}`}>
                          {cardTypeLabel(selected.card_type, lang as "EN" | "RU")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                <h2 className="text-lg font-semibold leading-tight pr-8">{name(selected)}</h2>
                {selected.effect_en && (
                  <div>
                    <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? (selected.effect_ru || selected.effect_en) : selected.effect_en, glyphs) }} />
                  </div>
                )}
                {selected.effect_en_expert && (
                  <div>
                    <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Усиленный" : "Empowered"}</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? (selected.effect_en_expert_ru || selected.effect_en_expert) : selected.effect_en_expert, glyphs) }} />
                  </div>
                )}
                {(lang === "RU" ? (selected.notes_ru || selected.notes_en) : selected.notes_en) && (
                  <div>
                    <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Заметки" : "Notes"}</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? (selected.notes_ru || selected.notes_en) : selected.notes_en, glyphs) }} />
                  </div>
                )}
              </div>
            </>
          )}
        </CardDialogContent>
      </Dialog>
    </>
  );
}
