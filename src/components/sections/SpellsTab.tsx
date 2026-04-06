import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  fire: "bg-orange-500/10 text-orange-600",
  water: "bg-blue-500/10 text-blue-600",
  earth: "bg-green-500/10 text-green-600",
  air: "bg-sky-500/10 text-sky-600",
};

interface Props { searchQuery?: string; }

export default function SpellsTab({ searchQuery = "" }: Props) {
  const { lang } = useLang();
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
  const filtered = afterSchool.filter(i =>
    i.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.name_ru && i.name_ru.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!loaded) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground text-sm">{lang === "RU" ? "Загрузка…" : "Loading…"}</p></div>;

  const name = (i: Spell) => lang === "RU" ? (i.name_ru || i.name_en) : i.name_en;

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex gap-1.5 overflow-x-auto px-3 pt-3 pb-2 scrollbar-none shrink-0">
          {schools.map(s => (
            <button key={s} onClick={() => setFilterSchool(s)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors capitalize ${filterSchool === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
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
            <div className="grid grid-cols-3 gap-2">
              {filtered.map((item) => {
                const imgSrc = item.image ? `${STORAGE}/spells/${item.image}` : null;
                return (
                  <button key={item.id} onClick={() => setSelected(item)}
                    className="flex flex-col rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary transition-colors">
                    <div className="aspect-square w-full bg-muted flex items-center justify-center overflow-hidden relative">
                      {imgSrc
                        ? <img src={imgSrc} alt={item.name_en} className="w-full h-full object-contain" />
                        : <p className="text-[10px] text-muted-foreground text-center px-1">{item.name_en}</p>
                      }
                      {item.school && (
                        <span className={`absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize ${SCHOOL_COLORS[item.school] || "bg-muted text-muted-foreground"}`}>
                          {item.school}
                        </span>
                      )}
                      {item.level && (
                        <span className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          Lv{item.level}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected ? name(selected) : ""}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              {selected.image && <img src={`${STORAGE}/spells/${selected.image}`} alt={selected.name_en} className="w-full rounded-lg" />}
              <div className="flex gap-2 flex-wrap">
                {selected.school && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${SCHOOL_COLORS[selected.school] || "bg-muted text-muted-foreground"}`}>{selected.school}</span>}
                {selected.level && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Level {selected.level}</span>}
              </div>
              {selected.effect_en && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p><p className="text-xs text-muted-foreground">{lang === "RU" ? (selected.effect_ru || selected.effect_en) : selected.effect_en}</p></div>}
              {(lang === "RU" ? selected.notes_ru : selected.notes_en) && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Заметки" : "Notes"}</p><p className="text-xs text-muted-foreground">{lang === "RU" ? selected.notes_ru : selected.notes_en}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
