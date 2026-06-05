import React from "react";
import { Info, Sun, Moon, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trackDonationIntent } from "@/lib/analytics";
import { useLang } from "@/context/LanguageContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import H3MasterSpinner from "@/components/H3MasterSpinner";
import { useNavSections } from "@/hooks/useNavSections";
import type { TabId } from "@/config/navItems";
export { navItems } from "@/config/navItems";
export type { TabId } from "@/config/navItems";

interface NavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  active: string;
  onChange: (tab: string) => void;
}

function NavItemList({ active, onChange, onSelect }: { active: string; onChange: (tab: string) => void; onSelect?: () => void }) {
  const { lang } = useLang();
  const items = useNavSections();
  return (
    <>
      {items.map(({ id, labelRU, labelEN, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => { onChange(id); onSelect?.(); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
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

function SettingsRow() {
  const { lang, toggleLang } = useLang();
  const [isDark, setIsDark] = React.useState(
    () => document.documentElement.classList.contains('dark')
  );

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="px-3 py-2.5 border-t border-border flex items-center justify-between gap-2">
      <button
        onClick={toggleLang}
        className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-bold rounded-lg bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        {lang === "RU" ? "RU / EN" : "EN / RU"}
      </button>
      <button
        onClick={toggleTheme}
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </div>
  );
}

function AboutLink({ onSelect }: { onSelect?: () => void }) {
  const { lang } = useLang();
  const navigate = useNavigate();
  return (
    <button
      onClick={() => { navigate("/about"); onSelect?.(); }}
      className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
    >
      <Info className="w-5 h-5 shrink-0" />
      {lang === "RU" ? "О приложении" : "About"}
    </button>
  );
}

function SupportLink({ onSelect }: { onSelect?: () => void }) {
  const { lang } = useLang();
  const navigate = useNavigate();
  const handleClick = () => {
    trackDonationIntent("sidebar");
    navigate("/donate");
    onSelect?.();
  };
  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-[#E1BB3A] hover:bg-[#E1BB3A]/10 transition-colors"
    >
      <span className="animate-heart-pulse">
        <Heart className="w-5 h-5 shrink-0" />
      </span>
      {lang === "RU" ? "Поддержать проект" : "Support the project"}
    </button>
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
            className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity text-foreground"
            aria-label="H3 Master — go to home"
          >
            <H3MasterSpinner variant="static" size={32} ariaLabel="H3 Master" />
            <span className="text-base font-semibold">H3 Master</span>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          <NavItemList active={active} onChange={onChange} />
        </nav>
        <SettingsRow />
        <SupportLink />
        <AboutLink />
        <div className="pb-2" />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-72 p-0 gap-0 flex flex-col lg:hidden">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-base text-left">
              <button
                onClick={goHome}
                className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity text-foreground"
                aria-label="H3 Master — go to home"
              >
                <H3MasterSpinner variant="static" size={28} ariaLabel="H3 Master" />
                <span className="text-base font-semibold">H3 Master</span>
              </button>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex-1 overflow-y-auto py-2">
            <NavItemList active={active} onChange={onChange} onSelect={() => onOpenChange(false)} />
          </nav>
          <SettingsRow />
          <SupportLink onSelect={() => onOpenChange(false)} />
          <AboutLink onSelect={() => onOpenChange(false)} />
          <div className="pb-2" />
        </SheetContent>
      </Sheet>
    </>
  );
}
