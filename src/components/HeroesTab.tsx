import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;

interface Hero {
  id: string;
  name_en: string;
  name_ru: string | null;
  town: string | null;
  class_en: string | null;
  class_ru: string | null;
  ability_id: string | null;
  specialty_en: string | null;
  specialty_ru: string | null;
  attack: number | null;
  defense: number | null;
  power: number | null;
  knowledge: number | null;
  specialty_levels: SpecialtyLevel[] | null;
  notes_en: string | null;
  notes_ru: string | null;
  image: string | null;
  sort_order: number | null;
}

interface SpecialtyLevel {
  level: string;
  image?: string;
  effect_en?: string;
}

function hasPortrait(image: string | null): boolean {
  return !!image && image.startsWith("heroes-");
}

function heroInitials(name: string): string {
  return name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function HeroesTab() {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [faction, setFaction] = useState("all");
  const [selected, setSelected] = useState<Hero | null>(null);
  const [specialtyTab, setSpecialtyTab] = useState(0);

  useEffect(() => {
    supabase.from("heroes").select("*").order("sort_order").then(({ data }) => {
      setHeroes((data as unknown as Hero[]) ?? []);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-muted-foreground text-sm">{lang === "RU" ? "Загрузка…" : "Loading…"}</p>
    </div>
  );

  const towns = Array.from(new Set(heroes.map(h => h.town).filter(Boolean) as string[])).sort();
  const filtered = faction === "all" ? heroes : heroes.filter(h => h.town === faction);

  const name = (h: Hero) => lang === "RU" && h.name_ru ? h.name_ru : h.name_en;
  const cls = (h: Hero) => lang === "RU" && h.class_ru ? h.class_ru : h.class_en;
  const specialty = (h: Hero) => lang === "RU" && h.specialty_ru ? h.specialty_ru : h.specialty_en;
  const notes = (h: Hero) => lang === "RU" && h.notes_ru ? h.notes_ru : h.notes_en;

  const stats = (h: Hero) => [
    { label: "ATK", value: h.attack },
    { label: "DEF", value: h.defense },
    { label: "PWR", value: h.power },
    { label: "KNW", value: h.knowledge },
  ];

  const levels = (h: Hero): SpecialtyLevel[] => {
    if (!h.specialty_levels) return [];
    if (Array.isArray(h.specialty_levels)) return h.specialty_levels;
    return [];
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFaction("all")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              faction === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {lang === "RU" ? "Все" : "All"}
          </button>
          {towns.map(t => (
            <button
              key={t}
              onClick={() => setFaction(t)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap capitalize ${
                faction === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pb-3 flex-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map(h => (
            <button key={h.id} onClick={() => setSelected(h)} className="bg-muted rounded-lg overflow-hidden text-left">
              {hasPortrait(h.image) ? (
                <img src={`${STORAGE}/heroes/${h.image}`} alt={name(h)} className="w-full aspect-[3/4] object-cover" />
              ) : (
                <div className="w-full aspect-[3/4] bg-muted-foreground/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground/40">{heroInitials(h.name_en)}</span>
                </div>
              )}
              <div className="p-2">
                <p className="text-sm font-medium text-foreground truncate">{name(h)}</p>
                {h.town && <p className="text-xs text-muted-foreground capitalize">{h.town}</p>}
                <div className="grid grid-cols-4 gap-1 mt-1">
                  {stats(h).map(s => (
                    <div key={s.label} className="bg-background rounded text-center text-xs py-0.5">
                      <span className="text-muted-foreground">{s.label}</span>{" "}
                      <span className="font-bold text-foreground">{s.value ?? "–"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogTitle className="sr-only">{name(selected)}</DialogTitle>
            {hasPortrait(selected.image) ? (
              <img src={`${STORAGE}/heroes/${selected.image}`} alt={name(selected)} className="w-full rounded-lg object-contain" />
            ) : (
              <div className="w-full aspect-[3/4] bg-muted-foreground/10 flex items-center justify-center rounded-lg">
                <span className="text-4xl font-bold text-muted-foreground/40">{heroInitials(selected.name_en)}</span>
              </div>
            )}

            <p className="text-lg font-semibold text-foreground">{name(selected)}</p>
            {cls(selected) && <p className="text-sm text-muted-foreground -mt-3">{cls(selected)}</p>}

            <div className="flex gap-2">
              {stats(selected).map(s => (
                <div key={s.label} className="flex-1 bg-muted rounded text-center text-xs py-1.5">
                  <span className="text-muted-foreground">{s.label}</span>{" "}
                  <span className="font-bold text-foreground">{s.value ?? "–"}</span>
                </div>
              ))}
            </div>

            {specialty(selected) && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">{lang === "RU" ? "Специальность" : "Specialty"}</p>
                <div className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderGlyphs(specialty(selected), glyphs) }} />
              </div>
            )}

            {levels(selected).length > 0 && (
              <div className="space-y-3">
                {levels(selected).map((lvl, i) => (
                  <div key={i} className="bg-muted rounded-lg p-3">
                    <span className="text-xs font-bold text-foreground">{lvl.level}</span>
                    {lvl.image && (
                      <img
                        src={`${STORAGE}/heroes/${lvl.image}`}
                        alt={lvl.level}
                        className="w-full object-contain mt-1"
                        onError={e => (e.currentTarget.style.display = "none")}
                      />
                    )}
                    {lvl.effect_en && (
                      <div className="text-xs text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: renderGlyphs(lvl.effect_en, glyphs) }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {notes(selected) && (
              <div className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderGlyphs(notes(selected), glyphs) }} />
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
