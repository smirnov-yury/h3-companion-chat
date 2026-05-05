import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { Dialog } from "@/components/ui/dialog";
import { CardDialogContent } from "@/components/ui/card-dialog";
import { EmptyState, SkeletonGrid } from "@/components/ui/empty-state";
import SeeAlso from "@/components/SeeAlso";
import { SUPABASE_URL } from "@/integrations/supabase/client";
import { componentImageUrl } from "@/lib/storage";

const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;

const DIFFICULTY_LABEL: Record<string, { en: string; ru: string; color: string }> = {
  easy:       { en: "Easy",       ru: "Лёгкий",      color: "bg-green-500/20 text-green-400" },
  normal:     { en: "Normal",     ru: "Нормальный",  color: "bg-blue-500/20 text-blue-400" },
  expert:     { en: "Expert",     ru: "Эксперт",     color: "bg-orange-500/20 text-orange-400" },
  impossible: { en: "Impossible", ru: "Невозможный", color: "bg-red-500/20 text-red-400" },
};

interface AiCard {
  id: string;
  name_en: string;
  name_ru: string | null;
  difficulty: string;
  description_en: string | null;
  description_ru: string | null;
  effect_en: string | null;
  effect_ru: string | null;
  image: string | null;
  sort_order: number | null;
}

interface Props {
  searchQuery?: string;
  initialCardId?: string;
  onCardOpen?: (cardId: string) => void;
  onCardClose?: () => void;
}

export default function AiCardsTab({ searchQuery = "", initialCardId, onCardOpen, onCardClose }: Props) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["ai_cards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_cards").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as AiCard[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const loaded = !isLoading;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const closeCard = () => { setSelectedIndex(null); onCardClose?.(); };
  const name = (i: AiCard) => lang === "RU" ? (i.name_ru || i.name_en) : i.name_en;

  const q = searchQuery.toLowerCase();
  const filtered = searchQuery
    ? items.filter(i => [i.name_en, i.name_ru, i.description_en, i.description_ru, i.effect_en, i.effect_ru, i.difficulty]
        .some(f => f && f.toLowerCase().includes(q)))
    : items;

  const selected = selectedIndex !== null ? filtered[selectedIndex] ?? null : null;
  const openCard = (i: AiCard) => {
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
          <SkeletonGrid className="grid grid-cols-2 lg:grid-cols-4 gap-3" />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {filtered.map((item) => {
              const imgSrc = item.image ? componentImageUrl("ai_cards", item.image) : null;
              const diff = DIFFICULTY_LABEL[item.difficulty];
              return (
                <button key={item.id} onClick={() => openCard(item)}
                  className="flex flex-col w-full overflow-hidden rounded-lg bg-muted text-left cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg hover:ring-2 hover:ring-primary">
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded-t-lg bg-muted">
                    {imgSrc && <img src={imgSrc} alt={item.name_en} className="w-full h-full object-cover" />}
                    {diff && (
                      <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${diff.color}`}>
                        {lang === "RU" ? diff.ru : diff.en}
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
              {selected.image && (
                <div className="w-full shrink-0 flex justify-center bg-muted">
                  <img src={`${STORAGE}/${selected.image}`} alt={selected.name_en} className="w-full max-h-[280px] object-contain" />
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                <div className="flex items-start justify-between gap-2 pr-8">
                  <h2 className="text-lg font-semibold leading-tight">{name(selected)}</h2>
                  {DIFFICULTY_LABEL[selected.difficulty] && (
                    <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${DIFFICULTY_LABEL[selected.difficulty].color}`}>
                      {lang === "RU" ? DIFFICULTY_LABEL[selected.difficulty].ru : DIFFICULTY_LABEL[selected.difficulty].en}
                    </span>
                  )}
                </div>
                {(lang === "RU" ? selected.description_ru : selected.description_en) && (
                  <div>
                    <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Описание" : "Description"}</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? selected.description_ru : selected.description_en, glyphs) }} />
                  </div>
                )}
                {(lang === "RU" ? selected.effect_ru : selected.effect_en) && (
                  <div>
                    <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? selected.effect_ru : selected.effect_en, glyphs) }} />
                  </div>
                )}
                <SeeAlso entityType="ai_card" entityId={selected.id} lang={lang} />
              </div>
            </>
          )}
        </CardDialogContent>
      </Dialog>
    </>
  );
}
