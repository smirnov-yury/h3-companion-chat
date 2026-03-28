import { useState, useMemo, useCallback, useRef } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { useRules, Rule } from "@/context/RulesContext";
import { useLang } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";

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

const IMG_TAG_RE = /\{img:[^}]+\}/g;

function renderTextWithBadges(text: string) {
  const parts: (string | JSX.Element)[] = [];
  let last = 0;
  for (const match of text.matchAll(IMG_TAG_RE)) {
    const idx = match.index!;
    if (idx > last) parts.push(text.slice(last, idx));
    const tag = match[0];
    const lastWord = tag.replace(/\}$/, "").split(/[\s:/\\]+/).pop() || tag;
    parts.push(
      <Badge key={idx} variant="secondary" className="mx-0.5 text-[10px] py-0">
        🖼 {lastWord}
      </Badge>,
    );
    last = idx + tag.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function formatCategoryEN(key: string): string {
  return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/** Group rules by translated category name to merge duplicates like "event"/"events" */
function getTranslatedCategory(rule: Rule, lang: string): string {
  if (lang === "RU") {
    return rule.category || "";
  }
  return rule.category ? formatCategoryEN(rule.category) : "";
}

export default function RulesTab() {
  const { rules, loaded } = useRules();
  const { lang } = useLang();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useDebounce("", 300);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Build categories from translated names (merges duplicates)
  const categories = useMemo(
    () => Array.from(new Set(rules.map((r) => getTranslatedCategory(r, lang)).filter(Boolean))).sort(),
    [rules, lang],
  );

  const filtered = useMemo(() => {
    let list = rules;
    if (selectedCategory) {
      list = list.filter((r) => getTranslatedCategory(r, lang) === selectedCategory);
    }
    const q = debouncedSearch.toLowerCase();
    if (q.length >= 2) {
      list = list.filter((r) => {
        const title = lang === "RU" ? (r.title_ru || r.title_en) : (r.title_en || r.title_ru);
        const text = lang === "RU" ? (r.text_ru || r.text_en) : (r.text_en || r.text_ru);
        const hay = `${title || ""} ${text || ""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [rules, selectedCategory, debouncedSearch, lang]);

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

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={lang === "RU" ? "Поиск правил…" : "Search rules…"}
            className="w-full rounded-xl bg-input pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="px-3 pb-2 shrink-0 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 w-max">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {lang === "RU" ? "Все" : "All"}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">
            {lang === "RU" ? "Ничего не найдено" : "Nothing found"}
          </p>
        )}
        {filtered.map((rule) => {
          const isOpen = expandedId === rule.id;
          const title = lang === "RU" ? (rule.title_ru || rule.title_en) : (rule.title_en || rule.title_ru);
          const text = lang === "RU" ? (rule.text_ru || rule.text_en) : (rule.text_en || rule.text_ru);
          return (
            <div key={rule.id} className="rounded-xl bg-card border border-border overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : rule.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-sm font-medium text-card-foreground leading-snug pr-2">
                  {title}
                </span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {renderTextWithBadges(text || "")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
