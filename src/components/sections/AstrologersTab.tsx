import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;

interface AstrologersProclaim {
  id: string;
  name_en: string;
  name_ru: string | null;
  description_en: string | null;
  description_ru: string | null;
  effect_en: string | null;
  effect_ru: string | null;
  notes_en: string | null;
  notes_ru: string | null;
  image: string | null;
  sort_order: number | null;
}

interface Props { searchQuery?: string; }

export default function AstrologersTab({ searchQuery = "" }: Props) {
  const { lang } = useLang();
  const [items, setItems] = useState<AstrologersProclaim[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<AstrologersProclaim | null>(null);

  useEffect(() => {
    supabase.from("astrologers_proclaim").select("*").order("sort_order").then(({ data }) => {
      if (data) setItems(data as AstrologersProclaim[]);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground text-sm">{lang === "RU" ? "Загрузка…" : "Loading…"}</p></div>;

  const name = (i: AstrologersProclaim) => lang === "RU" ? (i.name_ru || i.name_en) : i.name_en;

  const q = searchQuery.toLowerCase();
  const filtered = searchQuery
    ? items.filter(i => {
        const fields = [i.name_en, i.name_ru, i.effect_en, i.effect_ru, i.description_en, i.description_ru];
        return fields.some(f => f && f.toLowerCase().includes(q));
      })
    : items;

  return (
    <>
      <div className="p-3 overflow-y-auto h-full">
        {filtered.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Search size={32} />
            <p className="text-sm">{lang === "RU" ? "Ничего не найдено" : "Nothing found"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filtered.map((item) => {
              const imgSrc = item.image ? `${STORAGE}/astrologers_proclaim/${item.image}` : null;
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
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[90dvh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{selected ? name(selected) : ""}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="overflow-y-auto flex-1 pr-1 space-y-3">
              {selected.image && <img src={`${STORAGE}/astrologers_proclaim/${selected.image}`} alt={selected.name_en} className="max-h-[40vh] w-auto mx-auto rounded-lg object-contain" />}
              {selected.effect_en && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p><p className="text-xs text-muted-foreground">{lang === "RU" ? (selected.effect_ru || selected.effect_en) : selected.effect_en}</p></div>}
              {selected.description_en && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Описание" : "Description"}</p><p className="text-xs text-muted-foreground">{lang === "RU" ? (selected.description_ru || selected.description_en) : selected.description_en}</p></div>}
              {(lang === "RU" ? selected.notes_ru : selected.notes_en) && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Заметки" : "Notes"}</p><p className="text-xs text-muted-foreground">{lang === "RU" ? selected.notes_ru : selected.notes_en}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
