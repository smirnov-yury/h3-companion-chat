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
import SeeAlso from "@/components/SeeAlso";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;
const DECK_PLACEHOLDER = "https://dhdjxhfbyqsobhfqeryu.supabase.co/storage/v1/object/public/component-media/artifacts/empty_art_ability_spec_spell.webp";

interface Ability {
  id: string;
  name_en: string;
  name_ru: string | null;
  effect_en: string | null;
  effect_ru: string | null;
  effect_expert_en: string | null;
  effect_empowered_en: string | null;
  effect_expert_ru: string | null;
  effect_empowered_ru: string | null;
  notes_en: string | null;
  notes_ru: string | null;
  image_regular: string | null;
  sort_order: number | null;
}

interface Props {
  searchQuery?: string;
  initialCardId?: string;
  onCardOpen?: (cardId: string) => void;
  onCardClose?: () => void;
}

export default function AbilitiesTab({ searchQuery = "", initialCardId, onCardOpen, onCardClose }: Props) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const handleEntityClick = useEntityLinkHandler();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["abilities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("abilities").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Ability[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const loaded = !isLoading;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const closeCard = () => { setSelectedIndex(null); onCardClose?.(); };

  const name = (i: Ability) => lang === "RU" ? (i.name_ru || i.name_en) : i.name_en;

  const q = searchQuery.toLowerCase();
  const filtered = searchQuery
    ? items.filter(i => {
        const fields = [i.name_en, i.name_ru, i.effect_en, i.effect_expert_en, i.effect_empowered_en];
        return fields.some(f => f && f.toLowerCase().includes(q));
      })
    : items;

  const selected = selectedIndex !== null ? filtered[selectedIndex] ?? null : null;
  const openCard = (i: Ability) => {
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
              const imgSrc = item.image_regular ? `${STORAGE}/abilities/${item.image_regular}` : null;
              return (
                <button key={item.id} onClick={() => openCard(item)}
                  className="flex flex-col rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer">
                  <div className="aspect-[5/7] w-full bg-muted flex items-center justify-center overflow-hidden relative rounded-lg">
                    <img src={imgSrc || DECK_PLACEHOLDER} alt={item.name_en} className="w-full h-full object-cover rounded-lg" onError={(e) => { e.currentTarget.src = DECK_PLACEHOLDER; e.currentTarget.onerror = null; }} />
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
        <CardDialogContent onPrev={goPrev} onNext={goNext}>
          {selected && (
            <>
              <div className="relative w-[85%] mx-auto pt-4 mb-0 shrink-0 bg-muted/50 rounded-lg">
                <img src={selected.image_regular ? `${STORAGE}/abilities/${selected.image_regular}` : DECK_PLACEHOLDER} alt={selected.name_en} className="w-full aspect-[5/7] object-contain rounded-lg shadow-lg" onError={(e) => { e.currentTarget.src = DECK_PLACEHOLDER; e.currentTarget.onerror = null; }} />
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" onClick={handleEntityClick}>
                <h2 className="text-lg font-semibold leading-tight pr-8">{name(selected)}</h2>
                {(lang === "RU" ? selected.effect_ru : selected.effect_en) && (
                  <div>
                    <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? selected.effect_ru : selected.effect_en, glyphs) }} />
                  </div>
                )}
                {(lang === "RU" ? selected.effect_empowered_ru : selected.effect_empowered_en) && (
                  <div>
                    <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Усиленный" : "Empowered"}</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? selected.effect_empowered_ru : selected.effect_empowered_en, glyphs) }} />
                  </div>
                )}
                {(lang === "RU" ? selected.notes_ru : selected.notes_en) && (
                  <div>
                    <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Заметки" : "Notes"}</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? selected.notes_ru : selected.notes_en, glyphs) }} />
                  </div>
                )}
                <SeeAlso entityType="ability" entityId={selected.id} lang={lang as "EN" | "RU"} />
              </div>
            </>
          )}
        </CardDialogContent>
      </Dialog>
    </>
  );
}
