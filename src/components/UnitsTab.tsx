import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGlyphs } from '@/context/GlyphsContext';
import { useLang } from '@/context/LanguageContext';
import { renderGlyphs } from '@/utils/renderGlyphs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

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

const VARIANT_ORDER = ['Few', 'Pack', 'Neutral'];

const TIER_COLOR: Record<string, string> = {
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-slate-400 text-white',
  golden: 'bg-yellow-500 text-black',
};

const TYPE_ICON: Record<string, string> = {
  unit_ground: '🛡️',
  unit_ranged: '🏹',
  unit_flying: '🦅',
};

const STAT_GLYPH: Record<string, { token: string; fallback: string }> = {
  attack: { token: 'attack', fallback: 'ATK' },
  defense: { token: 'defense', fallback: 'DEF' },
  health_points: { token: 'health_points', fallback: 'HP' },
  initiative: { token: 'initiative', fallback: 'INI' },
};

function StatIcon({ stat }: { stat: string }) {
  const { glyphs } = useGlyphs();
  const cfg = STAT_GLYPH[stat];
  if (!cfg) return null;
  if (glyphs[cfg.token]) {
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: renderGlyphs(`<${cfg.token}>`, glyphs),
        }}
      />
    );
  }
  return <span className="text-[10px] text-muted-foreground">{cfg.fallback}</span>;
}

function GlyphText({ text }: { text: string | null | undefined }) {
  const { glyphs } = useGlyphs();
  if (!text) return null;
  return <span dangerouslySetInnerHTML={{ __html: renderGlyphs(text, glyphs) }} />;
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label}
    </button>
  );
}

export default function UnitsTab() {
  const { lang } = useLang();
  const [units, setUnits] = useState<UnitStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
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

  // All groups keyed by slug
  const allGroups = useMemo(() => {
    const map: Record<string, UnitStat[]> = {};
    units.forEach((u) => {
      (map[u.slug] ??= []).push(u);
    });
    return map;
  }, [units]);

  // Faction list from town field
  const factions = useMemo(() => {
    const towns = new Set<string>();
    units.forEach((u) => {
      if (u.town) towns.add(u.town);
    });
    return ['all', ...Array.from(towns).sort()];
  }, [units]);

  const tiers = ['all', 'bronze', 'silver', 'golden'];
  const types = ['all', 'unit_ground', 'unit_ranged', 'unit_flying'];

  // Filtered groups
  const filtered = useMemo(() => {
    const result: Record<string, UnitStat[]> = {};

    for (const [slug, variants] of Object.entries(allGroups)) {
      // faction filter — check any variant in group
      if (filterFaction !== 'all' && !variants.some((u) => u.town === filterFaction)) continue;
      // tier filter
      if (filterTier !== 'all' && !variants.some((u) => u.tier === filterTier)) continue;
      // type filter
      if (filterType !== 'all' && !variants.some((u) => u.type === filterType)) continue;

      // mode filter
      const hasNeutral = variants.some((u) => u.number === 'Neutral');
      const hasStandard = variants.some((u) => u.number === 'Few' || u.number === 'Pack');

      if (mode === 'neutral' && !hasNeutral) continue;
      if (mode === 'standard' && !hasStandard) continue;

      result[slug] = variants;
    }

    return result;
  }, [allGroups, filterFaction, filterTier, filterType, mode]);

  // Preview card picks best representative
  function pickPreview(variants: UnitStat[]): UnitStat {
    for (const num of VARIANT_ORDER) {
      const found = variants.find((u) => u.number === num);
      if (found) return found;
    }
    return variants[0];
  }

  // Sort variants for modal tabs
  function sortedVariants(variants: UnitStat[]): UnitStat[] {
    return [...variants].sort(
      (a, b) => VARIANT_ORDER.indexOf(a.number) - VARIANT_ORDER.indexOf(b.number)
    );
  }

  const selectedVariants = useMemo(() => {
    if (!selectedSlug) return [];
    const group = allGroups[selectedSlug];
    return group ? sortedVariants(group) : [];
  }, [selectedSlug, allGroups]);

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

  const modeLabels: Record<ModeFilter, string> = lang === 'RU'
    ? { all: 'Все', standard: 'Обычные', neutral: 'Нейтралы' }
    : { all: 'All', standard: 'Standard', neutral: 'Neutral' };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="shrink-0 p-3 space-y-2 border-b border-border bg-background">
        {/* Row 1: Faction chips */}
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

        {/* Row 2: Mode switch + Tier + Type */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(['all', 'standard', 'neutral'] as ModeFilter[]).map((m) => (
            <FilterChip
              key={m}
              label={modeLabels[m]}
              active={mode === m}
              onClick={() => setMode(m)}
            />
          ))}

          <div className="w-px bg-border mx-1 shrink-0" />

          {tiers.map((t) => (
            <FilterChip
              key={t}
              label={t === 'all' ? (lang === 'RU' ? 'Все' : 'All') : t}
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
                  ? lang === 'RU'
                    ? 'Все'
                    : 'All'
                  : `${TYPE_ICON[t] ?? ''} ${t.replace('unit_', '')}`
              }
              active={filterType === t}
              onClick={() => setFilterType(t)}
            />
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-3">
        {Object.keys(filtered).length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {lang === 'RU' ? 'Юниты не найдены' : 'No units found'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(filtered).map(([slug, variants]) => {
              const unit = pickPreview(variants);
              const imgSrc = unit.image ? `${STORAGE}/units/${unit.image}` : null;
              return (
                <button
                  key={slug}
                  onClick={() => setSelectedSlug(slug)}
                  className="flex flex-col rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary transition-colors"
                >
                  <div className="relative aspect-square bg-muted">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={unit.name_en}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                        No image
                      </div>
                    )}
                    <Badge
                      className={`absolute top-1 left-1 text-[10px] ${
                        TIER_COLOR[unit.tier] ?? 'bg-muted text-foreground'
                      }`}
                    >
                      {unit.tier}
                    </Badge>
                    <span className="absolute top-1 right-1 text-sm">
                      {TYPE_ICON[unit.type] ?? ''}
                    </span>
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
      <Dialog open={!!selectedSlug} onOpenChange={(o) => !o && setSelectedSlug(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selectedVariants.length > 0 && (() => {
            const base = selectedVariants[0];
            return (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {lang === 'RU' && base.name_ru ? base.name_ru : base.name_en}
                  </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue={selectedVariants[0].number}>
                  <TabsList className="w-full flex-wrap h-auto gap-1">
                    {selectedVariants.map((u) => (
                      <TabsTrigger key={u.id} value={u.number}>
                        {u.number}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {selectedVariants.map((u) => {
                    const imgSrc = u.image ? `${STORAGE}/units/${u.image}` : null;
                    const abilities =
                      lang === 'RU' && u.abilities_ru ? u.abilities_ru : u.abilities_en;
                    const notes = lang === 'RU' && u.notes_ru ? u.notes_ru : u.notes_en;

                    return (
                      <TabsContent key={u.id} value={u.number} className="space-y-3">
                        {imgSrc && (
                          <img
                            src={imgSrc}
                            alt={u.name_en}
                            className="w-full max-h-48 object-contain rounded-lg bg-muted"
                          />
                        )}

                        {/* Stat cards with glyph icons */}
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {(
                            [
                              ['attack', u.attack],
                              ['defense', u.defense],
                              ['health_points', u.health_points],
                              ['initiative', u.initiative],
                            ] as [string, number][]
                          ).map(([stat, val]) => (
                            <div key={stat} className="rounded-lg bg-muted p-2">
                              <p className="text-[10px] text-muted-foreground">
                                <StatIcon stat={stat} />
                              </p>
                              <p className="text-lg font-bold">{val}</p>
                            </div>
                          ))}
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
