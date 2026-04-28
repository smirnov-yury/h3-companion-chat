import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { Dialog } from "@/components/ui/dialog";
import { CardDialogContent } from "@/components/ui/card-dialog";
import { EmptyState, SkeletonGrid } from "@/components/ui/empty-state";
import SeeAlso from "@/components/SeeAlso";

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

interface Props {
  searchQuery?: string;
  filterSlug?: string;
  initialCardId?: string;
  onCardOpen?: (cardId: string) => void;
  onCardClose?: () => void;
}

export default function FieldsTab({ searchQuery = "", filterSlug, initialCardId, onCardOpen, onCardClose }: Props) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const [items, setItems] = useState<Field[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    supabase.from("fields").select("*").order("sort_order").then(({ data }) => {
      if (data) setItems(data as Field[]);
      setLoaded(true);
    });
  }, []);

  const closeCard = () => { setSelectedIndex(null); onCardClose?.(); };

  const name = (i: Field) => lang === "RU" ? (i.name_ru || i.name_en) : i.name_en;

  const q = searchQuery.toLowerCase();
  const afterType = filterSlug
    ? items.filter(i => i.type_en && i.type_en.toLowerCase().replace(/\s+/g, "-") === filterSlug)
    : items;
  const filtered = searchQuery
    ? afterType.filter(i => {
        const fields = [i.name_en, i.name_ru, i.effect_en, i.effect_ru];
        return fields.some(f => f && f.toLowerCase().includes(q));
      })
    : afterType;

  const selected = selectedIndex !== null ? filtered[selectedIndex] ?? null : null;
  const openCard = (i: Field) => {
    const idx = filtered.findIndex(x => x.id === i.id);
    if (idx === -1) return;
    setSelectedIndex(idx);
    onCardOpen?.(i.id);
  };
  const goPrev = selectedIndex !== null && selectedIndex > 0
    ? () => { const ni = selectedIndex - 1; setSelectedIndex(ni); onCardOpen?.(filtered[ni].id); } : undefined;
  const goNext = selectedIndex !== null && selectedIndex < filtered.length - 1
    ? () => { const ni = selectedIndex + 1; setSelectedIndex(ni); onCardOpen?.(filtered[ni].id); } : undefined;

  useEffect(() => {
    if (!loaded || !initialCardId) return;
    const idx = filtered.findIndex(i => i.id === initialCardId);
    if (idx !== -1) setSelectedIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, initialCardId, items]);

  return (
    <>
      <div className="p-3 overflow-y-auto h-full">
        {!loaded ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {filtered.map((item) => {
              const imgSrc = item.image ? `${STORAGE}/fields/${item.image}` : null;
              return (
                <button key={item.id} onClick={() => openCard(item)}
                  className="flex flex-col w-full overflow-hidden rounded-lg bg-muted text-left cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg hover:ring-2 hover:ring-primary">
                  <div className="aspect-[4/3] w-full bg-muted overflow-hidden relative">
                    {imgSrc
                      ? <img src={imgSrc} alt={item.name_en} className="w-full h-full object-cover rounded-t-lg" />
                      : <div className="w-full h-full flex items-center justify-center"><p className="text-[10px] text-muted-foreground text-center px-1">{item.name_en}</p></div>
                    }
                    {item.type_en && (
                      <span className="absolute top-2 left-2 text-[11px] font-medium px-2 py-0.5 rounded bg-background/80 backdrop-blur-sm text-foreground leading-tight">
                        {(lang === "RU" ? (item.type_ru || item.type_en) : item.type_en).split("\n")[0]}
                      </span>
                    )}
                  </div>
                  <p className="w-full text-sm font-medium p-2 truncate text-foreground">{name(item)}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && closeCard()}>
        <CardDialogContent onPrev={goPrev} onNext={goNext}>
          {selected && (
            <>
              {selected.image ? (
                <div className="relative w-full shrink-0 flex justify-center bg-muted">
                  <img src={`${STORAGE}/fields/${selected.image}`} alt={selected.name_en} className="w-full max-h-[280px] object-contain" />
                  {selected.type_en && (
                    <span className="absolute top-2 left-2 text-[11px] font-medium px-2 py-0.5 rounded bg-background/80 backdrop-blur-sm text-foreground">
                      {lang === "RU" ? (selected.type_ru || selected.type_en) : selected.type_en}
                    </span>
                  )}
                </div>
              ) : (
                selected.type_en && (
                  <div className="px-4 pt-4">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {lang === "RU" ? (selected.type_ru || selected.type_en) : selected.type_en}
                    </span>
                  </div>
                )
              )}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                <h2 className="text-lg font-semibold leading-tight pr-8">{name(selected)}</h2>
                {selected.effect_en && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p><p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? (selected.effect_ru || selected.effect_en) : selected.effect_en, glyphs) }} /></div>}
                {(lang === "RU" ? selected.notes_ru : selected.notes_en) && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Заметки" : "Notes"}</p><p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? selected.notes_ru : selected.notes_en, glyphs) }} /></div>}
                <SeeAlso entityType="field" entityId={selected.id} lang={lang} />
              </div>
            </>
          )}
        </CardDialogContent>
      </Dialog>
    </>
  );
}
