import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useGlyphs } from '@/context/GlyphsContext';
import { useLang } from '@/context/LanguageContext';
import { renderGlyphs } from '@/utils/renderGlyphs';
import { Dialog } from '@/components/ui/dialog';
import { CardDialogContent } from '@/components/ui/card-dialog';
import { Swords, Shield, Heart, Zap, Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { EmptyState, SkeletonGrid } from '@/components/ui/empty-state';
import { useEntityLinkHandler as useEntityLinkHandlerImported } from '@/hooks/useEntityLinkHandler';
import SeeAlso from '@/components/SeeAlso';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;

const FACTIONS = ['castle','necropolis','dungeon','tower','fortress','rampart','inferno','conflux','stronghold','cove'];
const isNeutral = (unit: UnitStat) => !FACTIONS.includes(unit.town?.toLowerCase() ?? '');

const NEUTRAL_PLACEHOLDERS: Record<string, string> = {
  bronze: "https://dhdjxhfbyqsobhfqeryu.supabase.co/storage/v1/object/public/component-media/units/neutral/empty_neutral_unit_bronze.webp",
  silver: "https://dhdjxhfbyqsobhfqeryu.supabase.co/storage/v1/object/public/component-media/units/neutral/empty_neutral_unit_silver.webp",
  golden: "https://dhdjxhfbyqsobhfqeryu.supabase.co/storage/v1/object/public/component-media/units/neutral/empty_neutral_unit_gold.webp",
  azure:  "https://dhdjxhfbyqsobhfqeryu.supabase.co/storage/v1/object/public/component-media/units/neutral/empty_neutral_unit_azure.webp",
};

const FACTION_PLACEHOLDERS: Record<string, string> = {
  bronze: "https://dhdjxhfbyqsobhfqeryu.supabase.co/storage/v1/object/public/component-media/units/units-blank-bronze.webp",
  silver: "https://dhdjxhfbyqsobhfqeryu.supabase.co/storage/v1/object/public/component-media/units/units-blank-silver.webp",
  golden: "https://dhdjxhfbyqsobhfqeryu.supabase.co/storage/v1/object/public/component-media/units/units-blank-golden.webp",
};

function getUnitPlaceholder(unit: UnitStat): string {
  const tier = unit.tier?.toLowerCase() ?? 'bronze';
  return isNeutral(unit)
    ? (NEUTRAL_PLACEHOLDERS[tier] ?? NEUTRAL_PLACEHOLDERS.bronze)
    : (FACTION_PLACEHOLDERS[tier] ?? FACTION_PLACEHOLDERS.bronze);
}

interface UnitStat {
  id: string;
  name_en: string;
  name_ru: string | null;
  slug: string;
  town: string;
  number: string;
  tier: string;
  type: string;
  attack: number;
  defense: number;
  health_points: number;
  initiative: number;
  cost: string | null;
  abilities_en: string | null;
  abilities_ru: string | null;
  notes_en: string | null;
  notes_ru: string | null;
  notes_structured_en: Json | null;
  notes_structured_ru: Json | null;
  errata_en: string | null;
  errata_ru: string | null;
  content: string | null;
  image: string | null;
  sort_order: number;
}

type ModeFilter = 'all' | 'standard' | 'neutral';

// Faction variant order (no Neutral here)
const FACTION_VARIANT_ORDER = ['Few', 'Pack', 'Few (Alternate)', 'Pack (Alternate)'];

const FACTION_LABEL_RU: Record<string, string> = {
  Castle: "Замок",
  Rampart: "Оплот",
  Tower: "Башня",
  Inferno: "Инферно",
  Necropolis: "Некрополис",
  Dungeon: "Темница",
  Stronghold: "Цитадель",
  Fortress: "Крепость",
  Conflux: "Сопряжение",
  Cove: "Причал",
};

const TIER_COLOR: Record<string, string> = {
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-slate-500 text-white',
  golden: 'bg-yellow-500 text-black',
  azure: 'bg-[#014490] text-white',
};

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  unit_ground: { label: 'Ground', color: 'bg-amber-800' },
  unit_ranged: { label: 'Ranged', color: 'bg-emerald-700' },
  unit_flying: { label: 'Flying', color: 'bg-indigo-700' },
};

const STAT_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  attack: { icon: Swords, color: 'text-red-400', label: 'ATK' },
  defense: { icon: Shield, color: 'text-blue-400', label: 'DEF' },
  health_points: { icon: Heart, color: 'text-green-400', label: 'HP' },
  initiative: { icon: Zap, color: 'text-yellow-400', label: 'INI' },
};

function GlyphText({ text }: { text: string | null | undefined }) {
  const { glyphs } = useGlyphs();
  if (!text) return null;
  const html = renderGlyphs(text, glyphs)
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

interface NoteBlock {
  base: string[];
  few: string[];
  pack: string[];
  shared: string[];
  neutral: string[];
  neutral_shared: string[];
}

function StructuredNotes({
  structured,
  fallback,
  unitId,
}: {
  structured: Json | null;
  fallback: string | null;
  unitId: string;
  lang: string;
}) {
  if (!structured) {
    if (!fallback) return null;
    return <GlyphText text={fallback} />;
  }

  const s = structured as unknown as NoteBlock;
  const isFew = unitId.includes('_few');
  const isPack = unitId.includes('_pack');
  const isNeutral = unitId.includes('_neutral');

  const sectionLabel: string | null = isFew ? 'Few' : isPack ? 'Pack' : null;
  const sectionItems: string[] = [];

  if (isFew) {
    sectionItems.push(...(s.few ?? []), ...(s.shared ?? []));
  } else if (isPack) {
    sectionItems.push(...(s.pack ?? []), ...(s.shared ?? []), ...(s.neutral_shared ?? []));
  } else if (isNeutral) {
    sectionItems.push(...(s.neutral ?? []), ...(s.neutral_shared ?? []));
  }

  const baseItems = s.base ?? [];

  return (
    <div className="space-y-2">
      {baseItems.length > 0 && (
        <div className="space-y-1">
          {baseItems.map((item, i) => (
            <div key={`base-${i}`}>
              <GlyphText text={item} />
            </div>
          ))}
        </div>
      )}

      {sectionLabel && sectionItems.length > 0 && (
        <div>
          <div className="font-semibold text-foreground mb-1">{sectionLabel}</div>
          <ul className="space-y-1">
            {sectionItems.map((item, i) => (
              <li key={`sec-${i}`} className="flex gap-2">
                <span aria-hidden>•</span>
                <span><GlyphText text={item} /></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isNeutral && sectionItems.length > 0 && (
        <ul className="space-y-1">
          {sectionItems.map((item, i) => (
            <li key={`neu-${i}`} className="flex gap-2">
              <span aria-hidden>•</span>
              <span><GlyphText text={item} /></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label}
    </button>
  );
}

/** A display item: either a faction group (multiple variants) or a standalone neutral unit */
interface DisplayItem {
  key: string; // unique key for rendering
  unit: UnitStat; // preview unit
  variants: UnitStat[]; // all variants for modal
  isNeutral: boolean;
}

interface UnitsTabProps {
  initialFilter?: string;
  initialCardId?: string;
  initialSearch?: string;
  onFilterChange?: (filterValue: string | null) => void;
  onCardOpen?: (cardId: string, currentFilter?: string | null) => void;
  onCardClose?: (currentFilter?: string | null) => void;
}

export default function UnitsTab({ initialFilter, initialCardId, initialSearch, onFilterChange, onCardOpen, onCardClose }: UnitsTabProps = {}) {
  const { lang } = useLang();
  const handleEntityClick = useEntityLinkHandlerImported();
  const [units, setUnits] = useState<UnitStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [activeVariant, setActiveVariant] = useState<string>('');
  const [filterFaction, setFilterFaction] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [mode, setMode] = useState<ModeFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    supabase
      .from('unit_stats')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        if (data) setUnits(data as UnitStat[]);
        setLoading(false);
      });
  }, []);

  // Sync URL filter slug → internal town filter (graceful fallback if no match).
  // Fall back to initialCardId in the ambiguous single-segment case, but only if it
  // doesn't match a unit id/slug (otherwise it's a card deep link, not a filter).
  useEffect(() => {
    const towns = Array.from(new Set(units.map(u => u.town).filter(Boolean)));
    let candidate = initialFilter;
    if (!candidate && initialCardId && !units.some(u => u.id === initialCardId || u.slug === initialCardId)) {
      candidate = initialCardId;
    }
    if (!candidate) { setFilterFaction('all'); return; }
    const match = towns.find(t => t.toLowerCase().replace(/\s+/g, '-') === candidate);
    setFilterFaction(match ?? 'all');
  }, [initialFilter, initialCardId, units]);

  const setFactionAndUrl = (next: string) => {
    setFilterFaction(next);
    onFilterChange?.(next === 'all' ? null : next);
  };

  // Auto-open card from URL: cardId can be a unit slug or id
  useEffect(() => {
    if (!units.length || !initialCardId) return;
    // Try matching by slug (faction group), then by neutral id
    const matchSlug = units.find(u => u.slug === initialCardId && u.town !== 'Neutral');
    if (matchSlug) { setSelectedKey(`faction-${matchSlug.slug}`); return; }
    const matchNeutral = units.find(u => u.id === initialCardId && u.town === 'Neutral');
    if (matchNeutral) { setSelectedKey(`neutral-${matchNeutral.id}`); return; }
    // Fallback: any unit by id
    const any = units.find(u => u.id === initialCardId);
    if (any) setSelectedKey(any.town === 'Neutral' ? `neutral-${any.id}` : `faction-${any.slug}`);
  }, [units, initialCardId]);

  const openCard = (key: string, cardSlug: string) => {
    setSelectedKey(key);
    onCardOpen?.(cardSlug, filterFaction === "all" ? null : filterFaction);
  };
  const closeCard = () => {
    setSelectedKey(null);
    onCardClose?.(filterFaction === "all" ? null : filterFaction);
  };

  // Reset active variant when selected unit changes
  useEffect(() => {
    setActiveVariant('');
  }, [selectedKey]);

  // Separate faction units (grouped by slug) and neutral units (standalone)
  const { factionGroups, neutralUnits } = useMemo(() => {
    const fGroups: Record<string, UnitStat[]> = {};
    const nUnits: UnitStat[] = [];

    units.forEach((u) => {
      if (u.town === 'Neutral') {
        nUnits.push(u);
      } else {
        (fGroups[u.slug] ??= []).push(u);
      }
    });

    return { factionGroups: fGroups, neutralUnits: nUnits };
  }, [units]);

  // Faction chips: only non-Neutral towns
  const factions = useMemo(() => {
    const towns = new Set<string>();
    units.forEach((u) => {
      if (u.town && u.town !== 'Neutral') towns.add(u.town);
    });
    return ['all', ...Array.from(towns).sort()];
  }, [units]);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const tiers = ['all', 'bronze', 'silver', 'golden', 'azure'];
  const types = ['all', 'unit_ground', 'unit_ranged', 'unit_flying'];

  const [searchQuery, setSearchQuery] = useState(initialSearch ?? '');

  // Build display items based on filters
  const displayItems = useMemo(() => {
    const items: DisplayItem[] = [];
    const q = searchQuery.toLowerCase();

    // Add faction groups (when mode is 'all' or 'standard')
    if (mode !== 'neutral') {
      for (const [slug, variants] of Object.entries(factionGroups)) {
        if (filterFaction !== 'all' && !variants.some((u) => u.town === filterFaction)) continue;
        if (filterTier !== 'all' && !variants.some((u) => u.tier === filterTier)) continue;
        if (filterType !== 'all' && !variants.some((u) => u.type === filterType)) continue;

        // Pick preview: Few > Pack > first
        const preview =
          variants.find((u) => u.number === 'Few') ||
          variants.find((u) => u.number === 'Pack') ||
          variants[0];

        if (q && !variants.some((u) => {
          const n = lang === 'RU' ? (u.name_ru || u.name_en) : u.name_en;
          return n.toLowerCase().includes(q);
        })) continue;

        // Sort variants by FACTION_VARIANT_ORDER
        const sorted = [...variants].sort(
          (a, b) => FACTION_VARIANT_ORDER.indexOf(a.number) - FACTION_VARIANT_ORDER.indexOf(b.number)
        );

        items.push({ key: `faction-${slug}`, unit: preview, variants: sorted, isNeutral: false });
      }
    }

    // Add neutral units only when mode is 'neutral' or mode is 'all' with no specific faction filter
    if (mode === 'neutral' || (mode === 'all' && filterFaction === 'all')) {
      for (const u of neutralUnits) {
        if (filterTier !== 'all' && u.tier !== filterTier) continue;
        if (filterType !== 'all' && u.type !== filterType) continue;
        if (q) {
          const n = lang === 'RU' ? (u.name_ru || u.name_en) : u.name_en;
          if (!n.toLowerCase().includes(q)) continue;
        }
        items.push({ key: `neutral-${u.id}`, unit: u, variants: [u], isNeutral: true });
      }
    }

    return items;
  }, [factionGroups, neutralUnits, mode, filterFaction, filterTier, filterType, searchQuery, lang]);

  // Find selected item for modal + neighbors for swipe nav
  const selectedIndex = useMemo(() => {
    if (!selectedKey) return -1;
    return displayItems.findIndex((i) => i.key === selectedKey);
  }, [selectedKey, displayItems]);
  const selectedItem = selectedIndex >= 0 ? displayItems[selectedIndex] : null;
  const itemCardSlug = (it: typeof displayItems[number]) =>
    it.isNeutral ? it.unit.id : it.unit.slug;
  const goPrev = selectedIndex > 0
    ? () => {
        const ni = displayItems[selectedIndex - 1];
        setSelectedKey(ni.key);
        onCardOpen?.(itemCardSlug(ni), filterFaction === "all" ? null : filterFaction);
      } : undefined;
  const goNext = selectedIndex >= 0 && selectedIndex < displayItems.length - 1
    ? () => {
        const ni = displayItems[selectedIndex + 1];
        setSelectedKey(ni.key);
        onCardOpen?.(itemCardSlug(ni), filterFaction === "all" ? null : filterFaction);
      } : undefined;

  const modeLabels: Record<ModeFilter, string> =
    lang === 'RU'
      ? { all: 'Все', standard: 'Обычные', neutral: 'Нейтралы' }
      : { all: 'All', standard: 'Standard', neutral: 'Neutral' };

  const hasFilters = mode !== 'all' || filterFaction !== 'all' || filterTier !== 'all' || filterType !== 'all' || !!searchQuery;
  const resetAllFilters = () => {
    setMode('all'); setFactionAndUrl('all'); setFilterTier('all'); setFilterType('all'); setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-4">
        <SkeletonGrid />
      </div>
    );
  }

  const activeFilterCount =
    (mode !== 'all' ? 1 : 0) +
    (filterFaction !== 'all' ? 1 : 0) +
    (filterTier !== 'all' ? 1 : 0) +
    (filterType !== 'all' ? 1 : 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search + Filters */}
      <div className={`shrink-0 px-3 pt-3 space-y-2 border-b border-border bg-background ${!filtersOpen && activeFilterCount > 0 ? 'pb-1.5' : 'pb-3'}`}>
        {/* MOBILE: Search + Filters button side by side */}
        {(() => {
          const activeChips: { label: string; onRemove: () => void }[] = [];
          if (mode !== 'all') activeChips.push({ label: modeLabels[mode], onRemove: () => setMode('all') });
          if (filterFaction !== 'all') activeChips.push({ label: lang === 'RU' ? FACTION_LABEL_RU[filterFaction] || filterFaction : filterFaction, onRemove: () => setFactionAndUrl('all') });
          if (filterTier !== 'all') activeChips.push({ label: capitalize(filterTier), onRemove: () => setFilterTier('all') });
          if (filterType !== 'all') activeChips.push({ label: capitalize(filterType.replace('unit_', '')), onRemove: () => setFilterType('all') });
          const filterCount = activeChips.length;

          return (
            <div className="lg:hidden space-y-2">
              {/* Row: Search + Filter button */}
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === 'RU' ? 'Поиск юнитов…' : 'Search units…'}
                    className="w-full bg-muted rounded-lg pl-8 pr-16 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={`shrink-0 flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    filterCount > 0
                      ? 'bg-accent text-accent-foreground border border-accent'
                      : 'bg-background text-muted-foreground border border-muted hover:border-border'
                  }`}
                >
                  <SlidersHorizontal size={14} className="mr-1.5" />
                  <span>{lang === 'RU' ? 'Фильтры' : 'Filters'}{filterCount > 0 ? ` · ${filterCount}` : ''}</span>
                  <ChevronDown size={14} className={`ml-1.5 transition-transform duration-300 ${filtersOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>
              </div>

              {/* Collapsed: active filter chips */}
              {!filtersOpen && filterCount > 0 && (
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                  {activeChips.map((chip, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary text-primary-foreground whitespace-nowrap shrink-0"
                    >
                      {chip.label}
                      <span
                        role="button"
                        onClick={chip.onRemove}
                        className="hover:text-primary-foreground/70 cursor-pointer"
                      >
                        <X size={10} />
                      </span>
                    </span>
                  ))}
                </div>
              )}

              {/* Expanded: filter rows */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${filtersOpen ? 'max-h-96' : 'max-h-0'}`}>
                <div className="space-y-2 pt-1">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {(['all', 'standard', 'neutral'] as ModeFilter[]).map((m) => (
                      <FilterChip key={m} label={modeLabels[m]} active={mode === m} onClick={() => setMode(m)} />
                    ))}
                  </div>
                  {mode !== 'neutral' && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {factions.map((f) => (
                        <FilterChip key={f} label={f === 'all' ? (lang === 'RU' ? 'Все' : 'All') : (lang === 'RU' ? FACTION_LABEL_RU[f] || f : f)} active={filterFaction === f} onClick={() => setFactionAndUrl(f)} />
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {tiers.map((t) => (
                      <FilterChip key={t} label={t === 'all' ? (lang === 'RU' ? 'Все' : 'All') : capitalize(t)} active={filterTier === t} onClick={() => setFilterTier(t)} />
                    ))}
                    <div className="w-px bg-border mx-1 shrink-0" />
                    {types.map((t) => (
                      <FilterChip key={t} label={t === 'all' ? (lang === 'RU' ? 'Все' : 'All') : capitalize(t.replace('unit_', ''))} active={filterType === t} onClick={() => setFilterType(t)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* DESKTOP: search + always-visible filters */}
        <div className="hidden lg:block space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'RU' ? 'Поиск юнитов…' : 'Search units…'}
              className="w-full bg-muted rounded-lg pl-8 pr-16 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {(['all', 'standard', 'neutral'] as ModeFilter[]).map((m) => (
              <FilterChip key={m} label={modeLabels[m]} active={mode === m} onClick={() => setMode(m)} />
            ))}
          </div>
          {mode !== 'neutral' && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {factions.map((f) => (
                <FilterChip key={f} label={f === 'all' ? (lang === 'RU' ? 'Все' : 'All') : (lang === 'RU' ? FACTION_LABEL_RU[f] || f : f)} active={filterFaction === f} onClick={() => setFactionAndUrl(f)} />
              ))}
            </div>
          )}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {tiers.map((t) => (
              <FilterChip key={t} label={t === 'all' ? (lang === 'RU' ? 'Все' : 'All') : capitalize(t)} active={filterTier === t} onClick={() => setFilterTier(t)} />
            ))}
            <div className="w-px bg-border mx-1 shrink-0" />
            {types.map((t) => (
              <FilterChip key={t} label={t === 'all' ? (lang === 'RU' ? 'Все' : 'All') : capitalize(t.replace('unit_', ''))} active={filterType === t} onClick={() => setFilterType(t)} />
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-3">
        {displayItems.length === 0 ? (
          <EmptyState onReset={hasFilters ? resetAllFilters : undefined} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {displayItems.map((item) => {
              const unit = item.unit;
              const imgSrc = unit.image ? `${STORAGE}/units/${unit.image}` : null;
              return (
                <button
                  key={item.key}
                  onClick={() => openCard(item.key, item.isNeutral ? item.unit.id : item.unit.slug)}
                  className="flex flex-col rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                >
                  <div className="relative aspect-square bg-muted">
                    <img
                      src={imgSrc ?? getUnitPlaceholder(unit)}
                      alt={unit.name_en}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = getUnitPlaceholder(unit); e.currentTarget.onerror = null; }}
                    />
                    <div className="absolute top-1 left-1 flex flex-col gap-1">
                      {isNeutral(unit) && (
                        <span className="rounded text-[11px] font-medium px-1.5 py-0.5 bg-zinc-600 text-white">
                          {lang === 'RU' ? 'Нейтральный' : 'Neutral'}
                        </span>
                      )}
                      <span className={`rounded text-[11px] font-medium px-1.5 py-0.5 ${TIER_COLOR[unit.tier] ?? 'bg-muted text-foreground'}`}>
                        {capitalize(unit.tier)}
                      </span>
                      {unit.type && TYPE_BADGE[unit.type] && (
                        <span className={`rounded text-[11px] font-medium text-white px-1.5 py-0.5 ${TYPE_BADGE[unit.type].color}`}>
                          {TYPE_BADGE[unit.type].label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold truncate">
                      {lang === 'RU' && unit.name_ru ? unit.name_ru : unit.name_en}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{(lang === 'RU' ? FACTION_LABEL_RU[unit.town] || unit.town : unit.town) || '—'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selectedKey} onOpenChange={(o) => !o && closeCard()}>
        <CardDialogContent onPrev={goPrev} onNext={goNext}>
          {selectedItem && (() => {
            const { variants } = selectedItem;
            const currentVariant = variants.find((v) => v.number === activeVariant) ? activeVariant : variants[0].number;
            const u = variants.find((v) => v.number === currentVariant) ?? variants[0];
            const imgSrc = u.image ? `${STORAGE}/units/${u.image}` : null;
            const abilities = lang === 'RU' && u.abilities_ru ? u.abilities_ru : u.abilities_en;
            const notes = lang === 'RU' && u.notes_ru ? u.notes_ru : u.notes_en;
            const notesStructured = lang === 'RU' && u.notes_structured_ru
              ? u.notes_structured_ru
              : u.notes_structured_en;
            const errata = lang === 'RU' && u.errata_ru ? u.errata_ru : u.errata_en;

            return (
              <>
                {/* TOP: Image section */}
                <div className="relative w-[85%] mx-auto pt-4 mb-0 shrink-0">
                  <img
                    src={imgSrc ?? getUnitPlaceholder(u)}
                    alt={u.name_en}
                    className="w-full aspect-[5/7] object-contain rounded-lg shadow-lg"
                    onError={(e) => { e.currentTarget.src = getUnitPlaceholder(u); e.currentTarget.onerror = null; }}
                  />
                  {/* Badges on image top-left */}
                  <div className="absolute top-5 left-5 flex flex-col gap-1">
                    {isNeutral(u) && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded text-white bg-zinc-600">
                        {lang === 'RU' ? 'Нейтральный' : 'Neutral'}
                      </span>
                    )}
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded text-white ${TIER_COLOR[u.tier] ?? 'bg-muted'}`}>
                      {capitalize(u.tier)}
                    </span>
                    {u.type && TYPE_BADGE[u.type] && (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded text-white ${TYPE_BADGE[u.type].color}`}>
                        {TYPE_BADGE[u.type].label}
                      </span>
                    )}
                  </div>
                </div>

                {/* MIDDLE: Info header */}
                <div className="px-4 pt-0 pb-0 shrink-0">
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <h2 className="text-xl font-bold truncate">
                      {lang === 'RU' && u.name_ru ? u.name_ru : u.name_en}
                    </h2>
                    {variants.length > 1 && (
                      <div className="flex gap-1 shrink-0">
                        {variants.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setActiveVariant(v.number)}
                            className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                              (currentVariant === v.number)
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-transparent text-muted-foreground border-border hover:border-primary/50'
                            }`}
                          >
                            {v.number}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Compact stats row */}
                  <div className="flex items-center gap-3 text-sm font-medium mt-1 flex-wrap">
                    <span className="flex items-center gap-1"><Swords className="w-4 h-4 text-red-400" />{u.attack}</span>
                    <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-blue-400" />{u.defense}</span>
                    <span className="flex items-center gap-1"><Heart className="w-4 h-4 text-green-400" />{u.health_points}</span>
                    <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-yellow-400" />{u.initiative}</span>
                    {u.cost && (
                      <span className="flex items-center gap-1 ml-auto text-muted-foreground">
                        <GlyphText text={`${lang === 'RU' ? 'Цена' : 'Price'}: ${u.cost}`} />
                      </span>
                    )}
                  </div>
                  {/* Decorative divider */}
                  <div className="relative my-1">
                    <div className="border-t border-muted" />
                    <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">✦</span>
                  </div>
                </div>

                {/* BOTTOM: Scrollable content */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 pt-0" onClick={handleEntityClick}>
                  {abilities && (
                    <div className="text-sm leading-relaxed mt-0">
                      <GlyphText text={abilities} />
                    </div>
                  )}

                  {(notesStructured || notes) && (
                    <div className="text-sm text-muted-foreground leading-relaxed mt-2">
                      <StructuredNotes
                        structured={notesStructured}
                        fallback={notes}
                        unitId={u.id}
                        lang={lang}
                      />
                    </div>
                  )}
                  {errata && (
                    <div className="mt-3 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm">
                      <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">
                        ⚠ {lang === 'RU' ? 'Эррата карты' : 'Card Errata'}
                      </p>
                      <GlyphText text={errata} />
                    </div>
                  )}
                  <SeeAlso entityType="unit" entityId={u.id} lang={lang as "EN" | "RU"} />
                </div>
              </>
            );
          })()}
        </CardDialogContent>
      </Dialog>
    </div>
  );
}
