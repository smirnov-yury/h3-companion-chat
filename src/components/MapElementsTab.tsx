import { useState } from "react";
import { Search } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import FieldsTab from "@/components/sections/FieldsTab";
import MapEventsTab from "@/components/sections/MapEventsTab";
import PandoraTab from "@/components/sections/PandoraTab";

type Section = "fields" | "map_events" | "pandora";

const SECTIONS: { id: Section; labelRU: string; labelEN: string }[] = [
  { id: "fields",     labelRU: "Поля",          labelEN: "Fields"        },
  { id: "map_events", labelRU: "События Карты", labelEN: "Map Events"    },
  { id: "pandora",    labelRU: "Ящик Пандоры",  labelEN: "Pandora's Box" },
];

interface Props {
  initialFilter?: string;
  initialCardId?: string;
  initialSearch?: string;
  onFilterChange?: (filterValue: string | null) => void;
  onCardOpen?: (cardId: string) => void;
  onCardClose?: () => void;
}

export default function MapElementsTab({ initialCardId, initialSearch, onCardOpen, onCardClose }: Props = {}) {
  const { lang } = useLang();
  const [active, setActive] = useState<Section>("fields");
  const [searchQuery, setSearchQuery] = useState(initialSearch ?? "");

  const handleSectionChange = (id: Section) => {
    setActive(id);
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 shrink-0 space-y-2">
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
              {lang === "RU" ? "Очистить" : "Clear"}
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
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
        {active === "fields"     ? <FieldsTab    searchQuery={searchQuery} initialCardId={initialCardId} onCardOpen={onCardOpen} onCardClose={onCardClose} /> :
         active === "map_events" ? <MapEventsTab searchQuery={searchQuery} initialCardId={initialCardId} onCardOpen={onCardOpen} onCardClose={onCardClose} /> :
         active === "pandora"    ? <PandoraTab   searchQuery={searchQuery} initialCardId={initialCardId} onCardOpen={onCardOpen} onCardClose={onCardClose} /> : null}
      </div>
    </div>
  );
}
