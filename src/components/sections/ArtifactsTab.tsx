import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;

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

interface Props { searchQuery?: string; }

export default function ArtifactsTab({ searchQuery = "" }: Props) {
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
  const afterQuality = filterQuality === "all" ? items : items.filter(i => i.quality === filterQuality);
  const q = searchQuery.toLowerCase();
  const filtered = searchQuery
    ? afterQuality.filter(i => {
        const fields = [i.name_en, i.name_ru, (i as any).ability_en, (i as any).ability_ru,
          (i as any).effect_en, (i as any).effect_ru, (i as any).effect_expert_en,
          (i as any).effect_empowered_en, (i as any).description_en, (i as any).description_ru];
        return fields.some(f => f && f.toLowerCase().includes(q));
      })
    : afterQuality;

  if (!loaded) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground text-sm">{lang === "RU" ? "Загрузка…" : "Loading…"}</p></div>;

  const name = (i: Artifact) => lang === "RU" ? (i.name_ru || i.name_en) : i.name_en;

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex gap-1.5 overflow-x-auto px-3 pt-3 pb-2 scrollbar-none shrink-0">
          {qualities.map(q => (
            <button key={q} onClick={() => setFilterQuality(q)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors capitalize ${filterQuality === q ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {q === "all" ? (lang === "RU" ? "Все" : "All") : q}
            </button>
          ))}
        </div>
        <div className="p-3 pt-0 overflow-y-auto flex-1">
          {filtered.length === 0 && searchQuery ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <Search size={32} />
              <p className="text-sm">{lang === "RU" ? "Ничего не найдено" : "Nothing found"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filtered.map((item) => {
                const imgSrc = item.image ? `${STORAGE}/artifacts/${item.image}` : null;
                return (
                  <button key={item.id} onClick={() => setSelected(item)}
                    className="flex flex-col rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary transition-colors">
                    <div className="aspect-square w-full bg-muted flex items-center justify-center overflow-hidden relative">
                      {imgSrc
                        ? <img src={imgSrc} alt={item.name_en} className="w-full h-full object-contain" />
                        : <p className="text-[10px] text-muted-foreground text-center px-1">{item.name_en}</p>
                      }
                      {item.quality && (
                        <span className={`absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize ${QUALITY_COLORS[item.quality] || "bg-muted text-muted-foreground"}`}>
                          {item.quality}
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

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected ? name(selected) : ""}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              {selected.image && <img src={`${STORAGE}/artifacts/${selected.image}`} alt={selected.name_en} className="w-full rounded-lg" />}
              {selected.quality && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${QUALITY_COLORS[selected.quality] || "bg-muted text-muted-foreground"}`}>{selected.quality}</span>}
              {selected.effect_en && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Эффект" : "Effect"}</p><p className="text-xs text-muted-foreground">{lang === "RU" ? (selected.effect_ru || selected.effect_en) : selected.effect_en}</p></div>}
              {selected.description_en && <div><p className="text-xs font-semibold text-foreground">{lang === "RU" ? "Описание" : "Description"}</p><p className="text-xs text-muted-foreground">{lang === "RU" ? (selected.description_ru || selected.description_en) : selected.description_en}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
