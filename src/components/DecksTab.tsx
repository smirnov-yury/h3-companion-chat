import { useState } from "react";
import { Search, X } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import ArtifactsTab from "@/components/sections/ArtifactsTab";
import SpellsTab from "@/components/sections/SpellsTab";
import AbilitiesTab from "@/components/sections/AbilitiesTab";
import StatisticsTab from "@/components/sections/StatisticsTab";
import WarMachinesTab from "@/components/sections/WarMachinesTab";

type DeckSection = "artifacts" | "spells" | "abilities" | "attributes" | "war_machines";

const SECTIONS: { id: DeckSection; labelRU: string; labelEN: string }[] = [
  { id: "artifacts",    labelRU: "Артефакты",    labelEN: "Artifacts"    },
  { id: "spells",       labelRU: "Заклинания",   labelEN: "Spells"       },
  { id: "abilities",    labelRU: "Умения",       labelEN: "Abilities"    },
  { id: "attributes",   labelRU: "Атрибуты",     labelEN: "Attributes"   },
  { id: "war_machines", labelRU: "Боевые машины", labelEN: "War Machines" },
];

export default function DecksTab() {
  const { lang } = useLang();
  const [active, setActive] = useState<DeckSection>("artifacts");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSectionChange = (id: DeckSection) => {
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
            className="w-full bg-muted rounded-lg pl-8 pr-8 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
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
        {active === "artifacts"    ? <ArtifactsTab searchQuery={searchQuery} /> :
         active === "spells"       ? <SpellsTab searchQuery={searchQuery} /> :
         active === "abilities"    ? <AbilitiesTab searchQuery={searchQuery} /> :
         active === "attributes"   ? <StatisticsTab searchQuery={searchQuery} /> :
         active === "war_machines" ? <WarMachinesTab searchQuery={searchQuery} /> : null}
      </div>
    </div>
  );
}
