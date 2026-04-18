import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Search, Swords, HelpCircle, Gauge, ArrowLeftRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRules, Rule } from "@/context/RulesContext";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EmptyState, SkeletonList } from "@/components/ui/empty-state";

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

const SPECIAL_CATEGORIES = new Set(["battlefield", "faq", "difficulties", "trading"]);

const RULE_CATEGORIES: { key: string; ru: string; en: string }[] = [
  { key: "alliance", ru: "Альянс", en: "Alliance" },
  { key: "astrologers", ru: "Астрологи", en: "Astrologers" },
  { key: "astrologers_proclaim", ru: "Провозглашение астрологов", en: "Astrologers' Proclamation" },
  { key: "battlefield", ru: "Поле битвы", en: "Battlefield" },
  { key: "campaign", ru: "Кампания", en: "Campaign" },
  { key: "campaign_combat", ru: "Бой в кампании", en: "Campaign Combat" },
  { key: "cards", ru: "Карты", en: "Cards" },
  { key: "components", ru: "Компоненты", en: "Components" },
  { key: "cooperative", ru: "Кооперативный режим", en: "Cooperative" },
  { key: "deckbuilding", ru: "Составление колоды", en: "Deck Building" },
  { key: "differences", ru: "Отличия от оригинала", en: "Differences" },
  { key: "difficulties", ru: "Сложность", en: "Difficulties" },
  { key: "editor", ru: "Редактор", en: "Editor" },
  { key: "faq", ru: "FAQ", en: "FAQ" },
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
  { key: "trading", ru: "Торговля", en: "Trading" },
  { key: "unit_ability", ru: "Способности юнитов", en: "Unit Abilities" },
  { key: "war_machine", ru: "Боевые машины", en: "War Machines" },
];

const RULE_CAT_MAP = Object.fromEntries(RULE_CATEGORIES.map((c) => [c.key, c]));

function getCategoryLabel(key: string, lang: string): string {
  const entry = RULE_CAT_MAP[key];
  if (!entry) return key;
  return lang === "RU" ? entry.ru : entry.en;
}

// Markdown components with glyph support
function makeMarkdownComponents(glyphs: ReturnType<typeof useGlyphs>["glyphs"]) {
  const processChildren = (children: React.ReactNode): string => {
    if (typeof children === "string") return children;
    if (Array.isArray(children)) return children.map(processChildren).join("");
    return String(children ?? "");
  };

  const GlyphText = ({ children }: { children: React.ReactNode }) => {
    const text = processChildren(children);
    const html = renderGlyphs(text, glyphs);
    if (html !== text) {
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return <>{children}</>;
  };

  return {
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto my-3">
        <table className="text-sm border-collapse w-full" {...props}>{children}</table>
      </div>
    ),
    th: ({ children, ...props }: any) => (
      <th className="border border-border px-3 py-2 bg-muted text-left font-medium whitespace-nowrap align-middle" {...props}>
        <GlyphText>{children}</GlyphText>
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="border border-border px-3 py-2 whitespace-nowrap align-middle" {...props}>
        <GlyphText>{children}</GlyphText>
      </td>
    ),
    p: ({ children, ...props }: any) => (
      <p {...props}><GlyphText>{children}</GlyphText></p>
    ),
    li: ({ children, ...props }: any) => (
      <li {...props}><GlyphText>{children}</GlyphText></li>
    ),
  };
}

interface RulesTabProps {
  scrollToRuleId?: string | null;
  onScrollHandled?: () => void;
}

export default function RulesTab({ scrollToRuleId, onScrollHandled }: RulesTabProps) {
  const { rules, loaded } = useRules();
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useDebounce("", 300);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<string | undefined>(undefined);
  const listRef = useRef<HTMLDivElement>(null);

  const mdComponents = useMemo(() => makeMarkdownComponents(glyphs), [glyphs]);

  useEffect(() => {
    if (scrollToRuleId && loaded) {
      setSelectedCategory(null);
      setSearch("");
      setDebouncedSearch("");
      setOpenItem(scrollToRuleId);
      onScrollHandled?.();
      requestAnimationFrame(() => {
        const el = document.getElementById(`rule-${scrollToRuleId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [scrollToRuleId, loaded]);

  const CATEGORY_ORDER = ["difficulties", "trading", "faq", "deckbuilding", "battlefield"];

  const categories = useMemo(() => {
    const available = RULE_CATEGORIES.filter((c) => rules.some((r) => r.category === c.key));
    const ordered: typeof available = [];
    for (const key of CATEGORY_ORDER) {
      const found = available.find((c) => c.key === key);
      if (found) ordered.push(found);
    }
    for (const cat of available) {
      if (!CATEGORY_ORDER.includes(cat.key)) ordered.push(cat);
    }
    return ordered;
  }, [rules]);

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

  // Auto-open single search result
  const autoOpenValue = useMemo(() => {
    if (debouncedSearch.length >= 2 && filtered.length === 1) {
      return filtered[0].id;
    }
    return undefined;
  }, [debouncedSearch, filtered]);

  useEffect(() => {
    if (autoOpenValue) {
      setOpenItem(autoOpenValue);
    }
  }, [autoOpenValue]);

  const { coreRules, battlefieldRules, faqRules, difficultiesRules, tradingRules } = useMemo(() => {
    const core: Rule[] = [];
    const bf: Rule[] = [];
    const faq: Rule[] = [];
    const diff: Rule[] = [];
    const trade: Rule[] = [];
    for (const r of filtered) {
      if (r.category === "battlefield") bf.push(r);
      else if (r.category === "faq") faq.push(r);
      else if (r.category === "difficulties") diff.push(r);
      else if (r.category === "trading") trade.push(r);
      else core.push(r);
    }
    return { coreRules: core, battlefieldRules: bf, faqRules: faq, difficultiesRules: diff, tradingRules: trade };
  }, [filtered]);

  const handleSearch = (v: string) => {
    setSearch(v);
    setDebouncedSearch(v);
  };

  const hasMarkdownTable = (text: string) => /\|.+\|/.test(text);

  const renderRuleContent = (rule: Rule) => {
    const text = lang === "RU" ? (rule.text_ru || rule.text_en) : (rule.text_en || rule.text_ru);
    const useMarkdown = hasMarkdownTable(text || "");
    return useMarkdown ? (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {text || ""}
      </ReactMarkdown>
    ) : (
      <div className="whitespace-pre-line">{renderTextWithBadges(text || "")}</div>
    );
  };

  const renderAccordionItems = (sectionRules: Rule[]) =>
    sectionRules.map((rule) => {
      const title = lang === "RU" ? (rule.title_ru || rule.title_en) : (rule.title_en || rule.title_ru);
      return (
        <AccordionItem
          key={rule.id}
          value={rule.id}
          id={`rule-${rule.id}`}
          className="border border-border/50 rounded-lg px-4 data-[state=open]:border-primary/40"
        >
          <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline text-left">
            {title}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground pb-3 leading-relaxed">
            {renderRuleContent(rule)}
          </AccordionContent>
        </AccordionItem>
      );
    });

  if (!loaded) {
    return (
      <div className="flex-1 overflow-y-auto p-3">
        <SkeletonList />
      </div>
    );
  }

  const renderSection = (
    sectionRules: Rule[],
    icon: React.ReactNode,
    label: string,
    colorClass: string,
  ) =>
    sectionRules.length > 0 && (
      <>
        <div className="flex items-center gap-2 pt-4 pb-1 px-1">
          {icon}
          <span className={`text-xs font-semibold uppercase tracking-wide ${colorClass}`}>
            {label}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>
        {renderAccordionItems(sectionRules)}
      </>
    );

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

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {filtered.length === 0 && (
          <EmptyState
            onReset={selectedCategory || debouncedSearch ? () => { setSelectedCategory(null); setSearch(""); setDebouncedSearch(""); } : undefined}
          />
        )}

        <Accordion
          type="single"
          collapsible
          value={openItem}
          onValueChange={(v) => setOpenItem(v)}
          className="space-y-1"
        >
          {renderAccordionItems(coreRules)}

          {renderSection(
            battlefieldRules,
            <Swords className="w-4 h-4 text-primary" />,
            lang === "RU" ? "Поле битвы" : "Battlefield",
            "text-primary",
          )}

          {renderSection(
            difficultiesRules,
            <Gauge className="w-4 h-4 text-orange-500" />,
            lang === "RU" ? "Сложность" : "Difficulties",
            "text-orange-500",
          )}

          {renderSection(
            tradingRules,
            <ArrowLeftRight className="w-4 h-4 text-emerald-500" />,
            lang === "RU" ? "Торговля" : "Trading",
            "text-emerald-500",
          )}

          {renderSection(
            faqRules,
            <HelpCircle className="w-4 h-4 text-muted-foreground" />,
            "FAQ",
            "text-muted-foreground",
          )}
        </Accordion>
      </div>
    </div>
  );
}
