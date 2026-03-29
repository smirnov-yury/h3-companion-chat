import { useState, useMemo, useCallback, useRef } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useRules, Component } from "@/context/RulesContext";
import { useLang } from "@/context/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const update = useCallback(
    (v: string) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setDebounced(v), delay);
    },
    [delay],
  );
  return [debounced, update] as const;
}

function ImagePlaceholder({ tag }: { tag: string }) {
  const lastWord = tag.replace(/\}$/, "").split(/[\s:/\\]+/).pop() || tag;
  return (
    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
      <span className="text-[8px] text-muted-foreground text-center leading-tight break-all px-0.5">
        {lastWord}
      </span>
    </div>
  );
}

const IMG_TAG_RE = /\{img:[^}]+\}/;
const UNIT_RE = /\{img:[^_]+_unit/;

function ComponentImage({ image }: { image: string }) {
  if (!image) return <div className="w-12 h-12 rounded bg-muted" />;
  const match = image.match(IMG_TAG_RE);
  if (match) return <ImagePlaceholder tag={match[0]} />;
  return <div className="w-12 h-12 rounded bg-muted" />;
}

function getComponentCategory(image: string): string {
  const m = image.match(/\{img:[^_}]+_([^_}]+)/);
  return m?.[1] ?? "other";
}

function getFaction(image: string): string {
  const match = image.match(/\{img:([^_]+)_unit/);
  const folder = match?.[1] ?? "other";
  const neutrals = ["tray", "design", "supp", "naval", "tournament"];
  if (neutrals.includes(folder)) return "neutral";
  return folder;
}

const CATEGORY_LABELS: Record<string, { ru: string; en: string }> = {
  unit: { ru: "Юниты", en: "Units" },
  card: { ru: "Карты", en: "Cards" },
  hero: { ru: "Герои", en: "Heroes" },
  token: { ru: "Жетоны", en: "Tokens" },
  icon: { ru: "Иконки", en: "Icons" },
  schema: { ru: "Схемы", en: "Schemas" },
  game: { ru: "Игровое", en: "Game" },
  book: { ru: "Книги", en: "Books" },
  mission: { ru: "Миссии", en: "Missions" },
  location: { ru: "Локации", en: "Locations" },
  rule: { ru: "Правила", en: "Rules" },
  miss: { ru: "Разное", en: "Misc" },
  other: { ru: "Прочее", en: "Other" },
};

const FACTION_LABELS: Record<string, { ru: string; en: string }> = {
  castle: { ru: "Замок", en: "Castle" },
  tower: { ru: "Башня", en: "Tower" },
  inferno: { ru: "Инферно", en: "Inferno" },
  fortress: { ru: "Крепость", en: "Fortress" },
  conflux: { ru: "Сплетение", en: "Conflux" },
  cove: { ru: "Причал", en: "Cove" },
  neutral: { ru: "Нейтральные", en: "Neutral" },
};

const CATEGORY_ORDER = ["unit", "card", "hero", "token", "icon", "schema", "game", "book", "mission", "location", "rule", "miss", "other"];

interface ComponentsTabProps {
  onNavigateToRule?: (ruleId: string) => void;
}

export default function ComponentsTab({ onNavigateToRule }: ComponentsTabProps) {
  const { components, loaded } = useRules();
  const { lang } = useLang();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useDebounce("", 300);
  const [selected, setSelected] = useState<Component | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeFaction, setActiveFaction] = useState<string>("all");

  const grouped = useMemo(() => {
    const map: Record<string, Component[]> = {};
    for (const c of components) {
      const cat = getComponentCategory(c.image);
      (map[cat] ??= []).push(c);
    }
    return map;
  }, [components]);

  const categories = useMemo(() => {
    return CATEGORY_ORDER.filter((k) => grouped[k]?.length);
  }, [grouped]);

  const categoryItems = useMemo(() => {
    if (!activeCategory) return [];
    const items = grouped[activeCategory] ?? [];
    const q = debouncedSearch.toLowerCase();
    if (q.length < 2) return items;
    return items.filter((c) => {
      const title = lang === "RU" ? (c.title_ru || c.title_en) : (c.title_en || c.title_ru);
      return (title || "").toLowerCase().includes(q);
    });
  }, [activeCategory, grouped, debouncedSearch, lang]);

  const availableFactions = useMemo(() => {
    if (activeCategory !== "unit") return [];
    const set = new Set<string>();
    for (const u of categoryItems) set.add(getFaction(u.image));
    return Object.keys(FACTION_LABELS).filter((f) => set.has(f));
  }, [activeCategory, categoryItems]);

  const displayedItems = useMemo(() => {
    if (activeCategory !== "unit" || activeFaction === "all") return categoryItems;
    return categoryItems.filter((u) => getFaction(u.image) === activeFaction);
  }, [activeCategory, activeFaction, categoryItems]);

  const handleSearch = (v: string) => {
    setSearch(v);
    setDebouncedSearch(v);
  };

  const openCategory = (cat: string) => {
    setActiveCategory(cat);
    setActiveFaction("all");
    setSearch("");
    setDebouncedSearch("");
  };

  if (!loaded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-sm">{lang === "RU" ? "Загрузка…" : "Loading…"}</p>
      </div>
    );
  }

  const selectedTitle = selected
    ? lang === "RU" ? (selected.title_ru || selected.title_en) : (selected.title_en || selected.title_ru)
    : "";
  const selectedDesc = selected
    ? lang === "RU" ? (selected.description_ru || selected.description_en) : (selected.description_en || selected.description_ru)
    : "";

  // Category list view
  if (!activeCategory) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-1.5">
            {categories.map((cat) => {
              const label = lang === "RU" ? CATEGORY_LABELS[cat]?.ru : CATEGORY_LABELS[cat]?.en;
              const count = grouped[cat]?.length ?? 0;
              return (
                <button
                  key={cat}
                  onClick={() => openCategory(cat)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
                >
                  <span className="text-sm font-medium text-card-foreground">{label || cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{count}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Category detail view
  const catLabel = lang === "RU" ? CATEGORY_LABELS[activeCategory]?.ru : CATEGORY_LABELS[activeCategory]?.en;

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button + search */}
      <div className="px-3 pt-3 pb-2 shrink-0 space-y-2">
        <button
          onClick={() => setActiveCategory(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{catLabel || activeCategory}</span>
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={lang === "RU" ? "Поиск…" : "Search…"}
            className="w-full rounded-xl bg-input pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {/* Faction pills — only for units */}
        {activeCategory === "unit" && availableFactions.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveFaction("all")}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFaction === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {lang === "RU" ? "Все" : "All"}
            </button>
            {availableFactions.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFaction(f)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeFaction === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {lang === "RU" ? FACTION_LABELS[f].ru : FACTION_LABELS[f].en}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {displayedItems.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            {lang === "RU" ? "Ничего не найдено" : "Nothing found"}
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {displayedItems.map((comp) => {
              const title = lang === "RU" ? (comp.title_ru || comp.title_en) : (comp.title_en || comp.title_ru);
              return (
                <button
                  key={comp.id}
                  onClick={() => setSelected(comp)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
                >
                  <ComponentImage image={comp.image} />
                  <span className="text-[10px] text-card-foreground text-center leading-tight line-clamp-2">
                    {title}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedTitle}</DialogTitle>
          </DialogHeader>
          {selectedDesc && (
            <DialogDescription className="text-sm text-muted-foreground whitespace-pre-line">
              {selectedDesc}
            </DialogDescription>
          )}
          {selected?.rule_id && onNavigateToRule && (
            <div className="pt-2">
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => {
                  const ruleId = selected.rule_id!;
                  setSelected(null);
                  onNavigateToRule(ruleId);
                }}
              >
                {lang === "RU" ? "Перейти к правилу" : "Go to rule"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
