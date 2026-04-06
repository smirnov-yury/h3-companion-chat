import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;

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

  const name = (i: Field) => lang === "RU" ? (i.name_ru || i.name_en) : i.name_en;

  return (
    <>
      <div className="p-3 overflow-y-auto h-full">
        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => {
            const imgSrc = item.image ? `${STORAGE}/fields/${item.image}` : null;
            return (
              <button key={item.id} onClick={() => setSelected(item)}
                className="flex flex-col rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary transition-colors">
                <div className="aspect-square w-full bg-muted flex items-center justify-center overflow-hidden relative">
                  {imgSrc
                    ? <img src={imgSrc} alt={item.name_en} className="w-full h-full object-contain" />
                    : <p className="text-[10px] text-muted-foreground text-center px-1">{item.name_en}</p>
                  }
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-foreground truncate">{name(item)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected ? name(selected) : ""}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              {selected.image && <img src={`${STORAGE}/fields/${selected.image}`} alt={selected.name_en} className="w-full rounded-lg" />}
              {selected.type_en && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{lang === "RU" ? (selected.type_ru || selected.type_en) : selected.type_en}</span>}
              {selected.effect_en && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p><p className="text-xs text-muted-foreground">{lang === "RU" ? (selected.effect_ru || selected.effect_en) : selected.effect_en}</p></div>}
              {(lang === "RU" ? selected.notes_ru : selected.notes_en) && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Заметки" : "Notes"}</p><p className="text-xs text-muted-foreground">{lang === "RU" ? selected.notes_ru : selected.notes_en}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
