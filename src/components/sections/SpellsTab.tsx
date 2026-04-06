import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";

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

export default function SpellsTab() {
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
  const filtered = filterSchool === "all" ? items : items.filter(i => i.school === filterSchool);

  if (!loaded) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground text-sm">{lang === "RU" ? "Загрузка…" : "Loading…"}</p></div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1.5 overflow-x-auto px-3 pt-3 pb-2 scrollbar-none shrink-0">
        {schools.map(s => (
          <button key={s} onClick={() => setFilterSchool(s)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors capitalize ${filterSchool === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {s === "all" ? (lang === "RU" ? "Все" : "All") : s}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3 p-3 pt-0 overflow-y-auto flex-1">
        {filtered.map((item) => (
          <button key={item.id} onClick={() => setSelected(selected?.id === item.id ? null : item)}
            className="text-left w-full rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {item.image ? <img src={item.image} alt={item.name_en} className="w-full h-full object-contain" /> : <span className="text-[10px] text-muted-foreground text-center leading-tight">{item.name_en}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-foreground truncate">{lang === "RU" ? (item.name_ru || item.name_en) : item.name_en}</p>
                  {item.school && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${SCHOOL_COLORS[item.school] || "bg-muted text-muted-foreground"}`}>{item.school}</span>}
                  {item.level && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Lv {item.level}</span>}
                </div>
                {item.effect_en && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{lang === "RU" ? (item.effect_ru || item.effect_en) : item.effect_en}</p>}
              </div>
            </div>
            {selected?.id === item.id && (
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                {item.effect_en && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p><p className="text-xs text-muted-foreground">{lang === "RU" ? (item.effect_ru || item.effect_en) : item.effect_en}</p></div>}
                {(lang === "RU" ? item.notes_ru : item.notes_en) && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Заметки" : "Notes"}</p><p className="text-xs text-muted-foreground">{lang === "RU" ? item.notes_ru : item.notes_en}</p></div>}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
