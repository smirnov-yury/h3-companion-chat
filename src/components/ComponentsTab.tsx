import { useState } from "react";
import { useLang } from "@/context/LanguageContext";
import UnitsTab from "@/components/UnitsTab";
import WarMachinesTab from "@/components/sections/WarMachinesTab";
import PlaceholderTab from "@/components/PlaceholderTab";

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

interface ComponentsTabProps {
  onNavigateToRule?: (ruleId: string) => void;
}

export default function ComponentsTab({ onNavigateToRule }: ComponentsTabProps) {
  const { lang } = useLang();
  const [active, setActive] = useState<ComponentSection>("units");

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                active === s.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {lang === "RU" ? s.labelRU : s.labelEN}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {active === "units" ? (
          <UnitsTab />
        ) : (
          <PlaceholderTab
            title={
              lang === "RU"
                ? `${SECTIONS.find(s => s.id === active)?.labelRU} — в разработке`
                : `${SECTIONS.find(s => s.id === active)?.labelEN} — coming soon`
            }
          />
        )}
      </div>
    </div>
  );
}
