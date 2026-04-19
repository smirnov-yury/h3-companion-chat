import { useState } from "react";
import { Search, X } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import FieldsTab from "@/components/sections/FieldsTab";

interface Props {
  initialFilter?: string;
  onFilterChange?: (filterValue: string | null) => void;
}

export default function MapElementsTab({ initialFilter, onFilterChange: _onFilterChange }: Props = {}) {
  const { lang } = useLang();
  const [searchQuery, setSearchQuery] = useState("");

  // initialFilter is propagated to FieldsTab; no UI exists yet to surface filter changes
  // upward, so onFilterChange is currently unused. Wired for symmetry / future filter UI.

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 shrink-0">
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
        <FieldsTab searchQuery={searchQuery} filterSlug={initialFilter} />
      </div>
    </div>
  );
}
