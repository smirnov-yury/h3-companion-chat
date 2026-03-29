import { useState, useMemo, useCallback, useRef } from "react";
import { Search, X } from "lucide-react";
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

interface ComponentsTabProps {
  onNavigateToRule?: (ruleId: string) => void;
}

export default function ComponentsTab({ onNavigateToRule }: ComponentsTabProps) {
  const { components, loaded } = useRules();
  const { lang } = useLang();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useDebounce("", 300);
  const [selected, setSelected] = useState<Component | null>(null);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    if (q.length < 2) return components;
    return components.filter((c) => {
      const title = lang === "RU" ? (c.title_ru || c.title_en) : (c.title_en || c.title_ru);
      return (title || "").toLowerCase().includes(q);
    });
  }, [components, debouncedSearch, lang]);

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
        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            {lang === "RU" ? "Ничего не найдено" : "Nothing found"}
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {filtered.map((comp) => {
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
