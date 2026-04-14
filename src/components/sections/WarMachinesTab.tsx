import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;

interface WarMachine {
  id: string;
  name_en: string;
  name_ru: string | null;
  ability_en: string | null;
  ability_ru: string | null;
  cost_blacksmith: string | null;
  cost_trade_post: string | null;
  notes_en: string | null;
  notes_ru: string | null;
  image: string | null;
  sort_order: number | null;
}

interface Props { searchQuery?: string; }

export default function WarMachinesTab({ searchQuery = "" }: Props) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const [items, setItems] = useState<WarMachine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<WarMachine | null>(null);

  useEffect(() => {
    supabase.from("war_machines").select("*").order("sort_order").then(({ data }) => {
      if (data) setItems(data as WarMachine[]);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground text-sm">{lang === "RU" ? "Загрузка…" : "Loading…"}</p></div>;

  const name = (i: WarMachine) => lang === "RU" ? (i.name_ru || i.name_en) : i.name_en;

  const q = searchQuery.toLowerCase();
  const filtered = searchQuery
    ? items.filter(i => {
        const fields = [i.name_en, i.name_ru, i.ability_en, i.ability_ru];
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {filtered.map((item) => {
              const imgSrc = item.image ? `${STORAGE}/war_machines/${item.image}` : null;
              return (
                <button key={item.id} onClick={() => setSelected(item)}
                  className="flex flex-col rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary transition-colors">
                  <div className="aspect-[5/7] w-full bg-muted flex items-center justify-center overflow-hidden relative rounded-lg">
                    {imgSrc
                      ? <img src={imgSrc} alt={item.name_en} className="w-full h-full object-cover rounded-lg" />
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
              {selected.image && <img src={`${STORAGE}/war_machines/${selected.image}`} alt={selected.name_en} className="max-h-[40vh] w-auto mx-auto rounded-lg object-contain" />}
              {selected.ability_en && (
                <div>
                  <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Способность" : "Ability"}</p>
                  <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? (selected.ability_ru || selected.ability_en) : selected.ability_en, glyphs) }} />
                </div>
              )}
              {selected.cost_blacksmith && (
                <div>
                  <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Цена (Кузнец)" : "Cost (Blacksmith)"}</p>
                  <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderGlyphs(selected.cost_blacksmith, glyphs) }} />
                </div>
              )}
              {selected.cost_trade_post && (
                <div>
                  <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Цена (Торговый пост)" : "Cost (Trade Post)"}</p>
                  <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderGlyphs(selected.cost_trade_post, glyphs) }} />
                </div>
              )}
              {(lang === "RU" ? selected.notes_ru : selected.notes_en) && (
                <div>
                  <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Заметки" : "Notes"}</p>
                  <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? selected.notes_ru : selected.notes_en, glyphs) }} />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
