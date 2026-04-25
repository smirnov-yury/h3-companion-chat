import { useState, useEffect } from "react";
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

interface Artifact {
  id: string;
  name_en: string;
  name_ru: string | null;
  quality: string | null;
  effect_en: string | null;
  effect_ru: string | null;
  description_en: string | null;
  description_ru: string | null;
  image: string | null;
  sort_order: number | null;
}

const QUALITY_COLORS: Record<string, string> = {
  minor: "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
  major: "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200",
  relic: "bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-amber-100",
};
const QUALITY_LABELS: Record<string, string> = {
  minor: "Minor",
  major: "Major",
  relic: "★ Relic",
};
const QUALITY_ORDER = ["minor", "major", "relic"];

interface Props {
  searchQuery?: string;
  initialFilter?: string;
  initialCardId?: string;
  onFilterChange?: (filterValue: string | null) => void;
  onCardOpen?: (currentFilter: string | null, cardId: string) => void;
  onCardClose?: (currentFilter: string | null) => void;
}

export default function ArtifactsTab({ searchQuery = "", initialFilter, initialCardId, onFilterChange, onCardOpen, onCardClose }: Props) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const handleEntityClick = useEntityLinkHandler();
  const [items, setItems] = useState<Artifact[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [filterQuality, setFilterQuality] = useState("all");

  useEffect(() => {
    supabase.from("artifacts").select("*").order("sort_order").then(({ data }) => {
      if (data) setItems(data as Artifact[]);
      setLoaded(true);
    });
  }, []);

  // Sync URL filter slug → internal quality (graceful fallback)
  useEffect(() => {
    if (!initialFilter) { setFilterQuality("all"); return; }
    setFilterQuality(QUALITY_ORDER.includes(initialFilter) ? initialFilter : "all");
  }, [initialFilter]);

  const setQualityAndUrl = (next: string) => {
    setFilterQuality(next);
    onFilterChange?.(next === "all" ? null : next);
  };

  const currentFilter = filterQuality === "all" ? null : filterQuality;
  const closeCard = () => { setSelectedIndex(null); onCardClose?.(currentFilter); };

  const qualitiesSet = new Set(items.map(i => i.quality).filter(Boolean));
  const qualities = ["all", ...QUALITY_ORDER.filter(q => qualitiesSet.has(q)), ...Array.from(qualitiesSet).filter(q => !QUALITY_ORDER.includes(q!))];
  const afterQuality = filterQuality === "all" ? items : items.filter(i => i.quality === filterQuality);
  const q = searchQuery.toLowerCase();
  const filtered = searchQuery
    ? afterQuality.filter(i => {
        const fields = [i.name_en, i.name_ru, i.effect_en, i.effect_ru, i.description_en, i.description_ru];
        return fields.some(f => f && f.toLowerCase().includes(q));
      })
    : afterQuality;

  const name = (i: Artifact) => lang === "RU" ? (i.name_ru || i.name_en) : i.name_en;
  const hasFilters = filterQuality !== "all" || !!searchQuery;
  const resetFilters = () => setQualityAndUrl("all");

  const selected = selectedIndex !== null ? filtered[selectedIndex] ?? null : null;
  const openCard = (i: Artifact) => {
    const idx = filtered.findIndex(x => x.id === i.id);
    if (idx === -1) return;
    setSelectedIndex(idx);
    onCardOpen?.(currentFilter, i.id);
  };
  const goPrev = selectedIndex !== null && selectedIndex > 0
    ? () => setSelectedIndex(selectedIndex - 1) : undefined;
  const goNext = selectedIndex !== null && selectedIndex < filtered.length - 1
    ? () => setSelectedIndex(selectedIndex + 1) : undefined;

  // Auto-open card from URL
  useEffect(() => {
    if (!loaded || !initialCardId) return;
    const idx = filtered.findIndex(i => i.id === initialCardId);
    if (idx !== -1) setSelectedIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, initialCardId, items]);

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex gap-1.5 overflow-x-auto px-3 pt-3 pb-2 scrollbar-none shrink-0">
          {qualities.map(q => (
            <button key={q} onClick={() => setQualityAndUrl(q)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${filterQuality === q ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {q === "all" ? (lang === "RU" ? "Все" : "All") : (QUALITY_LABELS[q] || q)}
            </button>
          ))}
        </div>
        <div className="p-3 pt-0 overflow-y-auto flex-1">
          {!loaded ? (
            <SkeletonGrid />
          ) : filtered.length === 0 ? (
            <EmptyState onReset={hasFilters ? resetFilters : undefined} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {filtered.map((item) => {
                const imgSrc = item.image ? `${STORAGE}/artifacts/${item.image}` : null;
                return (
                  <button key={item.id} onClick={() => openCard(item)}
                    className="flex flex-col rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer">
                    <div className="aspect-[5/7] w-full bg-muted flex items-center justify-center overflow-hidden relative rounded-lg">
                      <img src={imgSrc || DECK_PLACEHOLDER} alt={item.name_en} className="w-full h-full object-cover rounded-lg" onError={(e) => { e.currentTarget.src = DECK_PLACEHOLDER; e.currentTarget.onerror = null; }} />
                      {item.quality && (
                      <span className={`absolute top-1 left-1 text-xs px-2 py-0.5 rounded-full font-medium ${QUALITY_COLORS[item.quality] || "bg-muted text-muted-foreground"}`}>
                          {QUALITY_LABELS[item.quality] || item.quality}
                        </span>
                      )}
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
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && closeCard()}>
        <CardDialogContent onPrev={goPrev} onNext={goNext}>
          {selected && (
            <>
              <div className="relative w-[85%] mx-auto pt-4 mb-0 shrink-0">
                <img src={selected.image ? `${STORAGE}/artifacts/${selected.image}` : DECK_PLACEHOLDER} alt={selected.name_en} className="w-full aspect-[5/7] object-contain rounded-lg shadow-lg" onError={(e) => { e.currentTarget.src = DECK_PLACEHOLDER; e.currentTarget.onerror = null; }} />
                {selected.quality && (
                  <span className={`absolute top-2 left-2 text-[11px] px-2 py-0.5 rounded-full font-medium ${QUALITY_COLORS[selected.quality] || "bg-muted text-muted-foreground"}`}>
                    {QUALITY_LABELS[selected.quality] || selected.quality}
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" onClick={handleEntityClick}>
                <h2 className="text-lg font-semibold leading-tight pr-8">{name(selected)}</h2>
                {selected.effect_en && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p><p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? (selected.effect_ru || selected.effect_en) : selected.effect_en, glyphs) }} /></div>}
                {selected.description_en && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Описание" : "Description"}</p><p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderGlyphs(lang === "RU" ? (selected.description_ru || selected.description_en) : selected.description_en, glyphs) }} /></div>}
                <SeeAlso entityType="artifact" entityId={selected.id} lang={lang as "EN" | "RU"} />
              </div>
            </>
          )}
        </CardDialogContent>
      </Dialog>
    </>
  );
}
