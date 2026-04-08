import { BookOpen, LayoutGrid, Swords, Castle, MessageCircle, Map } from "lucide-react";
import { useLang } from "@/context/LanguageContext";

export type TabId = "rules" | "components" | "scenarios" | "units" | "towns" | "heroes" | "ai";

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const tabs: { id: TabId; labelRU: string; labelEN: string; icon: typeof BookOpen }[] = [
  { id: "rules",      labelRU: "Правила",    labelEN: "Rules",      icon: BookOpen     },
  { id: "components", labelRU: "Компоненты", labelEN: "Components", icon: LayoutGrid   },
  { id: "scenarios",  labelRU: "Сценарии",   labelEN: "Scenarios",  icon: Map          },
  { id: "units",      labelRU: "Юниты",      labelEN: "Units",      icon: Swords       },
  { id: "towns",      labelRU: "Города",     labelEN: "Towns",      icon: Castle       },
  { id: "heroes",     labelRU: "Герои",      labelEN: "Heroes",     icon: Map          },
  { id: "ai",         labelRU: "ИИ",         labelEN: "AI",         icon: MessageCircle },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  const { lang, toggleLang } = useLang();
  return (
    <nav className="flex items-center border-t border-border bg-background px-1 py-2 shrink-0">
      <div className="flex flex-1 items-center justify-around">
        {tabs.map(({ id, labelRU, labelEN, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {lang === "RU" ? labelRU : labelEN}
            </button>
          );
        })}
      </div>
      <button
        onClick={toggleLang}
        className="shrink-0 mr-2 px-2.5 py-1 text-[10px] font-bold rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        {lang}
      </button>
    </nav>
  );
}
