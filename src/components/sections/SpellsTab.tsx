import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { Dialog } from "@/components/ui/dialog";
import { CardDialogContent } from "@/components/ui/card-dialog";
import { EmptyState, SkeletonGrid } from "@/components/ui/empty-state";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;

interface Spell {
  id: string;
  name_en: string;
  name_ru: string | null;
  school: string | null;
  level: string | null;
  effect_en: string | null;
  effect_ru: string | null;
  notes_en: string | null;
  notes_ru: string | null;
  image: string | null;
  sort_order: number | null;
}

const SCHOOL_COLORS: Record<string, string> = {
  air:   "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  fire:  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  earth: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  water: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const LEVEL_COLORS: Record<string, string> = {
  basic:    "bg-muted text-muted-foreground",
  expert:   "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  advanced: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
};

function formatLevel(level: string): string {
  return level.replace(/^LV/i, "").replace(/^\w/, c => c.toUpperCase());
}

function levelStyle(level: string): string {
  const key = level.replace(/^LV/i, "").toLowerCase();
  return LEVEL_COLORS[key] || "bg-muted text-muted-foreground";
}

interface Props { searchQuery?: string; }

export default function SpellsTab({ searchQuery = "" }: Props) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const [items, setItems] = useState<Spell[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Spell | null>(null);
  const [filterSchool, setFilterSchool] = useState("all");

  useEffect(() => {
    supabase.from("spells").select("*").order("sort_order").then(({ data }) => {
      if (data) setItems(data as Spell[]);
      setLoaded(true);
    });
  }, []);

  const schools = ["all", ...Array.from(new Set(items.map(i => i.school).filter(Boolean))) as string[]];
  const afterSchool = filterSchool === "all" ? items : items.filter(i => i.school === filterSchool);
  const q = searchQuery.toLowerCase();
  const filtered = searchQuery
    ? afterSchool.filter(i => {
        const fields = [i.name_en, i.name_ru, i.effect_en, i.effect_ru];
        return fields.some(f => f && f.toLowerCase().includes(q));
      })
    : afterSchool;

  const name = (i: Spell) => lang === "RU" ? (i.name_ru || i.name_en) : i.name_en;
  const hasFilters = filterSchool !== "all" || !!searchQuery;
  const resetFilters = () => setFilterSchool("all");

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex gap-1.5 overflow-x-auto px-3 pt-3 pb-2 scrollbar-none shrink-0">
          {schools.map(s => (
            <button key={s} onClick={() => setFilterSchool(s)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${filterSchool === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {s === "all" ? (lang === "RU" ? "Все" : "All") : s.charAt(0).toUpperCase() + s.slice(1)}
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
                const imgSrc = item.image ? `${STORAGE}/spells/${item.image}` : null;
                return (
                  <button key={item.id} onClick={() => setSelected(item)}
                    className="flex flex-col rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer">
                    <div className="aspect-[5/7] w-full bg-muted flex items-center justify-center overflow-hidden relative rounded-lg">
                      {imgSrc
                        ? <img src={imgSrc} alt={item.name_en} className="w-full h-full object-cover rounded-lg" />
                        : <p className="text-[10px] text-muted-foreground text-center px-1">{item.name_en}</p>
                      }
                      {(item.school || item.level) && (
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {item.school && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SCHOOL_COLORS[item.school] || "bg-muted text-muted-foreground"}`}>
                              {item.school.charAt(0).toUpperCase() + item.school.slice(1)}
                            </span>
                          )}
                          {item.level && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelStyle(item.level)}`}>
                              {formatLevel(item.level)}
                            </span>
                          )}
                        </div>
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
        <CardDialogContent>
          {selected && (
            <>
              {selected.image && (
                <div className="relative w-full shrink-0 flex justify-center bg-muted">
                  <img src={`${STORAGE}/spells/${selected.image}`} alt={selected.name_en} className="w-full max-h-[280px] object-contain" />
                  {(selected.school || selected.level) && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {selected.school && <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${SCHOOL_COLORS[selected.school] || "bg-muted text-muted-foreground"}`}>{selected.school.charAt(0).toUpperCase() + selected.school.slice(1)}</span>}
                      {selected.level && <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${levelStyle(selected.level)}`}>{formatLevel(selected.level)}</span>}
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                <h2 className="text-lg font-semibold leading-tight pr-8">{name(selected)}</h2>
                {selected.effect_en && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p><p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? (selected.effect_ru || selected.effect_en) : selected.effect_en, glyphs) }} /></div>}
                {(lang === "RU" ? selected.notes_ru : selected.notes_en) && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Заметки" : "Notes"}</p><p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? selected.notes_ru : selected.notes_en, glyphs) }} /></div>}
              </div>
            </>
          )}
        </CardDialogContent>
      </Dialog>
    </>
  );
}
