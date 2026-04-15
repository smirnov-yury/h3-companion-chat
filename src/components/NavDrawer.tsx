import { BookOpen, LayoutGrid, Map, Swords, Castle, User, MessageCircle } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type TabId = "rules" | "components" | "scenarios" | "units" | "towns" | "heroes" | "ai";

const navItems: { id: TabId; labelRU: string; labelEN: string; icon: typeof BookOpen }[] = [
  { id: "rules",      labelRU: "Правила",       labelEN: "Rules",          icon: BookOpen },
  { id: "components", labelRU: "Компоненты",     labelEN: "Components",     icon: LayoutGrid },
  { id: "scenarios",  labelRU: "Сценарии",       labelEN: "Scenarios",      icon: Map },
  { id: "units",      labelRU: "Юниты",          labelEN: "Units",          icon: Swords },
  { id: "towns",      labelRU: "Города",         labelEN: "Towns",          icon: Castle },
  { id: "heroes",     labelRU: "Герои",          labelEN: "Heroes",         icon: User },
  { id: "ai",         labelRU: "ИИ Мастер Игры", labelEN: "AI Game Master", icon: MessageCircle },
];

interface NavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  active: TabId;
  onChange: (tab: TabId) => void;
}

export default function NavDrawer({ open, onOpenChange, active, onChange }: NavDrawerProps) {
  const { lang, toggleLang } = useLang();

  const handleSelect = (id: TabId) => {
    onChange(id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 lg:w-64 p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="text-base">Heroes 3 Companion</SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map(({ id, labelRU, labelEN, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {lang === "RU" ? labelRU : labelEN}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={toggleLang}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {lang === "RU" ? "RU / EN" : "EN / RU"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
