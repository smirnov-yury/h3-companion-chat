import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { SkeletonList } from "@/components/ui/empty-state";
import SeeAlso from "@/components/SeeAlso";

import { SUPABASE_URL } from "@/integrations/supabase/client";
const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;

interface Town {
  id: string;
  name_en: string;
  name_ru: string | null;
  notes_en: string | null;
  notes_ru: string | null;
  image_empty: string | null;
  image_full: string | null;
  image_back: string | null;
  sort_order: number | null;
}

interface TownBuilding {
  id: string;
  town_id: string | null;
  name_en: string;
  name_ru: string | null;
  cost: string | null;
  effect_en: string | null;
  effect_ru: string | null;
  sort_order: number | null;
}

type ImageTab = "empty" | "full";

interface Props {
  initialCardId?: string;
  onCardOpen?: (cardId: string) => void;
  onCardClose?: () => void;
}

export default function TownsTab({ initialCardId, onCardOpen }: Props = {}) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const { data: towns = [], isLoading: townsLoading } = useQuery({
    queryKey: ["towns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("towns").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Town[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const { data: allBuildings = [], isLoading: buildingsLoading } = useQuery({
    queryKey: ["town_buildings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("town_buildings").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as TownBuilding[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const loaded = !townsLoading && !buildingsLoading;
  const [selectedTown, setSelectedTown] = useState<Town | null>(null);
  const [imageTab, setImageTab] = useState<ImageTab>("empty");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!towns.length || selectedTown) return;
    const fromUrl = initialCardId ? towns.find(t => t.id === initialCardId) : null;
    setSelectedTown(fromUrl ?? towns[0]);
  }, [towns, initialCardId, selectedTown]);

  useEffect(() => {
    if (!loaded || !initialCardId) return;
    const found = towns.find(t => t.id === initialCardId);
    if (found && found.id !== selectedTown?.id) {
      setSelectedTown(found);
      setImageTab("empty");
      setImgError(false);
    }
  }, [initialCardId, loaded, towns]);

  const buildings = useMemo(
    () => selectedTown ? allBuildings.filter(b => b.town_id === selectedTown.id) : [],
    [allBuildings, selectedTown]
  );

  const handleTownChange = (town: Town) => {
    setSelectedTown(town);
    setImageTab("empty");
    setImgError(false);
    onCardOpen?.(town.id);
  };

  const handleImageTabChange = (tab: ImageTab) => {
    setImageTab(tab);
    setImgError(false);
  };

  if (!loaded) return (
    <div className="p-3 h-full overflow-y-auto">
      <SkeletonList />
    </div>
  );

  const name = (t: { name_en: string; name_ru: string | null }) =>
    lang === "RU" ? (t.name_ru || t.name_en) : t.name_en;

  const currentImageFile =
    selectedTown && imageTab === "empty" ? selectedTown.image_empty :
    selectedTown && imageTab === "full" ? selectedTown.image_full : null;

  const currentImageSrc = currentImageFile ? `${STORAGE}/towns/${currentImageFile}` : null;

  const notes = selectedTown
    ? (lang === "RU" ? (selectedTown.notes_ru || selectedTown.notes_en) : selectedTown.notes_en)
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 shrink-0 space-y-2 sticky top-0 z-10 bg-background">
        {/* Town selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {towns.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTownChange(t)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                selectedTown?.id === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {name(t)}
            </button>
          ))}
        </div>

      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="md:flex md:gap-4 md:items-start">
          <div className="md:w-[45%] md:shrink-0 space-y-3">
            <div className="relative">
              {currentImageSrc && !imgError ? (
                <img
                  src={currentImageSrc}
                  alt={selectedTown ? name(selectedTown) : ""}
                  className="w-full max-h-[55vh] rounded-lg object-contain"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full rounded-lg bg-muted flex items-center justify-center py-12">
                  <p className="text-xs text-muted-foreground">
                    {lang === "RU" ? "Изображение недоступно" : "No image available"}
                  </p>
                </div>
              )}
              {(selectedTown?.image_empty || selectedTown?.image_full) && (
                <button
                  type="button"
                  onClick={() => handleImageTabChange(imageTab === "empty" ? "full" : "empty")}
                  aria-label={lang === "RU"
                    ? (imageTab === "empty" ? "Пустой" : "Полный")
                    : (imageTab === "empty" ? "Empty" : "Full")}
                  title={lang === "RU"
                    ? (imageTab === "empty" ? "Пустой" : "Полный")
                    : (imageTab === "empty" ? "Empty" : "Full")}
                  className="absolute top-2 right-2 h-8 w-8 inline-flex items-center justify-center rounded-md bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
                >
                  {imageTab === "empty"
                    ? <Building2 className="h-4 w-4" />
                    : <Building className="h-4 w-4" />}
                </button>
              )}
            </div>
            {notes && (
              <div
                className="text-xs text-muted-foreground whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: renderGlyphs(notes, glyphs) }}
              />
            )}
          </div>

          <div className="md:flex-1 mt-3 md:mt-0 space-y-2">
            {buildings.length > 0 && (
              <>
                <p className="text-xs font-semibold text-foreground">
                  {lang === "RU" ? "Постройки" : "Buildings"}
                </p>
                {buildings.map((b) => {
                  const bName = lang === "RU" ? (b.name_ru || b.name_en) : b.name_en;
                  const bEffect = lang === "RU" ? (b.effect_ru || b.effect_en) : b.effect_en;
                  return (
                    <div key={b.id} className="bg-muted rounded-lg p-3">
                      <span
                        className="font-medium text-sm text-foreground"
                        dangerouslySetInnerHTML={{ __html: renderGlyphs(bName, glyphs) }}
                      />
                      {bEffect && (
                        <div
                          className="text-xs text-muted-foreground mt-1 whitespace-pre-line"
                          dangerouslySetInnerHTML={{ __html: renderGlyphs(bEffect, glyphs) }}
                        />
                      )}
                      {b.cost && (
                        <div className="mt-1.5">
                          <span
                            className="text-xs text-muted-foreground whitespace-pre-line"
                            dangerouslySetInnerHTML={{ __html: renderGlyphs(b.cost, glyphs) }}
                          />
                        </div>
                      )}
                      <SeeAlso entityType="town_building" entityId={b.id} lang={lang} />
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
