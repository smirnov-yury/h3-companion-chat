import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGlyphs } from '@/context/GlyphsContext';
import { useLang } from '@/context/LanguageContext';
import { renderGlyphs } from '@/utils/renderGlyphs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Swords, Shield, Heart, Zap } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;

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
  content: string | null;
  image: string | null;
  sort_order: number;
}

type ModeFilter = 'all' | 'standard' | 'neutral';

// Faction variant order (no Neutral here)
const FACTION_VARIANT_ORDER = ['Few', 'Pack', 'Few (Alternate)', 'Pack (Alternate)'];

const TIER_COLOR: Record<string, string> = {
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-slate-400 text-white',
  golden: 'bg-yellow-500 text-black',
  azure: 'bg-sky-500 text-white',
};

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  unit_ground: { label: 'Ground', color: 'bg-gray-600/80' },
  unit_ranged: { label: 'Ranged', color: 'bg-green-700/80' },
  unit_flying: { label: 'Flying', color: 'bg-blue-700/80' },
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
  return <span dangerouslySetInnerHTML={{ __html: renderGlyphs(text, glyphs) }} />;
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

export default function UnitsTab() {
  const { lang } = useLang();
  const [units, setUnits] = useState<UnitStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [filterFaction, setFilterFaction] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [mode, setMode] = useState<ModeFilter>('all');

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

  // Build display items based on filters
  const displayItems = useMemo(() => {
    const items: DisplayItem[] = [];

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
        items.push({ key: `neutral-${u.id}`, unit: u, variants: [u], isNeutral: true });
      }
    }

    return items;
  }, [factionGroups, neutralUnits, mode, filterFaction, filterTier, filterType]);

  // Find selected item for modal
  const selectedItem = useMemo(() => {
    if (!selectedKey) return null;
    return displayItems.find((i) => i.key === selectedKey) ?? null;
  }, [selectedKey, displayItems]);

  const modeLabels: Record<ModeFilter, string> =
    lang === 'RU'
      ? { all: 'Все', standard: 'Обычные', neutral: 'Нейтралы' }
      : { all: 'All', standard: 'Standard', neutral: 'Neutral' };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="shrink-0 p-3 space-y-2 border-b border-border bg-background">
        {/* Row 1: Mode switch */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(['all', 'standard', 'neutral'] as ModeFilter[]).map((m) => (
            <FilterChip key={m} label={modeLabels[m]} active={mode === m} onClick={() => setMode(m)} />
          ))}
        </div>

        {/* Row 2: Faction chips (only for All / Standard) */}
        {mode !== 'neutral' && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {factions.map((f) => (
              <FilterChip
                key={f}
                label={f === 'all' ? (lang === 'RU' ? 'Все' : 'All') : f}
                active={filterFaction === f}
                onClick={() => setFilterFaction(f)}
              />
            ))}
          </div>
        )}

        {/* Row 3: Tier + Type */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tiers.map((t) => (
            <FilterChip
              key={t}
              label={t === 'all' ? (lang === 'RU' ? 'Все' : 'All') : capitalize(t)}
              active={filterTier === t}
              onClick={() => setFilterTier(t)}
            />
          ))}
          <div className="w-px bg-border mx-1 shrink-0" />
          {types.map((t) => (
            <FilterChip
              key={t}
              label={
                t === 'all'
                  ? lang === 'RU' ? 'Все' : 'All'
                  : capitalize(t.replace('unit_', ''))
              }
              active={filterType === t}
              onClick={() => setFilterType(t)}
            />
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-3">
        {displayItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {lang === 'RU' ? 'Юниты не найдены' : 'No units found'}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {displayItems.map((item) => {
              const unit = item.unit;
              const imgSrc = unit.image ? `${STORAGE}/units/${unit.image}` : null;
              return (
                <button
                  key={item.key}
                  onClick={() => setSelectedKey(item.key)}
                  className="flex flex-col rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary transition-colors"
                >
                  <div className="relative aspect-square bg-muted">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={unit.name_en}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`${imgSrc ? 'hidden' : 'flex'} items-center justify-center h-full text-muted-foreground text-xs text-center p-2`}
                    >
                      {lang === 'RU' && unit.name_ru ? unit.name_ru : unit.name_en}
                    </div>
                    {unit.type && TYPE_BADGE[unit.type] && (
                      <span className={`absolute bottom-1 left-1 rounded-sm text-[10px] font-semibold uppercase tracking-wide text-white px-1.5 py-0.5 ${TYPE_BADGE[unit.type].color}`}>
                        {TYPE_BADGE[unit.type].label}
                      </span>
                    )}
                    <Badge
                      className={`absolute bottom-1 right-1 text-[10px] ${TIER_COLOR[unit.tier] ?? 'bg-muted text-foreground'}`}
                    >
                      {capitalize(unit.tier)}
                    </Badge>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold truncate">
                      {lang === 'RU' && unit.name_ru ? unit.name_ru : unit.name_en}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{unit.town || '—'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selectedKey} onOpenChange={(o) => !o && setSelectedKey(null)}>
        <DialogContent className="max-w-md max-h-[80dvh] flex flex-col">
          {selectedItem && (() => {
            const { variants } = selectedItem;
            const base = variants[0];
            return (
              <>
                <DialogHeader className="shrink-0">
                  <DialogTitle>
                    {lang === 'RU' && base.name_ru ? base.name_ru : base.name_en}
                  </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue={variants[0].number} className="flex-1 flex flex-col min-h-0">
                  {variants.length > 1 && (
                    <TabsList className="w-full flex-wrap h-auto gap-1 shrink-0">
                      {variants.map((u) => (
                        <TabsTrigger key={u.id} value={u.number}>
                          {u.number}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  )}

                  {variants.map((u) => {
                    const imgSrc = u.image ? `${STORAGE}/units/${u.image}` : null;
                    const abilities = lang === 'RU' && u.abilities_ru ? u.abilities_ru : u.abilities_en;
                    const notes = lang === 'RU' && u.notes_ru ? u.notes_ru : u.notes_en;

                    return (
                      <TabsContent key={u.id} value={u.number} className="flex-1 flex flex-col min-h-0 mt-0 data-[state=active]:flex">
                        {/* Fixed image */}
                        <div className="shrink-0 py-3">
                          {imgSrc ? (
                            <div className="relative w-full max-w-[280px] mx-auto bg-muted rounded-lg overflow-hidden">
                              <img
                                src={imgSrc}
                                alt={u.name_en}
                                className="w-full max-w-[280px] mx-auto aspect-[2/3] object-contain"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              <div className="hidden items-center justify-center aspect-[2/3] text-muted-foreground text-sm">
                                {lang === 'RU' && u.name_ru ? u.name_ru : u.name_en}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full max-w-[280px] mx-auto aspect-[2/3] rounded-lg bg-muted text-muted-foreground text-sm">
                              {lang === 'RU' && u.name_ru ? u.name_ru : u.name_en}
                            </div>
                          )}
                        </div>

                        {/* Scrollable stats + text */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                          <div className="grid grid-cols-4 gap-2 text-center">
                            {(['attack', 'defense', 'health_points', 'initiative'] as const).map((stat) => {
                              const cfg = STAT_CONFIG[stat];
                              const Icon = cfg.icon;
                              return (
                                <div key={stat} className="rounded-lg bg-muted/50 p-2 flex flex-col items-center">
                                  <Icon size={18} className={cfg.color} />
                                  <p className="text-lg font-bold">{u[stat]}</p>
                                  <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
                                </div>
                              );
                            })}
                          </div>

                          {u.cost && (
                            <div className="text-sm">
                              <span className="font-semibold">
                                {lang === 'RU' ? 'Стоимость' : 'Cost'}
                              </span>{' '}
                              <GlyphText text={u.cost} />
                            </div>
                          )}

                          {abilities && (
                            <div className="text-sm space-y-1">
                              <p className="font-semibold">
                                {lang === 'RU' ? 'Способности' : 'Abilities'}
                              </p>
                              <GlyphText text={abilities} />
                            </div>
                          )}

                          {notes && (
                            <div className="text-sm text-muted-foreground">
                              <GlyphText text={notes} />
                            </div>
                          )}

                          {u.content && <Badge variant="outline">{u.content}</Badge>}
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
