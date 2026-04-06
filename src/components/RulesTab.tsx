import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, Swords, HelpCircle } from "lucide-react";
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

const RULE_CATEGORIES: { key: string; ru: string; en: string }[] = [
  { key: "alliance", ru: "Альянс", en: "Alliance" },
  { key: "astrologers", ru: "Астрологи", en: "Astrologers" },
  { key: "astrologers_proclaim", ru: "Провозглашение астрологов", en: "Astrologers' Proclamation" },
  { key: "campaign", ru: "Кампания", en: "Campaign" },
  { key: "campaign_combat", ru: "Бой в кампании", en: "Campaign Combat" },
  { key: "cards", ru: "Карты", en: "Cards" },
  { key: "components", ru: "Компоненты", en: "Components" },
  { key: "cooperative", ru: "Кооперативный режим", en: "Cooperative" },
  { key: "deckbuilding", ru: "Составление колоды", en: "Deck Building" },
  { key: "differences", ru: "Отличия от оригинала", en: "Differences" },
  { key: "editor", ru: "Редактор", en: "Editor" },
  { key: "game_mechanics", ru: "Игровая механика", en: "Game Mechanics" },
  { key: "global", ru: "Общие правила", en: "Global Rules" },
  { key: "interaction", ru: "Взаимодействие", en: "Interaction" },
  { key: "locations", ru: "Локации", en: "Locations" },
  { key: "mode", ru: "Режим игры", en: "Game Mode" },
  { key: "morale", ru: "Мораль", en: "Morale" },
  { key: "reference", ru: "Справочник", en: "Reference" },
  { key: "round_effects", ru: "Эффекты раунда", en: "Round Effects" },
  { key: "rounds", ru: "Раунды", en: "Rounds" },
  { key: "scoring", ru: "Подсчёт очков", en: "Scoring" },
  { key: "settings", ru: "Настройка игры", en: "Setup" },
  { key: "solo_mode", ru: "Одиночный режим", en: "Solo Mode" },
  { key: "specialty", ru: "Специализация", en: "Specialty" },
  { key: "statistics", ru: "Статистика", en: "Statistics" },
  { key: "storage", ru: "Хранение", en: "Storage" },
  { key: "timed", ru: "Игра на время", en: "Timed" },
  { key: "timed_event", ru: "Событие по таймеру", en: "Timed Event" },
  { key: "unit_ability", ru: "Способности юнитов", en: "Unit Abilities" },
  { key: "war_machine", ru: "Боевые машины", en: "War Machines" },
];

const RULE_CAT_MAP = Object.fromEntries(RULE_CATEGORIES.map((c) => [c.key, c]));

function getCategoryLabel(key: string, lang: string): string {
  const entry = RULE_CAT_MAP[key];
  if (!entry) return key;
  return lang === "RU" ? entry.ru : entry.en;
}

interface RulesTabProps {
  scrollToRuleId?: string | null;
  onScrollHandled?: () => void;
}

export default function RulesTab({ scrollToRuleId, onScrollHandled }: RulesTabProps) {
  const { rules, loaded } = useRules();
  const { lang } = useLang();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useDebounce("", 300);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollToRuleId && loaded) {
      setSelectedCategory(null);
      setSearch("");
      setDebouncedSearch("");
      setExpandedId(scrollToRuleId);
      onScrollHandled?.();
      requestAnimationFrame(() => {
        const el = document.getElementById(`rule-${scrollToRuleId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [scrollToRuleId, loaded]);

  // Only show categories that have rules in the data
  const categories = useMemo(
    () => RULE_CATEGORIES.filter((c) => rules.some((r) => r.category === c.key)),
    [rules],
  );

  const filtered = useMemo(() => {
    let list = rules;
    if (selectedCategory) {
      list = list.filter((r) => r.category === selectedCategory);
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
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key === selectedCategory ? null : cat.key)}
              className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {lang === "RU" ? cat.ru : cat.en}
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
            <div key={rule.id} id={`rule-${rule.id}`} className="rounded-xl bg-card border border-border overflow-hidden">
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
