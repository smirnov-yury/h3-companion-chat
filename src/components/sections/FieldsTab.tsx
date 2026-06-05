import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { componentImageUrl } from "@/lib/storage";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { Dialog } from "@/components/ui/dialog";
import { CardDialogContent } from "@/components/ui/card-dialog";
import { EmptyState, SkeletonGrid } from "@/components/ui/empty-state";
import SeeAlso from "@/components/SeeAlso";
import ImageWithSpinner from "@/components/ImageWithSpinner";
import { CardGrid } from "@/components/CardGrid";
import { useCardLayout } from "@/hooks/useCardLayouts";
import { aspectStyle, objectStyle } from "@/config/cardLayouts";


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
  updated_at: string | null;
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
  const layout = useCardLayout("fields");
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["fields"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fields").select("ai_context, effect_en, effect_ru, id, image, image_status, name_en, name_ru, notes_en, notes_ru, sort_order, type_en, type_ru, updated_at").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Field[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const loaded = !isLoading;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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
          <SkeletonGrid aspectStyle={aspectStyle(layout)} />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <CardGrid layout={layout}>
            {filtered.map((item) => {
              const imgSrc = item.image ? componentImageUrl("fields", item.image, item.updated_at) : null;
              return (
                <button key={item.id} onClick={() => openCard(item)}
                  className="flex flex-col w-full overflow-hidden rounded-lg bg-muted text-left cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg hover:ring-2 hover:ring-primary">
                  <div style={aspectStyle(layout)} className="w-full bg-muted overflow-hidden relative">
                    {imgSrc
                      ? <img loading="lazy" decoding="async" src={imgSrc} alt={item.name_en} style={objectStyle(layout)} className="w-full h-full rounded-t-lg" />
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
          </CardGrid>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && closeCard()}>
        <CardDialogContent onPrev={goPrev} onNext={goNext}>
          {selected && (
            <>
              {selected.image ? (
                <div className="relative w-full shrink-0 flex justify-center bg-muted">
                  <ImageWithSpinner src={componentImageUrl("fields", selected.image, selected.updated_at)} alt={selected.name_en} className="w-full max-h-[280px] object-contain" />
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
