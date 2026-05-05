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

interface PandoraBox {
  id: string;
  description_en: string | null;
  description_ru: string | null;
  image: string | null;
  sort_order: number | null;
}

interface Props {
  searchQuery?: string;
  initialCardId?: string;
  onCardOpen?: (cardId: string) => void;
  onCardClose?: () => void;
}

export default function PandoraTab({ searchQuery = "", initialCardId, onCardOpen, onCardClose }: Props) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["pandora_box"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pandora_box").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as PandoraBox[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const loaded = !isLoading;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const closeCard = () => { setSelectedIndex(null); onCardClose?.(); };

  const label = (i: PandoraBox) => {
    const text = lang === "RU" ? (i.description_ru || i.description_en) : i.description_en;
    if (!text) return i.id;
    return text.length > 40 ? text.slice(0, 40) + "…" : text;
  };

  const q = searchQuery.toLowerCase();
  const filtered = searchQuery
    ? items.filter(i => [i.description_en, i.description_ru]
        .some(f => f && f.toLowerCase().includes(q)))
    : items;

  const selected = selectedIndex !== null ? filtered[selectedIndex] ?? null : null;
  const openCard = (i: PandoraBox) => {
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
              const imgSrc = item.image ? componentImageUrl("pandora_box", item.image) : null;
              return (
                <button key={item.id} onClick={() => openCard(item)}
                  className="flex flex-col w-full overflow-hidden rounded-lg bg-muted text-left cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg hover:ring-2 hover:ring-primary">
                  <div className="w-full aspect-[3/4] overflow-hidden rounded-t-lg bg-muted">
                    {imgSrc && <img src={imgSrc} alt="Pandora's Box" className="w-full h-full object-cover" />}
                  </div>
                  <p className="w-full text-sm font-medium p-2 truncate text-foreground">{label(item)}</p>
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
                  <img src={`${STORAGE}/${selected.image}`} alt="Pandora's Box" className="w-full max-h-[280px] object-contain" />
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                <h2 className="text-lg font-semibold leading-tight pr-8">{lang === "RU" ? "Ящик Пандоры" : "Pandora's Box"}</h2>
                {(lang === "RU" ? selected.description_ru : selected.description_en) && (
                  <div>
                    <p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? selected.description_ru : selected.description_en, glyphs) }} />
                  </div>
                )}
                <SeeAlso entityType="pandora_box" entityId={selected.id} lang={lang} />
              </div>
            </>
          )}
        </CardDialogContent>
      </Dialog>
    </>
  );
}
