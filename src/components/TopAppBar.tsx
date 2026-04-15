import { Menu } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";

interface TopAppBarProps {
  title: string;
  onMenuClick: () => void;
}

export default function TopAppBar({ title, onMenuClick }: TopAppBarProps) {
  const { lang, toggleLang } = useLang();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-3 bg-background border-b border-border lg:left-56">
      <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="Open menu" className="lg:hidden">
        <Menu className="w-5 h-5" />
      </Button>
      <span className="text-sm font-semibold truncate">{title}</span>
      <Button
        variant="secondary"
        size="sm"
        onClick={toggleLang}
        className="text-xs font-bold rounded-full px-3 h-8 lg:hidden"
      >
        {lang}
      </Button>
      <div className="hidden lg:block w-8" />
    </header>
  );
}
