import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";

interface Field {
  id: string;
  name_en: string;
  name_ru: string | null;
  type_en: string | null;
  type_ru: string | null;
  effect_en: string | null;
  effect_ru: string | null;
  notes_en: string | null;
  notes_ru: string | null;
  image: string | null;
  sort_order: number | null;
}

export default function FieldsTab() {
  const { lang } = useLang();
  const [items, setItems] = useState<Field[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Field | null>(null);

  useEffect(() => {
    supabase.from("fields").select("*").order("sort_order").then(({ data }) => {
      if (data) setItems(data as Field[]);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground text-sm">{lang === "RU" ? "Загрузка…" : "Loading…"}</p></div>;
  if (items.length === 0) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground text-sm">{lang === "RU" ? "Нет данных" : "No data"}</p></div>;

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto h-full">
      {items.map((item) => (
        <button key={item.id} onClick={() => setSelected(selected?.id === item.id ? null : item)}
          className="text-left w-full rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {item.image ? <img src={item.image} alt={item.name_en} className="w-full h-full object-contain" /> : <span className="text-[10px] text-muted-foreground text-center leading-tight">{item.name_en}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-foreground truncate">{lang === "RU" ? (item.name_ru || item.name_en) : item.name_en}</p>
                {item.type_en && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{lang === "RU" ? (item.type_ru || item.type_en) : item.type_en}</span>}
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
  );
}
