import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { Dialog } from "@/components/ui/dialog";
import { CardDialogContent } from "@/components/ui/card-dialog";
import { EmptyState, SkeletonGrid } from "@/components/ui/empty-state";
import { useEntityLinkHandler } from "@/hooks/useEntityLinkHandler";

import { SUPABASE_URL } from "@/integrations/supabase/client";
const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;

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
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["statistics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("statistics").select("*").order("sort_order");
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
            <SkeletonGrid />
          ) : filtered.length === 0 ? (
            <EmptyState onReset={hasFilters ? resetFilters : undefined} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {filtered.map((item) => {
                const imgSrc = item.image ? `${STORAGE}/statistics/${item.image}` : null;
                return (
                  <div key={item.id} onClick={() => openCard(item)}
                    className="relative aspect-[5/7] bg-muted rounded-lg overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
                    {imgSrc
                      ? <img src={imgSrc} alt={item.name_en || ""} className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                      : <div className="absolute inset-0 flex items-center justify-center"><p className="text-[10px] text-muted-foreground text-center px-1">{item.name_en}</p></div>
                    }
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && closeCard()}>
        <CardDialogContent onPrev={goPrev} onNext={goNext}>
          {selected && (
            <>
              {selected.image && (
                <div className="relative w-[85%] mx-auto pt-4 mb-0 shrink-0">
                  <img src={`${STORAGE}/statistics/${selected.image}`} alt={selected.name_en || ""} className="w-full aspect-[5/7] object-contain rounded-lg shadow-lg" />
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
