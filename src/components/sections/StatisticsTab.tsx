import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;

interface Statistic {
  id: string;
  name_en: string | null;
  name_ru: string | null;
  stat_type: string | null;
  card_type: string | null;
  effect_en: string | null;
  effect_en_expert: string | null;
  notes_en: string | null;
  notes_ru: string | null;
  image: string | null;
  sort_order: number | null;
}

const STAT_COLORS: Record<string, string> = {
  attack: "bg-red-500/10 text-red-600",
  defense: "bg-green-500/10 text-green-600",
  power: "bg-purple-500/10 text-purple-600",
  knowledge: "bg-blue-500/10 text-blue-600",
};

const CARD_TYPE_BADGE: Record<string, string> = {
  regular: "bg-muted text-muted-foreground",
  empowered: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

interface Props { searchQuery?: string; }

export default function StatisticsTab({ searchQuery = "" }: Props) {
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

  const statTypes = ["all", ...Array.from(new Set(items.map(i => i.stat_type).filter(Boolean))) as string[]];
  const afterFilter = filterStat === "all" ? items : items.filter(i => i.stat_type === filterStat);
  const q = searchQuery.toLowerCase();
  const filtered = searchQuery
    ? afterFilter.filter(i => {
        const fields = [i.name_en, i.name_ru, i.effect_en];
        return fields.some(f => f && f.toLowerCase().includes(q));
      })
    : afterFilter;

  if (!loaded) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground text-sm">{lang === "RU" ? "Загрузка…" : "Loading…"}</p></div>;

  const name = (i: Statistic) => lang === "RU" ? (i.name_ru || i.name_en || "") : (i.name_en || "");

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
          {filtered.length === 0 && searchQuery ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <Search size={32} />
              <p className="text-sm">{lang === "RU" ? "Ничего не найдено" : "Nothing found"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((item) => {
                const imgSrc = item.image ? `${STORAGE}/statistics/${item.image}` : null;
                return (
                  <button key={item.id} onClick={() => setSelected(item)}
                    className="flex flex-col rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary transition-colors">
                    <div className="aspect-square w-full bg-muted flex items-center justify-center overflow-hidden relative">
                      {imgSrc
                        ? <img src={imgSrc} alt={item.name_en || ""} className="w-full h-full object-cover" />
                        : <p className="text-[10px] text-muted-foreground text-center px-1">{item.name_en}</p>
                      }
                      {item.stat_type && (
                        <span className={`absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize ${STAT_COLORS[item.stat_type] || "bg-muted text-muted-foreground"}`}>
                          {item.stat_type}
                        </span>
                      )}
                      {item.card_type && (
                        <span className={`absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize ${CARD_TYPE_BADGE[item.card_type] || "bg-muted text-muted-foreground"}`}>
                          {item.card_type === "regular" ? "Regular" : "Empowered"}
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-foreground truncate">{name(item)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[90dvh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{selected ? name(selected) : ""}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="overflow-y-auto flex-1 pr-1 space-y-3">
              {selected.image && <img src={`${STORAGE}/statistics/${selected.image}`} alt={selected.name_en || ""} className="max-h-[40vh] w-auto mx-auto rounded-lg object-contain" />}
              <div className="flex gap-2 flex-wrap">
                {selected.stat_type && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${STAT_COLORS[selected.stat_type] || "bg-muted text-muted-foreground"}`}>{selected.stat_type}</span>}
                {selected.card_type && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CARD_TYPE_BADGE[selected.card_type] || "bg-muted text-muted-foreground"}`}>{selected.card_type === "regular" ? "Regular" : "Empowered"}</span>}
              </div>
              {selected.effect_en && (
                <div>
                  <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p>
                  <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderGlyphs(selected.effect_en, glyphs) }} />
                </div>
              )}
              {selected.effect_en_expert && (
                <div>
                  <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Экспертный эффект" : "Expert Effect"}</p>
                  <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderGlyphs(selected.effect_en_expert, glyphs) }} />
                </div>
              )}
              {(lang === "RU" ? selected.notes_ru : selected.notes_en) && (
                <div>
                  <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Заметки" : "Notes"}</p>
                  <p className="text-xs text-muted-foreground">{lang === "RU" ? selected.notes_ru : selected.notes_en}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
