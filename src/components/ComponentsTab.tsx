import { useState, useMemo, useCallback, useRef } from "react";
import { Search } from "lucide-react";
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
  if (!image) {
    return <div className="w-12 h-12 rounded bg-muted" />;
  }
  const match = image.match(IMG_TAG_RE);
  if (match) {
    return <ImagePlaceholder tag={match[0]} />;
  }
  return <div className="w-12 h-12 rounded bg-muted" />;
}

function getFaction(image: string): string {
  const match = image.match(/\{img:([^_]+)_unit/);
  const folder = match?.[1] ?? "other";
  const neutrals = ["tray", "design", "supp", "naval", "tournament"];
  if (neutrals.includes(folder)) return "neutral";
  return folder;
}

const FACTION_LABELS: Record<string, { ru: string; en: string }> = {
  castle: { ru: "Замок", en: "Castle" },
  tower: { ru: "Башня", en: "Tower" },
  inferno: { ru: "Инферно", en: "Inferno" },
  fortress: { ru: "Крепость", en: "Fortress" },
  conflux: { ru: "Сплетение", en: "Conflux" },
  cove: { ru: "Причал", en: "Cove" },
  neutral: { ru: "Нейтральные", en: "Neutral" },
};

interface ComponentsTabProps {
  onNavigateToRule?: (ruleId: string) => void;
}

export default function ComponentsTab({ onNavigateToRule }: ComponentsTabProps) {
  const { components, loaded } = useRules();
  const { lang } = useLang();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useDebounce("", 300);
  const [selected, setSelected] = useState<Component | null>(null);
  const [activeFaction, setActiveFaction] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    if (q.length < 2) return components;
    return components.filter((c) => {
      const title = lang === "RU" ? (c.title_ru || c.title_en) : (c.title_en || c.title_ru);
      return (title || "").toLowerCase().includes(q);
    });
  }, [components, debouncedSearch, lang]);

  const { units, nonUnits } = useMemo(() => {
    const u: Component[] = [];
    const n: Component[] = [];
    for (const c of filtered) {
      if (UNIT_RE.test(c.image)) u.push(c);
      else n.push(c);
    }
    return { units: u, nonUnits: n };
  }, [filtered]);

  const availableFactions = useMemo(() => {
    const set = new Set<string>();
    for (const u of units) set.add(getFaction(u.image));
    return Object.keys(FACTION_LABELS).filter((f) => set.has(f));
  }, [units]);

  const displayedUnits = useMemo(() => {
    if (activeFaction === "all") return units;
    return units.filter((u) => getFaction(u.image) === activeFaction);
  }, [units, activeFaction]);

  const handleSearch = (v: string) => {
    setSearch(v);
    setDebouncedSearch(v);
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

  const renderGrid = (items: Component[]) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
      {items.map((comp) => {
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
  );

  const totalVisible = nonUnits.length + displayedUnits.length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={lang === "RU" ? "Поиск компонентов…" : "Search components…"}
            className="w-full rounded-xl bg-input pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {totalVisible === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            {lang === "RU" ? "Ничего не найдено" : "Nothing found"}
          </p>
        ) : (
          <div className="space-y-4">
            {nonUnits.length > 0 && renderGrid(nonUnits)}

            {units.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {lang === "RU" ? "Юниты" : "Units"}
                </h3>
                {availableFactions.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
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
                {displayedUnits.length > 0 ? renderGrid(displayedUnits) : (
                  <p className="text-muted-foreground text-xs text-center py-4">
                    {lang === "RU" ? "Нет юнитов" : "No units"}
                  </p>
                )}
              </div>
            )}
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
