import { useState } from "react";
import { Search, X } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import WarMachinesTab from "@/components/sections/WarMachinesTab";
import EventsTab from "@/components/sections/EventsTab";
import SpellsTab from "@/components/sections/SpellsTab";
import ArtifactsTab from "@/components/sections/ArtifactsTab";
import AbilitiesTab from "@/components/sections/AbilitiesTab";
import AstrologersTab from "@/components/sections/AstrologersTab";
import FieldsTab from "@/components/sections/FieldsTab";
import StatisticsTab from "@/components/sections/StatisticsTab";

type ComponentSection = "war_machines" | "events" | "spells" | "artifacts" | "abilities" | "astrologers" | "fields" | "statistics";

const SECTIONS: { id: ComponentSection; labelRU: string; labelEN: string }[] = [
  { id: "war_machines", labelRU: "Боевые машины", labelEN: "War Machines" },
  { id: "events",       labelRU: "События",       labelEN: "Events"       },
  { id: "spells",       labelRU: "Заклинания",    labelEN: "Spells"       },
  { id: "artifacts",    labelRU: "Артефакты",     labelEN: "Artifacts"    },
  { id: "abilities",    labelRU: "Умения",        labelEN: "Abilities"    },
  { id: "astrologers",  labelRU: "Астрологи",     labelEN: "Astrologers"  },
  { id: "fields",       labelRU: "Поля",          labelEN: "Fields"       },
  { id: "statistics",   labelRU: "Статистики",    labelEN: "Statistics"   },
];

interface ComponentsTabProps {
  onNavigateToRule?: (ruleId: string) => void;
}

export default function ComponentsTab({ onNavigateToRule }: ComponentsTabProps) {
  const { lang } = useLang();
  const [active, setActive] = useState<ComponentSection>("war_machines");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSectionChange = (id: ComponentSection) => {
    setActive(id);
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 shrink-0 space-y-2">
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
      </div>
      <div className="flex-1 overflow-hidden">
        {active === "war_machines" ? <WarMachinesTab searchQuery={searchQuery} /> :
         active === "events"       ? <EventsTab searchQuery={searchQuery} /> :
         active === "spells"       ? <SpellsTab searchQuery={searchQuery} /> :
         active === "artifacts"    ? <ArtifactsTab searchQuery={searchQuery} /> :
         active === "abilities"    ? <AbilitiesTab searchQuery={searchQuery} /> :
         active === "astrologers"  ? <AstrologersTab searchQuery={searchQuery} /> :
         active === "fields"       ? <FieldsTab searchQuery={searchQuery} /> :
         active === "statistics"  ? <StatisticsTab searchQuery={searchQuery} /> : null}
      </div>
    </div>
  );
}
