import React from "react";
import { BookOpen, Map, MapPin, CalendarDays, Layers, Swords, User, Castle, MessageCircle, Info, Sun, Moon, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useLang } from "@/context/LanguageContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type TabId = "rules" | "scenarios" | "map_elements" | "global_events" | "decks" | "units" | "heroes" | "towns" | "ai";

export const navItems: { id: TabId; labelRU: string; labelEN: string; icon: LucideIcon }[] = [
  { id: "rules",         labelRU: "Правила",            labelEN: "Rules",           icon: BookOpen },
  { id: "scenarios",     labelRU: "Сценарии",           labelEN: "Scenarios",       icon: Map },
  { id: "map_elements",  labelRU: "Элементы карты",     labelEN: "Map Elements",    icon: MapPin },
  { id: "global_events", labelRU: "Глобальные события", labelEN: "Global Events",   icon: CalendarDays },
  { id: "decks",         labelRU: "Колоды",             labelEN: "Decks",           icon: Layers },
  { id: "units",         labelRU: "Юниты",              labelEN: "Units",           icon: Swords },
  { id: "heroes",        labelRU: "Герои",              labelEN: "Heroes",          icon: User },
  { id: "towns",         labelRU: "Города",             labelEN: "Towns",           icon: Castle },
  { id: "ai",            labelRU: "ИИ Мастер игры",     labelEN: "AI Game Master",  icon: MessageCircle },
];

interface NavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  active: TabId;
  onChange: (tab: TabId) => void;
}

function NavItemList({ active, onChange, onSelect }: { active: TabId; onChange: (tab: TabId) => void; onSelect?: () => void }) {
  const { lang } = useLang();
  return (
    <>
      {navItems.map(({ id, labelRU, labelEN, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => { onChange(id); onSelect?.(); }}
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
    </>
  );
}

function LangToggle() {
  const { lang, toggleLang } = useLang();
  return (
    <div className="p-4 border-t border-border">
      <button
        onClick={toggleLang}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        {lang === "RU" ? "RU / EN" : "EN / RU"}
      </button>
    </div>
  );
}

function AboutLink({ onSelect }: { onSelect?: () => void }) {
  const { lang } = useLang();
  const navigate = useNavigate();
  return (
    <>
      <Separator />
      <button
        onClick={() => { navigate("/about"); onSelect?.(); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <Info className="w-5 h-5 shrink-0" />
        {lang === "RU" ? "О проекте" : "About"}
      </button>
    </>
  );
}

export default function NavDrawer({ open, onOpenChange, active, onChange }: NavDrawerProps) {
  const navigate = useNavigate();
  const goHome = () => {
    navigate("/");
    onOpenChange(false);
  };
  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-56 flex-col bg-background border-r border-border z-50">
        <div className="p-4 border-b border-border">
          <button
            onClick={goHome}
            className="text-base font-semibold cursor-pointer hover:text-primary transition-colors text-left"
          >
            Heroes 3 Companion
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          <NavItemList active={active} onChange={onChange} />
        </nav>
        <LangToggle />
        <AboutLink />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col lg:hidden">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-base text-left">
              <button onClick={goHome} className="cursor-pointer hover:text-primary transition-colors">
                Heroes 3 Companion
              </button>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex-1 overflow-y-auto py-2">
            <NavItemList active={active} onChange={onChange} onSelect={() => onOpenChange(false)} />
          </nav>
          <LangToggle />
          <AboutLink onSelect={() => onOpenChange(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
