import { BookOpen, LayoutGrid, Map, Castle, MessageCircle } from "lucide-react";

export type TabId = "rules" | "components" | "setup" | "city" | "ai";

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof BookOpen }[] = [
  { id: "rules", label: "Правила", icon: BookOpen },
  { id: "components", label: "Компоненты", icon: LayoutGrid },
  { id: "setup", label: "Сетап", icon: Map },
  { id: "city", label: "Город", icon: Castle },
  { id: "ai", label: "ИИ Мастер", icon: MessageCircle },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="flex items-center justify-around border-t border-border bg-background px-1 py-2 shrink-0">
      {tabs.map(({ id, label, icon: Icon }) => {
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
            {label}
          </button>
        );
      })}
    </nav>
  );
}
