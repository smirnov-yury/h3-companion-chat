import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
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

export default function WarMachinesTab() {
  const { lang } = useLang();
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

  return (
    <>
      <div className="p-3 overflow-y-auto h-full">
        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => {
            const imgSrc = item.image ? `${STORAGE}/war_machines/${item.image}` : null;
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
              {selected.image && (
                <img src={`${STORAGE}/war_machines/${selected.image}`} alt={selected.name_en} className="w-full rounded-lg" />
              )}
              {selected.ability_en && (
                <div>
                  <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Способность" : "Ability"}</p>
                  <p className="text-xs text-muted-foreground">{lang === "RU" ? (selected.ability_ru || selected.ability_en) : selected.ability_en}</p>
                </div>
              )}
              {selected.cost_blacksmith && (
                <div>
                  <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Цена (Кузнец)" : "Cost (Blacksmith)"}</p>
                  <p className="text-xs text-muted-foreground">{selected.cost_blacksmith}</p>
                </div>
              )}
              {selected.cost_trade_post && (
                <div>
                  <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Цена (Торговый пост)" : "Cost (Trade Post)"}</p>
                  <p className="text-xs text-muted-foreground">{selected.cost_trade_post}</p>
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
