import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { SkeletonList } from "@/components/ui/empty-state";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
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

type ImageTab = "empty" | "full" | "back";

const IMAGE_TABS: { id: ImageTab; labelRU: string; labelEN: string }[] = [
  { id: "empty", labelRU: "Пустой", labelEN: "Empty" },
  { id: "full", labelRU: "Полный", labelEN: "Full" },
  { id: "back", labelRU: "Обратная", labelEN: "Back" },
];

export default function TownsTab() {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const [towns, setTowns] = useState<Town[]>([]);
  const [selectedTown, setSelectedTown] = useState<Town | null>(null);
  const [imageTab, setImageTab] = useState<ImageTab>("empty");
  const [buildings, setBuildings] = useState<TownBuilding[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    supabase.from("towns").select("*").order("sort_order").then(({ data }) => {
      if (data && data.length > 0) {
        setTowns(data as Town[]);
        setSelectedTown(data[0] as Town);
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!selectedTown) return;
    supabase
      .from("town_buildings")
      .select("*")
      .eq("town_id", selectedTown.id)
      .order("sort_order")
      .then(({ data }) => {
        setBuildings((data as TownBuilding[]) ?? []);
      });
  }, [selectedTown?.id]);

  const handleTownChange = (town: Town) => {
    setSelectedTown(town);
    setImageTab("empty");
    setImgError(false);
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
    selectedTown && imageTab === "full" ? selectedTown.image_full :
    selectedTown && imageTab === "back" ? selectedTown.image_back : null;

  const currentImageSrc = currentImageFile ? `${STORAGE}/towns/${currentImageFile}` : null;

  const notes = selectedTown
    ? (lang === "RU" ? (selectedTown.notes_ru || selectedTown.notes_en) : selectedTown.notes_en)
    : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-3 pt-3 pb-2 shrink-0 space-y-2">
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

        {/* Image tab switcher */}
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {IMAGE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleImageTabChange(tab.id)}
              className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                imageTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {lang === "RU" ? tab.labelRU : tab.labelEN}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pb-3 space-y-3">
        {/* Town board image */}
        {currentImageSrc && !imgError ? (
          <img
            src={currentImageSrc}
            alt={selectedTown ? name(selectedTown) : ""}
            className="w-full rounded-lg object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full rounded-lg bg-muted flex items-center justify-center py-12">
            <p className="text-xs text-muted-foreground">
              {lang === "RU" ? "Изображение недоступно" : "No image available"}
            </p>
          </div>
        )}

        {/* Notes */}
        {notes && (
          <div
            className="text-xs text-muted-foreground whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: renderGlyphs(notes, glyphs) }}
          />
        )}

        {/* Buildings list */}
        {buildings.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">
              {lang === "RU" ? "Постройки" : "Buildings"}
            </p>
            {buildings.map((b) => {
              const bName = lang === "RU" ? (b.name_ru || b.name_en) : b.name_en;
              const bEffect = lang === "RU" ? (b.effect_ru || b.effect_en) : b.effect_en;
              return (
                <div key={b.id} className="bg-muted rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="font-medium text-sm text-foreground"
                      dangerouslySetInnerHTML={{ __html: renderGlyphs(bName, glyphs) }}
                    />
                    {b.cost && (
                      <span
                        className="text-xs text-muted-foreground shrink-0 whitespace-pre-line"
                        dangerouslySetInnerHTML={{ __html: renderGlyphs(b.cost, glyphs) }}
                      />
                    )}
                  </div>
                  {bEffect && (
                    <div
                      className="text-xs text-muted-foreground mt-1 whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: renderGlyphs(bEffect, glyphs) }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
