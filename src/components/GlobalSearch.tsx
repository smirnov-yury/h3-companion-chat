import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { toSlug } from "@/config/sectionRegistry";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;
const HIGHLIGHT_COLOR = "#E1BB3A";

type Lang = "RU" | "EN";

interface SearchHit {
  id: string;
  name: string;
  snippet: string;
  image: string | null;
  url: string;
}

interface SectionResult {
  key: string;
  labelEN: string;
  labelRU: string;
  showMoreUrl: string;
  hits: SearchHit[];
  total: number; // total fetched (capped to fetch limit)
}

interface GlobalSearchProps {
  mode: "overlay" | "inline";
  onClose?: () => void;
  /** Initial query (e.g. seeded from a URL param). */
  initialQuery?: string;
  /** When true (overlay mode), focus input on mount. */
  autoFocus?: boolean;
}

const FETCH_LIMIT = 10;
const VISIBLE_LIMIT = 3;
const MIN_QUERY = 2;

type EntityType = 'unit'|'ability'|'spell'|'artifact'|'rule'|'hero'|'building'|'field'|'statistic'|'event'|'war_machine'|'astrologer';
const ENTITY_META: Record<EntityType, { labelEN: string; labelRU: string; url: (id: string) => string }> = {
  unit:        { labelEN: 'Units',        labelRU: 'Юниты',          url: (id) => `/units/${id}` },
  ability:     { labelEN: 'Abilities',    labelRU: 'Способности',    url: (id) => `/decks/abilities/${id}` },
  spell:       { labelEN: 'Spells',       labelRU: 'Заклинания',     url: (id) => `/decks/spells/${id}` },
  artifact:    { labelEN: 'Artifacts',    labelRU: 'Артефакты',      url: (id) => `/decks/artifacts/${id}` },
  rule:        { labelEN: 'Rules',        labelRU: 'Правила',        url: (id) => `/rules/${id}` },
  hero:        { labelEN: 'Heroes',       labelRU: 'Герои',          url: (id) => `/heroes/${id}` },
  building:    { labelEN: 'Buildings',    labelRU: 'Постройки',      url: () => `/towns` },
  field:       { labelEN: 'Map Elements', labelRU: 'Элементы карты', url: (id) => `/map-elements/${id}` },
  
  statistic:   { labelEN: 'Statistics',   labelRU: 'Статистики',     url: () => `/rules` },
  event:       { labelEN: 'Events',       labelRU: 'События',        url: (id) => `/events/${id}` },
  war_machine: { labelEN: 'War Machines', labelRU: 'Военные машины', url: (id) => `/decks/warmachines/${id}` },
  astrologer:  { labelEN: 'Astrologers',  labelRU: 'Астрологи',      url: () => `/` },
};

function pick(en: string | null | undefined, ru: string | null | undefined, lang: Lang): string {
  if (lang === "RU") return (ru ?? en ?? "").toString();
  return (en ?? ru ?? "").toString();
}

function buildSnippet(
  query: string,
  candidates: Array<string | null | undefined>,
): string {
  const lower = query.toLowerCase();
  for (const raw of candidates) {
    if (!raw) continue;
    const text = String(raw).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const idx = text.toLowerCase().indexOf(lower);
    if (idx >= 0) {
      const start = Math.max(0, idx - 30);
      const slice = text.slice(start, start + 110);
      return (start > 0 ? "…" : "") + slice + (start + 110 < text.length ? "…" : "");
    }
  }
  // fallback to first non-empty
  for (const raw of candidates) {
    if (!raw) continue;
    const text = String(raw).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text) return text.slice(0, 100) + (text.length > 100 ? "…" : "");
  }
  return "";
}

function highlight(text: string, query: string): { __html: string } {
  if (!text) return { __html: "" };
  if (!query) return { __html: escapeHtml(text) };
  const safe = escapeHtml(text);
  const q = escapeRegExp(query);
  const re = new RegExp(`(${q})`, "ig");
  return {
    __html: safe.replace(re, `<span style="color:${HIGHLIGHT_COLOR};font-weight:600">$1</span>`),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildOrFilter(fields: string[], query: string): string {
  // ilike with wildcards; commas inside .or() are separators, escape them in value
  const safe = query.replace(/,/g, "\\,").replace(/%/g, "\\%");
  return fields.map((f) => `${f}.ilike.%${safe}%`).join(",");
}

function sortByNameMatch<T extends { name_en?: string | null; name_ru?: string | null }>(
  rows: T[],
  query: string,
  lang: Lang,
): T[] {
  const q = query.toLowerCase();
  return [...rows].sort((a, b) => {
    const aMatch = pick(a.name_en ?? null, a.name_ru ?? null, lang).toLowerCase().includes(q) ? 1 : 0;
    const bMatch = pick(b.name_en ?? null, b.name_ru ?? null, lang).toLowerCase().includes(q) ? 1 : 0;
    return bMatch - aMatch;
  });
}

function sortByTitleMatch<T extends { title_en?: string | null; title_ru?: string | null }>(
  rows: T[],
  query: string,
  lang: Lang,
): T[] {
  const q = query.toLowerCase();
  return [...rows].sort((a, b) => {
    const aMatch = pick(a.title_en ?? null, a.title_ru ?? null, lang).toLowerCase().includes(q) ? 1 : 0;
    const bMatch = pick(b.title_en ?? null, b.title_ru ?? null, lang).toLowerCase().includes(q) ? 1 : 0;
    return bMatch - aMatch;
  });
}

async function searchAll(query: string, lang: Lang): Promise<SectionResult[]> {
  const queries = [
    // Heroes
    supabase
      .from("heroes")
      .select("id, name_en, name_ru, specialty_en, specialty_ru, image, town")
      .or(buildOrFilter(["name_en", "name_ru", "specialty_en", "specialty_ru"], query))
      .order("sort_order")
      .limit(FETCH_LIMIT),
    // Units
    supabase
      .from("unit_stats")
      .select("id, slug, name_en, name_ru, abilities_en, abilities_ru, image, town")
      .or(buildOrFilter(["name_en", "name_ru", "abilities_en", "abilities_ru"], query))
      .order("sort_order")
      .limit(FETCH_LIMIT),
    // Artifacts
    supabase
      .from("artifacts")
      .select("id, name_en, name_ru, effect_en, effect_ru, description_en, description_ru, image, quality")
      .or(buildOrFilter(["name_en", "name_ru", "effect_en", "effect_ru", "description_en", "description_ru"], query))
      .order("sort_order")
      .limit(FETCH_LIMIT),
    // Spells
    supabase
      .from("spells")
      .select("id, name_en, name_ru, effect_en, effect_ru, notes_en, notes_ru, image, school")
      .or(buildOrFilter(["name_en", "name_ru", "effect_en", "effect_ru", "notes_en", "notes_ru"], query))
      .order("sort_order")
      .limit(FETCH_LIMIT),
    // Abilities
    supabase
      .from("abilities")
      .select("id, name_en, name_ru, effect_en, effect_ru, notes_en, notes_ru, image_regular")
      .or(buildOrFilter(["name_en", "name_ru", "effect_en", "effect_ru", "notes_en", "notes_ru"], query))
      .order("sort_order")
      .limit(FETCH_LIMIT),
    // Rules
    supabase
      .from("rules")
      .select("id, title_en, title_ru, text_en, text_ru, category")
      .or(buildOrFilter(["title_en", "title_ru", "text_en", "text_ru"], query))
      .order("sort_order")
      .limit(FETCH_LIMIT),
    // Scenarios
    supabase
      .from("scenarios")
      .select("id, title_en, title_ru, summary_en, summary_ru")
      .or(buildOrFilter(["title_en", "title_ru", "summary_en", "summary_ru"], query))
      .order("sort_order")
      .limit(FETCH_LIMIT),
    // Map Elements
    supabase
      .from("fields")
      .select("id, name_en, name_ru, effect_en, effect_ru, image")
      .or(buildOrFilter(["name_en", "name_ru", "effect_en", "effect_ru"], query))
      .order("sort_order")
      .limit(FETCH_LIMIT),
    // Events
    supabase
      .from("events")
      .select("id, name_en, name_ru, effect_en, effect_ru, image")
      .or(buildOrFilter(["name_en", "name_ru", "effect_en", "effect_ru"], query))
      .order("sort_order")
      .limit(FETCH_LIMIT),
    // War Machines
    supabase
      .from("war_machines")
      .select("id, name_en, name_ru, ability_en, ability_ru, image")
      .or(buildOrFilter(["name_en", "name_ru", "ability_en", "ability_ru"], query))
      .order("sort_order")
      .limit(FETCH_LIMIT),
  ];

  const [heroes, units, artifacts, spells, abilities, rules, scenarios, fields, events, warmachines] =
    await Promise.all(queries);

  const sections: SectionResult[] = [];

  const enc = (id: string) => encodeURIComponent(id);

  // Heroes
  if (heroes.data) {
    const rows = sortByNameMatch(heroes.data as Array<{ id: string; name_en: string; name_ru: string | null; specialty_en: string | null; specialty_ru: string | null; image: string | null; town: string | null }>, query, lang);
    sections.push({
      key: "heroes",
      labelEN: "Heroes",
      labelRU: "Герои",
      showMoreUrl: `/heroes?q=${enc(query)}`,
      total: rows.length,
      hits: rows.map((r) => ({
        id: r.id,
        name: pick(r.name_en, r.name_ru, lang),
        snippet: buildSnippet(query, lang === "RU" ? [r.specialty_ru, r.specialty_en] : [r.specialty_en, r.specialty_ru]),
        image: r.image && r.image.startsWith("heroes-") ? `${STORAGE}/heroes/${r.image}` : null,
        url: r.town ? `/heroes/${toSlug(r.town)}/${r.id}` : `/heroes/${r.id}`,
      })),
    });
  }
  // Units
  if (units.data) {
    const rows = sortByNameMatch(units.data as Array<{ id: string; slug: string | null; name_en: string; name_ru: string | null; abilities_en: string | null; abilities_ru: string | null; image: string | null; town: string | null }>, query, lang);
    sections.push({
      key: "units",
      labelEN: "Units",
      labelRU: "Юниты",
      showMoreUrl: `/units?q=${enc(query)}`,
      total: rows.length,
      hits: rows.map((r) => ({
        id: r.id,
        name: pick(r.name_en, r.name_ru, lang),
        snippet: buildSnippet(query, lang === "RU" ? [r.abilities_ru, r.abilities_en] : [r.abilities_en, r.abilities_ru]),
        image: r.image ? `${STORAGE}/${r.image}` : null,
        url: r.town
          ? `/units/${toSlug(r.town)}/${r.slug ?? r.id}`
          : `/units/${r.slug ?? r.id}`,
      })),
    });
  }
  // Artifacts
  if (artifacts.data) {
    const rows = sortByNameMatch(artifacts.data as Array<{ id: string; name_en: string; name_ru: string | null; effect_en: string | null; effect_ru: string | null; description_en: string | null; description_ru: string | null; image: string | null; quality: string | null }>, query, lang);
    sections.push({
      key: "artifacts",
      labelEN: "Artifacts",
      labelRU: "Артефакты",
      showMoreUrl: `/decks/artifacts?q=${enc(query)}`,
      total: rows.length,
      hits: rows.map((r) => ({
        id: r.id,
        name: pick(r.name_en, r.name_ru, lang),
        snippet: buildSnippet(query, lang === "RU" ? [r.effect_ru, r.description_ru, r.effect_en, r.description_en] : [r.effect_en, r.description_en, r.effect_ru, r.description_ru]),
        image: r.image ? `${STORAGE}/${r.image}` : null,
        url: r.quality
          ? `/decks/artifacts/${toSlug(r.quality)}/${r.id}`
          : `/decks/artifacts/${r.id}`,
      })),
    });
  }
  // Spells
  if (spells.data) {
    const rows = sortByNameMatch(spells.data as Array<{ id: string; name_en: string; name_ru: string | null; effect_en: string | null; effect_ru: string | null; notes_en: string | null; notes_ru: string | null; image: string | null; school: string | null }>, query, lang);
    sections.push({
      key: "spells",
      labelEN: "Spells",
      labelRU: "Заклинания",
      showMoreUrl: `/decks/spells?q=${enc(query)}`,
      total: rows.length,
      hits: rows.map((r) => ({
        id: r.id,
        name: pick(r.name_en, r.name_ru, lang),
        snippet: buildSnippet(query, lang === "RU" ? [r.effect_ru, r.notes_ru, r.effect_en, r.notes_en] : [r.effect_en, r.notes_en, r.effect_ru, r.notes_ru]),
        image: r.image ? `${STORAGE}/${r.image}` : null,
        url: r.school
          ? `/decks/spells/${toSlug(r.school)}/${r.id}`
          : `/decks/spells/${r.id}`,
      })),
    });
  }
  // Abilities
  if (abilities.data) {
    const rows = sortByNameMatch(abilities.data as Array<{ id: string; name_en: string; name_ru: string | null; effect_en: string | null; effect_ru: string | null; notes_en: string | null; notes_ru: string | null; image_regular: string | null }>, query, lang);
    sections.push({
      key: "abilities",
      labelEN: "Abilities",
      labelRU: "Способности",
      showMoreUrl: `/decks/abilities?q=${enc(query)}`,
      total: rows.length,
      hits: rows.map((r) => ({
        id: r.id,
        name: pick(r.name_en, r.name_ru, lang),
        snippet: buildSnippet(query, lang === "RU" ? [r.effect_ru, r.notes_ru, r.effect_en, r.notes_en] : [r.effect_en, r.notes_en, r.effect_ru, r.notes_ru]),
        image: r.image_regular ? `${STORAGE}/${r.image_regular}` : null,
        url: `/decks/abilities/${r.id}`,
      })),
    });
  }
  // Rules
  if (rules.data) {
    const rows = sortByTitleMatch(rules.data as Array<{ id: string; title_en: string | null; title_ru: string | null; text_en: string | null; text_ru: string | null; category: string | null }>, query, lang);
    sections.push({
      key: "rules",
      labelEN: "Rules",
      labelRU: "Правила",
      showMoreUrl: `/rules?q=${enc(query)}`,
      total: rows.length,
      hits: rows.map((r) => ({
        id: r.id,
        name: pick(r.title_en, r.title_ru, lang) || r.id,
        snippet: buildSnippet(query, lang === "RU" ? [r.text_ru, r.text_en] : [r.text_en, r.text_ru]),
        image: null,
        url: r.category ? `/rules/${toSlug(r.category)}/${r.id}` : `/rules/${r.id}`,
      })),
    });
  }
  // Scenarios
  if (scenarios.data) {
    const rows = sortByTitleMatch(scenarios.data as Array<{ id: string; title_en: string | null; title_ru: string | null; summary_en: string | null; summary_ru: string | null }>, query, lang);
    sections.push({
      key: "scenarios",
      labelEN: "Scenarios",
      labelRU: "Сценарии",
      showMoreUrl: `/scenarios?q=${enc(query)}`,
      total: rows.length,
      hits: rows.map((r) => ({
        id: r.id,
        name: pick(r.title_en, r.title_ru, lang) || r.id,
        snippet: buildSnippet(query, lang === "RU" ? [r.summary_ru, r.summary_en] : [r.summary_en, r.summary_ru]),
        image: null,
        url: `/scenarios/${r.id}`,
      })),
    });
  }
  // Map Elements
  if (fields.data) {
    const rows = sortByNameMatch(fields.data as Array<{ id: string; name_en: string; name_ru: string | null; effect_en: string | null; effect_ru: string | null; image: string | null }>, query, lang);
    sections.push({
      key: "map_elements",
      labelEN: "Map Elements",
      labelRU: "Элементы карты",
      showMoreUrl: `/map-elements?q=${enc(query)}`,
      total: rows.length,
      hits: rows.map((r) => ({
        id: r.id,
        name: pick(r.name_en, r.name_ru, lang),
        snippet: buildSnippet(query, lang === "RU" ? [r.effect_ru, r.effect_en] : [r.effect_en, r.effect_ru]),
        image: r.image ? `${STORAGE}/${r.image}` : null,
        url: `/map-elements/${r.id}`,
      })),
    });
  }
  // Events
  if (events.data) {
    const rows = sortByNameMatch(events.data as Array<{ id: string; name_en: string; name_ru: string | null; effect_en: string | null; effect_ru: string | null; image: string | null }>, query, lang);
    sections.push({
      key: "events",
      labelEN: "Events",
      labelRU: "События",
      showMoreUrl: `/events?q=${enc(query)}`,
      total: rows.length,
      hits: rows.map((r) => ({
        id: r.id,
        name: pick(r.name_en, r.name_ru, lang),
        snippet: buildSnippet(query, lang === "RU" ? [r.effect_ru, r.effect_en] : [r.effect_en, r.effect_ru]),
        image: r.image ? `${STORAGE}/${r.image}` : null,
        url: `/events/${r.id}`,
      })),
    });
  }
  // War Machines
  if (warmachines.data) {
    const rows = sortByNameMatch(warmachines.data as Array<{ id: string; name_en: string; name_ru: string | null; ability_en: string | null; ability_ru: string | null; image: string | null }>, query, lang);
    sections.push({
      key: "warmachines",
      labelEN: "War Machines",
      labelRU: "Военные машины",
      showMoreUrl: `/decks/warmachines?q=${enc(query)}`,
      total: rows.length,
      hits: rows.map((r) => ({
        id: r.id,
        name: pick(r.name_en, r.name_ru, lang),
        snippet: buildSnippet(query, lang === "RU" ? [r.ability_ru, r.ability_en] : [r.ability_en, r.ability_ru]),
        image: r.image ? `${STORAGE}/${r.image}` : null,
        url: `/decks/warmachines/${r.id}`,
      })),
    });
  }

  return sections.filter((s) => s.hits.length > 0);
}

export default function GlobalSearch({ mode, onClose, initialQuery = "", autoFocus }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [results, setResults] = useState<SectionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);
  const [semanticResults, setSemanticResults] = useState<SectionResult[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);

  const runSemanticSearch = useCallback(async (q: string) => {
    if (q.length < MIN_QUERY) { setSemanticResults([]); return; }
    setSemanticLoading(true);
    try {
      const { data: embedData, error: embedErr } = await supabase.functions.invoke('embed-query', { body: { text: q } });
      if (embedErr || !embedData?.embedding) throw new Error('embed failed');
      const rpc = lang === 'RU' ? 'match_all_ru' : 'match_all_en';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: matches } = await (supabase.rpc as any)(rpc, {
        query_embedding: embedData.embedding,
        match_count: 20,
        match_threshold: 0.35,
      });
      if (!matches) { setSemanticResults([]); return; }
      const grouped: Record<string, SectionResult> = {};
      for (const m of matches as Array<{ entity_type: string; entity_id: string; name_en: string; name_ru: string; similarity: number }>) {
        const meta = ENTITY_META[m.entity_type as EntityType];
        if (!meta) continue;
        if (!grouped[m.entity_type]) {
          grouped[m.entity_type] = { key: m.entity_type, labelEN: meta.labelEN, labelRU: meta.labelRU, showMoreUrl: meta.url(''), hits: [], total: 0 };
        }
        grouped[m.entity_type].hits.push({
          id: m.entity_id,
          name: lang === 'RU' ? (m.name_ru || m.name_en) : (m.name_en || m.name_ru),
          snippet: `${Math.round(m.similarity * 100)}% match`,
          image: null,
          url: meta.url(m.entity_id),
        });
        grouped[m.entity_type].total++;
      }
      setSemanticResults(Object.values(grouped));
    } catch { setSemanticResults([]); }
    finally { setSemanticLoading(false); }
  }, [lang]);

  // Auto focus
  useEffect(() => {
    if (autoFocus || mode === "overlay") inputRef.current?.focus();
  }, [autoFocus, mode]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch
  useEffect(() => {
    const q = debounced.trim();
    if (q.length < MIN_QUERY) {
      setResults([]);
      setLoading(false);
      return;
    }
    const myId = ++requestId.current;
    setLoading(true);
    searchAll(q, lang as Lang)
      .then((sections) => {
        if (requestId.current !== myId) return;
        setResults(sections);
      })
      .catch(() => {
        if (requestId.current !== myId) return;
        setResults([]);
      })
      .finally(() => {
        if (requestId.current !== myId) return;
        setLoading(false);
      });
  }, [debounced, lang]);

  useEffect(() => {
    runSemanticSearch(debounced.trim());
  }, [debounced, runSemanticSearch]);

  // ESC closes overlay
  useEffect(() => {
    if (mode !== "overlay") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, onClose]);

  const handleNavigate = useCallback(
    (url: string) => {
      navigate(url);
      onClose?.();
    },
    [navigate, onClose],
  );

  const placeholder = lang === "RU" ? "Поиск правил, карточек, героев…" : "Search rules, cards, heroes…";
  const activeResults = semanticResults;
  const activeLoading = semanticLoading;
  const showHint = query.trim().length < MIN_QUERY;
  const showEmpty = !showHint && !activeLoading && activeResults.length === 0;

  const inputBlock = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-muted rounded-xl pl-10 pr-10 py-3 text-base text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary transition-all"
      />
      {semanticLoading ? (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" size={16} />
      ) : query ? (
        <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          {lang === "RU" ? "Очистить" : "Clear"}
        </button>
      ) : null}
    </div>
  );

  const resultsBlock = (
    <div className="mt-4 space-y-5">
      {showHint && (
        <p className="text-center text-sm text-muted-foreground py-6">
          {lang === "RU" ? "Введите минимум 2 символа" : "Type at least 2 characters"}
        </p>
      )}
      {showEmpty && (
        <p className="text-center text-sm text-muted-foreground py-6">
          {lang === "RU" ? "Ничего не найдено" : "Nothing found"}
        </p>
      )}
      {activeResults.map((section) => {
        const visible = section.hits.slice(0, VISIBLE_LIMIT);
        const remainder = section.total - visible.length;
        const sectionLabel = lang === "RU" ? section.labelRU : section.labelEN;
        return (
          <div key={section.key}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
              {sectionLabel}
            </h3>
            <div className="space-y-1">
              {visible.map((hit) => (
                <button
                  key={`${section.key}-${hit.id}`}
                  onClick={() => handleNavigate(hit.url)}
                  className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-muted text-left transition-colors"
                >
                  <div className="w-8 h-8 shrink-0 rounded bg-muted overflow-hidden flex items-center justify-center">
                    {hit.image ? (
                      <img
                        src={hit.image}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Search size={14} className="text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium text-foreground truncate"
                      dangerouslySetInnerHTML={highlight(hit.name, debounced)}
                    />
                    {hit.snippet && (
                      <p
                        className="text-xs text-muted-foreground truncate"
                        dangerouslySetInnerHTML={highlight(hit.snippet, debounced)}
                      />
                    )}
                  </div>
                </button>
              ))}
              {remainder > 0 && (
                <button
                  onClick={() => handleNavigate(section.showMoreUrl)}
                  className="w-full text-left px-2 py-1.5 text-xs font-medium text-primary hover:underline"
                >
                  {lang === "RU" ? `Показать ещё (${remainder}) →` : `Show more (${remainder}) →`}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (mode === "overlay") {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col lg:left-56">
        <div className="flex-shrink-0 flex items-center gap-2 p-3 border-b border-border">
          <div className="flex-1">{inputBlock}</div>
          <button
            onClick={onClose}
            aria-label={lang === "RU" ? "Закрыть" : "Close"}
            className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          <div className="max-w-2xl mx-auto">{resultsBlock}</div>
        </div>
      </div>
    );
  }

  // inline
  return (
    <div className="w-full">
      {inputBlock}
      {resultsBlock}
    </div>
  );
}
