import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import ArtifactsTab from "@/components/sections/ArtifactsTab";
import SpellsTab from "@/components/sections/SpellsTab";
import AbilitiesTab from "@/components/sections/AbilitiesTab";
import StatisticsTab from "@/components/sections/StatisticsTab";
import WarMachinesTab from "@/components/sections/WarMachinesTab";

type DeckSection = "artifacts" | "spells" | "abilities" | "attributes" | "war_machines";

const SECTIONS: { id: DeckSection; slug: string; labelRU: string; labelEN: string }[] = [
  { id: "artifacts",    slug: "artifacts",   labelRU: "Артефакты",     labelEN: "Artifacts"    },
  { id: "spells",       slug: "spells",      labelRU: "Заклинания",    labelEN: "Spells"       },
  { id: "abilities",    slug: "abilities",   labelRU: "Умения",        labelEN: "Abilities"    },
  { id: "attributes",   slug: "attributes",  labelRU: "Атрибуты",      labelEN: "Attributes"   },
  { id: "war_machines", slug: "warmachines", labelRU: "Боевые машины", labelEN: "War Machines" },
];

interface Props {
  initialSubtype?: string;
  initialFilter?: string;
  initialCardId?: string;
  initialSearch?: string;
  /** Single segment after subtype that could be filter OR card; resolved by inner tab. */
  initialAmbiguous?: string;
  onSubtypeChange?: (subtype: string) => void;
  onFilterChange?: (subtype: string, filterValue: string | null) => void;
  onCardOpen?: (subtype: string, filterValue: string | null, cardId: string) => void;
  onCardClose?: (subtype: string, filterValue: string | null) => void;
}

export default function DecksTab({
  initialSubtype, initialFilter, initialCardId, initialAmbiguous, initialSearch,
  onSubtypeChange, onFilterChange, onCardOpen, onCardClose,
}: Props = {}) {
  const { lang } = useLang();
  const [active, setActive] = useState<DeckSection>("artifacts");
  const [searchQuery, setSearchQuery] = useState(initialSearch ?? "");

  // Sync URL subtype → internal active subtab (graceful fallback)
  useEffect(() => {
    if (!initialSubtype) { setActive("artifacts"); return; }
    const match = SECTIONS.find((s) => s.slug === initialSubtype);
    if (match) setActive(match.id);
  }, [initialSubtype]);

  const handleSectionChange = (id: DeckSection) => {
    setActive(id);
    setSearchQuery("");
    const def = SECTIONS.find((s) => s.id === id);
    if (def) onSubtypeChange?.(def.slug);
  };

  const activeSlug = SECTIONS.find((s) => s.id === active)?.slug ?? "artifacts";
  const handleInnerFilterChange = (filterValue: string | null) => {
    onFilterChange?.(activeSlug, filterValue);
  };
  const handleInnerCardOpen = (currentFilter: string | null, cardId: string) => {
    onCardOpen?.(activeSlug, currentFilter, cardId);
  };
  const handleInnerCardClose = (currentFilter: string | null) => {
    onCardClose?.(activeSlug, currentFilter);
  };

  // For ambiguous segment: pass to inner tab as both initialFilter and initialCardId
  const innerFilter = initialFilter ?? initialAmbiguous;
  const innerCardId = initialCardId ?? initialAmbiguous;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-3 shrink-0 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === "RU" ? "Поиск…" : "Search…"}
            className="w-full bg-muted rounded-lg pl-8 pr-16 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSectionChange(s.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                active === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {lang === "RU" ? s.labelRU : s.labelEN}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {active === "artifacts"    ? <ArtifactsTab    searchQuery={searchQuery} initialFilter={innerFilter} initialCardId={innerCardId} onFilterChange={handleInnerFilterChange} onCardOpen={handleInnerCardOpen} onCardClose={handleInnerCardClose} /> :
         active === "spells"       ? <SpellsTab       searchQuery={searchQuery} initialFilter={innerFilter} initialCardId={innerCardId} onFilterChange={handleInnerFilterChange} onCardOpen={handleInnerCardOpen} onCardClose={handleInnerCardClose} /> :
         active === "abilities"    ? <AbilitiesTab    searchQuery={searchQuery} initialCardId={innerCardId} onCardOpen={(id) => handleInnerCardOpen(null, id)} onCardClose={() => handleInnerCardClose(null)} /> :
         active === "attributes"   ? <StatisticsTab   searchQuery={searchQuery} initialFilter={innerFilter} initialCardId={innerCardId} onFilterChange={handleInnerFilterChange} onCardOpen={handleInnerCardOpen} onCardClose={handleInnerCardClose} /> :
         active === "war_machines" ? <WarMachinesTab  searchQuery={searchQuery} initialCardId={innerCardId} onCardOpen={(id) => handleInnerCardOpen(null, id)} onCardClose={() => handleInnerCardClose(null)} /> : null}
      </div>
    </div>
  );
}
