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
import { useEntityLinkHandler } from "@/hooks/useEntityLinkHandler";
import ImageWithSpinner from "@/components/ImageWithSpinner";
import { CardGrid } from "@/components/CardGrid";
import { useCardLayout } from "@/hooks/useCardLayouts";
import { aspectStyle, objectStyle } from "@/config/cardLayouts";


interface Statistic {
  id: string;
  name_en: string | null;
  name_ru: string | null;
  stat_type: string | null;
  card_type: string | null;
  effect_en: string | null;
  effect_ru: string | null;
  effect_en_expert: string | null;
  effect_en_expert_ru: string | null;
  notes_en: string | null;
  notes_ru: string | null;
  image: string | null;
  updated_at: string | null;
  sort_order: number | null;
}


interface Props {
  searchQuery?: string;
  initialFilter?: string;
  initialCardId?: string;
  onFilterChange?: (filterValue: string | null) => void;
  onCardOpen?: (currentFilter: string | null, cardId: string) => void;
  onCardClose?: (currentFilter: string | null) => void;
}

export default function StatisticsTab({ searchQuery = "", initialCardId, onCardOpen, onCardClose }: Props) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const handleEntityClick = useEntityLinkHandler();
  const layout = useCardLayout("attributes");
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["statistics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("statistics").select("card_type, effect_en, effect_en_expert, effect_en_expert_ru, effect_ru, id, image, name_en, name_ru, notes_en, notes_ru, sort_order, stat_type, updated_at").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Statistic[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const loaded = !isLoading;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const currentFilter = null;
  const closeCard = () => { setSelectedIndex(null); onCardClose?.(currentFilter); };

  const q = searchQuery.toLowerCase();
  const filtered = searchQuery
    ? items.filter(i => {
        const fields = [i.name_en, i.name_ru, i.effect_en];
        return fields.some(f => f && f.toLowerCase().includes(q));
      })
    : items;

  const name = (i: Statistic) => lang === "RU" ? (i.name_ru || i.name_en || "") : (i.name_en || "");
  const hasFilters = !!searchQuery;
  const resetFilters = () => {};

  const selected = selectedIndex !== null ? filtered[selectedIndex] ?? null : null;
  const openCard = (i: Statistic) => {
    const idx = filtered.findIndex(x => x.id === i.id);
    if (idx === -1) return;
    setSelectedIndex(idx);
    onCardOpen?.(currentFilter, i.id);
  };
  const goPrev = selectedIndex !== null && selectedIndex > 0
    ? () => { const ni = selectedIndex - 1; setSelectedIndex(ni); onCardOpen?.(currentFilter, filtered[ni].id); } : undefined;
  const goNext = selectedIndex !== null && selectedIndex < filtered.length - 1
    ? () => { const ni = selectedIndex + 1; setSelectedIndex(ni); onCardOpen?.(currentFilter, filtered[ni].id); } : undefined;

  useEffect(() => {
    if (!loaded || !initialCardId) return;
    const idx = filtered.findIndex(i => i.id === initialCardId);
    if (idx !== -1) setSelectedIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, initialCardId, items]);

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-3 pt-0 overflow-y-auto flex-1">

          {!loaded ? (
            <SkeletonGrid aspectStyle={aspectStyle(layout)} />
          ) : filtered.length === 0 ? (
            <EmptyState onReset={hasFilters ? resetFilters : undefined} />
          ) : (
            <CardGrid layout={layout}>
              {filtered.map((item) => {
                const imgSrc = item.image ? componentImageUrl("statistics", item.image, item.updated_at) : null;
                return (
                  <div key={item.id} onClick={() => openCard(item)}
                    style={aspectStyle(layout)}
                    className="relative bg-muted rounded-lg overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
                    {imgSrc
                      ? <img loading="lazy" decoding="async" src={imgSrc} alt={item.name_en || ""} style={objectStyle(layout)} className="absolute inset-0 w-full h-full rounded-lg" />
                      : <div className="absolute inset-0 flex items-center justify-center"><p className="text-[10px] text-muted-foreground text-center px-1">{item.name_en}</p></div>
                    }
                  </div>
                );
              })}
            </CardGrid>
          )}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && closeCard()}>
        <CardDialogContent onPrev={goPrev} onNext={goNext}>
          {selected && (
            <>
              {selected.image && (
                <div className="relative w-[85%] mx-auto pt-4 mb-0 shrink-0">
                  <ImageWithSpinner src={componentImageUrl("statistics", selected.image, selected.updated_at)} alt={selected.name_en || ""} className="w-full aspect-[5/7] object-contain rounded-lg shadow-lg" />
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" onClick={handleEntityClick}>
                <h2 className="text-lg font-semibold leading-tight pr-8">{name(selected)}</h2>
                {selected.effect_en && (
                  <div>
                    <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? (selected.effect_ru || selected.effect_en) : selected.effect_en, glyphs) }} />
                  </div>
                )}
                {selected.effect_en_expert && (
                  <div>
                    <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Усиленный" : "Empowered"}</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? (selected.effect_en_expert_ru || selected.effect_en_expert) : selected.effect_en_expert, glyphs) }} />
                  </div>
                )}
                {(lang === "RU" ? (selected.notes_ru || selected.notes_en) : selected.notes_en) && (
                  <div>
                    <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Заметки" : "Notes"}</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? (selected.notes_ru || selected.notes_en) : selected.notes_en, glyphs) }} />
                  </div>
                )}
              </div>
            </>
          )}
        </CardDialogContent>
      </Dialog>
    </>
  );
}
