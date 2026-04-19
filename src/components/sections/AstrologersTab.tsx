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

interface Props {
  searchQuery?: string;
  initialCardId?: string;
  onCardOpen?: (cardId: string) => void;
  onCardClose?: () => void;
}

export default function AstrologersTab({ searchQuery = "", initialCardId, onCardOpen, onCardClose }: Props) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const [items, setItems] = useState<AstrologersProclaim[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<AstrologersProclaim | null>(null);

  useEffect(() => {
    supabase.from("astrologers_proclaim").select("*").order("sort_order").then(({ data }) => {
      if (data) setItems(data as AstrologersProclaim[]);
      setLoaded(true);
    });
  }, []);

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
        {!loaded ? (
          <SkeletonGrid className="grid grid-cols-2 lg:grid-cols-4 gap-3" />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {filtered.map((item) => {
              const imgSrc = item.image ? `${STORAGE}/astrologers_proclaim/${item.image}` : null;
              return (
                <button key={item.id} onClick={() => setSelected(item)}
                  className="flex flex-col w-full overflow-hidden rounded-lg bg-muted text-left cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg hover:ring-2 hover:ring-primary">
                  <div className="w-full aspect-[4/3] overflow-hidden rounded-t-lg bg-muted">
                    {imgSrc && <img src={imgSrc} alt={item.name_en} className="w-full h-full object-cover" />}
                  </div>
                  <p className="w-full text-sm font-medium p-2 truncate text-foreground">{name(item)}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <CardDialogContent>
          {selected && (
            <>
              {selected.image && (
                <div className="w-full shrink-0 flex justify-center bg-muted">
                  <img src={`${STORAGE}/astrologers_proclaim/${selected.image}`} alt={selected.name_en} className="w-full max-h-[280px] object-contain" />
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                <h2 className="text-lg font-semibold leading-tight pr-8">{name(selected)}</h2>
                {selected.effect_en && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p><p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? (selected.effect_ru || selected.effect_en) : selected.effect_en, glyphs) }} /></div>}
                {selected.description_en && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Описание" : "Description"}</p><p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? (selected.description_ru || selected.description_en) : selected.description_en, glyphs) }} /></div>}
                {(lang === "RU" ? selected.notes_ru : selected.notes_en) && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Заметки" : "Notes"}</p><p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? selected.notes_ru : selected.notes_en, glyphs) }} /></div>}
              </div>
            </>
          )}
        </CardDialogContent>
      </Dialog>
    </>
  );
}
