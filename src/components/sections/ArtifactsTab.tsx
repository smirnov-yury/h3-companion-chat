import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";

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
  common:    "bg-muted text-muted-foreground",
  uncommon:  "bg-green-500/10 text-green-600",
  rare:      "bg-blue-500/10 text-blue-600",
  epic:      "bg-purple-500/10 text-purple-600",
  legendary: "bg-orange-500/10 text-orange-600",
};

export default function ArtifactsTab() {
  const { lang } = useLang();
  const [items, setItems] = useState<Artifact[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Artifact | null>(null);
  const [filterQuality, setFilterQuality] = useState("all");

  useEffect(() => {
    supabase.from("artifacts").select("*").order("sort_order").then(({ data }) => {
      if (data) setItems(data as Artifact[]);
      setLoaded(true);
    });
  }, []);

  const qualities = ["all", ...Array.from(new Set(items.map(i => i.quality).filter(Boolean))) as string[]];
  const filtered = filterQuality === "all" ? items : items.filter(i => i.quality === filterQuality);

  if (!loaded) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground text-sm">{lang === "RU" ? "Загрузка…" : "Loading…"}</p></div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1.5 overflow-x-auto px-3 pt-3 pb-2 scrollbar-none shrink-0">
        {qualities.map(q => (
          <button key={q} onClick={() => setFilterQuality(q)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors capitalize ${filterQuality === q ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {q === "all" ? (lang === "RU" ? "Все" : "All") : q}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3 p-3 pt-0 overflow-y-auto flex-1">
        {filtered.map((item) => (
          <button key={item.id} onClick={() => setSelected(selected?.id === item.id ? null : item)}
            className="text-left w-full rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {item.image ? <img src={item.image} alt={item.name_en} className="w-full h-full object-contain" /> : <span className="text-[10px] text-muted-foreground text-center leading-tight">{item.name_en}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-foreground truncate">{lang === "RU" ? (item.name_ru || item.name_en) : item.name_en}</p>
                  {item.quality && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${QUALITY_COLORS[item.quality] || "bg-muted text-muted-foreground"}`}>{item.quality}</span>}
                </div>
                {item.effect_en && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{lang === "RU" ? (item.effect_ru || item.effect_en) : item.effect_en}</p>}
              </div>
            </div>
            {selected?.id === item.id && (
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                {item.effect_en && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p><p className="text-xs text-muted-foreground">{lang === "RU" ? (item.effect_ru || item.effect_en) : item.effect_en}</p></div>}
                {item.description_en && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Описание" : "Description"}</p><p className="text-xs text-muted-foreground">{lang === "RU" ? (item.description_ru || item.description_en) : item.description_en}</p></div>}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
