import { useState } from "react";
import { Search, X } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import EventsTab from "@/components/sections/EventsTab";
import AstrologersTab from "@/components/sections/AstrologersTab";

type Section = "events" | "astrologers";

const SECTIONS: { id: Section; labelRU: string; labelEN: string }[] = [
  { id: "events",      labelRU: "События",   labelEN: "Events"               },
  { id: "astrologers", labelRU: "Астрологи", labelEN: "Astrologers Proclaim" },
];

export default function GlobalEventsTab() {
  const { lang } = useLang();
  const [active, setActive] = useState<Section>("events");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSectionChange = (id: Section) => {
    setActive(id);
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 shrink-0 space-y-2">
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
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSectionChange(s.id)}
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
        {active === "events"      ? <EventsTab searchQuery={searchQuery} /> :
         active === "astrologers" ? <AstrologersTab searchQuery={searchQuery} /> : null}
      </div>
    </div>
  );
}
