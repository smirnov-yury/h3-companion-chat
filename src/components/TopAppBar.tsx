import { Menu, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopAppBarProps {
  title: string;
  icon?: LucideIcon;
  onMenuClick: () => void;
}

export default function TopAppBar({ title, icon: Icon, onMenuClick }: TopAppBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-11 flex items-center justify-between px-3 bg-background border-b border-border lg:left-56">
      <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="Open menu" className="lg:hidden h-8 w-8">
        <Menu className="w-5 h-5" />
      </Button>
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="w-4 h-4 shrink-0 text-foreground" />}
        <span className="text-sm font-semibold truncate">{title}</span>
      </div>
      <div className="w-8" />
    </header>
  );
}
