import { useState } from "react";
import { useLang } from "@/context/LanguageContext";
import UnitsTab from "@/components/UnitsTab";
import WarMachinesTab from "@/components/sections/WarMachinesTab";
import EventsTab from "@/components/sections/EventsTab";
import SpellsTab from "@/components/sections/SpellsTab";
import ArtifactsTab from "@/components/sections/ArtifactsTab";
import AbilitiesTab from "@/components/sections/AbilitiesTab";
import AstrologersTab from "@/components/sections/AstrologersTab";
import FieldsTab from "@/components/sections/FieldsTab";

type ComponentSection = "units" | "war_machines" | "events" | "spells" | "artifacts" | "abilities" | "astrologers" | "fields";

const SECTIONS: { id: ComponentSection; labelRU: string; labelEN: string }[] = [
  { id: "units",        labelRU: "Юниты",        labelEN: "Units"        },
  { id: "war_machines", labelRU: "Боевые машины", labelEN: "War Machines" },
  { id: "events",       labelRU: "События",       labelEN: "Events"       },
  { id: "spells",       labelRU: "Заклинания",    labelEN: "Spells"       },
  { id: "artifacts",    labelRU: "Артефакты",     labelEN: "Artifacts"    },
  { id: "abilities",    labelRU: "Умения",        labelEN: "Abilities"    },
  { id: "astrologers",  labelRU: "Астрологи",     labelEN: "Astrologers"  },
  { id: "fields",       labelRU: "Поля",          labelEN: "Fields"       },
];

const SECTION_COMPONENTS: Record<ComponentSection, React.ComponentType> = {
  units: UnitsTab,
  war_machines: WarMachinesTab,
  events: EventsTab,
  spells: SpellsTab,
  artifacts: ArtifactsTab,
  abilities: AbilitiesTab,
  astrologers: AstrologersTab,
  fields: FieldsTab,
};

interface ComponentsTabProps {
  onNavigateToRule?: (ruleId: string) => void;
}

export default function ComponentsTab({ onNavigateToRule }: ComponentsTabProps) {
  const { lang } = useLang();
  const [active, setActive] = useState<ComponentSection>("units");

  const ActiveComponent = SECTION_COMPONENTS[active];

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
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
        <ActiveComponent />
      </div>
    </div>
  );
}
