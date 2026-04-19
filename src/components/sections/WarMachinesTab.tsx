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

interface Props {
  searchQuery?: string;
  initialCardId?: string;
  onCardOpen?: (cardId: string) => void;
  onCardClose?: () => void;
}

export default function WarMachinesTab({ searchQuery = "", initialCardId, onCardOpen, onCardClose }: Props) {
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

  useEffect(() => {
    if (!loaded || !initialCardId) return;
    const found = items.find(i => i.id === initialCardId);
    if (found) setSelected(found);
  }, [loaded, initialCardId, items]);

  const openCard = (i: WarMachine) => { setSelected(i); onCardOpen?.(i.id); };
  const closeCard = () => { setSelected(null); onCardClose?.(); };

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
        {!loaded ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <EmptyState onReset={searchQuery ? () => undefined : undefined} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {filtered.map((item) => {
              const imgSrc = item.image ? `${STORAGE}/war_machines/${item.image}` : null;
              return (
                <button key={item.id} onClick={() => openCard(item)}
                  className="flex flex-col rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer">
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

      <Dialog open={!!selected} onOpenChange={(o) => !o && closeCard()}>
        <CardDialogContent>
          {selected && (() => {
            // Replace plain "gold" word in cost strings with the <gold> glyph token.
            const goldify = (s: string | null) =>
              s ? s.replace(/\bgold\b/gi, "<gold>") : s;
            return (
              <>
                {selected.image && (
                  <div className="w-full shrink-0 flex justify-center bg-muted">
                    <img src={`${STORAGE}/war_machines/${selected.image}`} alt={selected.name_en} className="w-full max-h-[280px] object-contain" />
                  </div>
                )}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  <h2 className="text-lg font-semibold leading-tight pr-8">{name(selected)}</h2>
                  {selected.ability_en && (
                    <div>
                      <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? (selected.ability_ru || selected.ability_en) : selected.ability_en, glyphs) }} />
                    </div>
                  )}
                  {selected.cost_blacksmith && (
                    <div>
                      <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Цена (Кузнец)" : "Cost (Blacksmith)"}</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(goldify(selected.cost_blacksmith), glyphs) }} />
                    </div>
                  )}
                  {selected.cost_trade_post && (
                    <div>
                      <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Цена (Торговый пост)" : "Cost (Trade Post)"}</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(goldify(selected.cost_trade_post), glyphs) }} />
                    </div>
                  )}
                  {(lang === "RU" ? selected.notes_ru : selected.notes_en) && (
                    <div>
                      <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Заметки" : "Notes"}</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? selected.notes_ru : selected.notes_en, glyphs) }} />
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </CardDialogContent>
      </Dialog>
    </>
  );
}
