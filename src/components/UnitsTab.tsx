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
  id: string; name_en: string; name_ru: string | null;
  slug: string; town: string; number: string; tier: string; type: string;
  attack: number; defense: number; health_points: number; initiative: number;
  cost: string | null; abilities_en: string | null; abilities_ru: string | null;
  notes_en: string | null; notes_ru: string | null; content: string | null;
  image: string | null; sort_order: number;
}

type NeutralFilter = 'all' | 'normal' | 'neutral';

function groupHasNeutral(variants: UnitStat[]): boolean {
  return variants.some(u => u.number === 'Neutral');
}

function groupHasNormal(variants: UnitStat[]): boolean {
  return variants.some(u => u.number !== 'Neutral');
}

const TIER_COLOR: Record<string, string> = {
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-slate-400 text-white',
  golden: 'bg-yellow-500 text-black',
};

const TYPE_ICON: Record<string, string> = {
  unit_ground: '🛡️', unit_ranged: '🏹', unit_flying: '🦅',
};

const STAT_GLYPH_TOKENS: Record<string, string> = {
  ATK: 'attack',
  DEF: 'defense',
  HP: 'health_points',
  INI: 'initiative',
};

function GlyphText({ text }: { text: string | null | undefined }) {
  const { glyphs } = useGlyphs();
  if (!text) return null;
  return <span dangerouslySetInnerHTML={{ __html: renderGlyphs(text, glyphs) }} />;
}

function StatLabel({ label }: { label: string }) {
  const { glyphs } = useGlyphs();
  const token = STAT_GLYPH_TOKENS[label];
  if (token && glyphs[token]) {
    return <span dangerouslySetInnerHTML={{ __html: renderGlyphs(`<${token}>`, glyphs) }} />;
  }
  return <>{label}</>;
}

export default function UnitsTab() {
  const { lang } = useLang();
  const [units, setUnits] = useState<UnitStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [filterFaction, setFilterFaction] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterNeutral, setFilterNeutral] = useState<NeutralFilter>('all');

  useEffect(() => {
    supabase.from('unit_stats').select('*').order('sort_order').then(({ data }) => {
      if (data) setUnits(data as UnitStat[]);
      setLoading(false);
    });
  }, []);

  const factions = useMemo(() => {
    const towns = new Set<string>();
    units.forEach(u => { if (u.town) towns.add(u.town); });
    return ['all', ...Array.from(towns).sort()];
  }, [units]);

  const tiers = ['all', 'bronze', 'silver', 'golden'];
  const types = ['all', 'unit_ground', 'unit_ranged', 'unit_flying'];

  const grouped = useMemo(() => {
    const slugMap: Record<string, UnitStat[]> = {};
    units.forEach(u => {
      if (filterFaction !== 'all' && u.town !== filterFaction) return;
      if (filterTier !== 'all' && u.tier !== filterTier) return;
      if (filterType !== 'all' && u.type !== filterType) return;
      (slugMap[u.slug] ??= []).push(u);
    });
    if (filterNeutral === 'neutral') {
      Object.keys(slugMap).forEach(s => { if (!groupHasNeutral(slugMap[s])) delete slugMap[s]; });
    } else if (filterNeutral === 'normal') {
      Object.keys(slugMap).forEach(s => { if (!groupHasNormal(slugMap[s])) delete slugMap[s]; });
    }
    return slugMap;
  }, [units, filterFaction, filterTier, filterType, filterNeutral]);

  const selectedUnits = useMemo(() =>
    selectedSlug ? (grouped[selectedSlug] ?? units.filter(u => u.slug === selectedSlug)) : [],
    [selectedSlug, grouped, units]
  );

  const FilterBtn = ({ label, value, active, onClick }: { label: string; value: string; active: string; onClick: (v: string) => void }) => (
    <button
      onClick={() => onClick(value)}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${active === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
    >
      {label}
    </button>
  );

  if (loading) return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="shrink-0 p-3 space-y-2 border-b border-border bg-background">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {factions.map(f => {
            let label = f;
            if (f === 'all') label = lang === 'RU' ? 'Все' : 'All';
            else if (f === 'neutrals') label = lang === 'RU' ? 'Нейтралы' : 'Neutrals';
            return <FilterBtn key={f} label={label} value={f} active={filterFaction} onClick={setFilterFaction} />;
          })}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tiers.map(t => (
            <FilterBtn key={t} label={t === 'all' ? (lang === 'RU' ? 'Все' : 'All') : t} value={t} active={filterTier} onClick={setFilterTier} />
          ))}
          <div className="w-px bg-border mx-1" />
          {types.map(t => (
            <FilterBtn key={t} label={t === 'all' ? (lang === 'RU' ? 'Все' : 'All') : `${TYPE_ICON[t] ?? ''} ${t.replace('unit_', '')}`} value={t} active={filterType} onClick={setFilterType} />
          ))}
        </div>
      </div>

      {/* Units grid */}
      <div className="flex-1 overflow-auto p-3">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {lang === 'RU' ? 'Юниты не найдены' : 'No units found'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(grouped).map(([slug, variants]) => {
              const unit = variants.find(u => u.number === 'Few') ?? variants[0];
              const imgSrc = unit.image ? `${STORAGE}/units/${unit.image}` : null;
              return (
                <button
                  key={slug}
                  onClick={() => setSelectedSlug(slug)}
                  className="flex flex-col rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary transition-colors"
                >
                  <div className="relative aspect-square bg-muted">
                    {imgSrc ? (
                      <img src={imgSrc} alt={unit.name_en} className="w-full h-full object-contain" loading="lazy" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">No image</div>
                    )}
                    <Badge className={`absolute top-1 left-1 text-[10px] ${TIER_COLOR[unit.tier] ?? 'bg-muted text-foreground'}`}>
                      {unit.tier}
                    </Badge>
                    <span className="absolute top-1 right-1 text-sm">{TYPE_ICON[unit.type] ?? ''}</span>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold truncate">{lang === 'RU' && unit.name_ru ? unit.name_ru : unit.name_en}</p>
                    <p className="text-[10px] text-muted-foreground">{isNeutral(unit.town) ? (lang === 'RU' ? 'Нейтралы' : 'Neutrals') : unit.town}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Unit detail modal */}
      <Dialog open={!!selectedSlug} onOpenChange={(o) => !o && setSelectedSlug(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selectedUnits.length > 0 && (() => {
            const base = selectedUnits[0];
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{lang === 'RU' && base.name_ru ? base.name_ru : base.name_en}</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue={selectedUnits[0].number}>
                  <TabsList className="w-full flex-wrap h-auto gap-1">
                    {selectedUnits.map(u => (
                      <TabsTrigger key={u.id} value={u.number}>{u.number}</TabsTrigger>
                    ))}
                  </TabsList>
                  {selectedUnits.map(u => {
                    const imgSrc = u.image ? `${STORAGE}/units/${u.image}` : null;
                    const abilities = lang === 'RU' && u.abilities_ru ? u.abilities_ru : u.abilities_en;
                    const notes = lang === 'RU' && u.notes_ru ? u.notes_ru : u.notes_en;
                    return (
                      <TabsContent key={u.id} value={u.number} className="space-y-3">
                        {imgSrc && <img src={imgSrc} alt={u.name_en} className="w-full max-h-48 object-contain rounded-lg bg-muted" />}
                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {([['ATK', u.attack], ['DEF', u.defense], ['HP', u.health_points], ['INI', u.initiative]] as [string, number][]).map(([label, val]) => (
                            <div key={label} className="rounded-lg bg-muted p-2">
                              <p className="text-[10px] text-muted-foreground"><StatLabel label={label} /></p>
                              <p className="text-lg font-bold">{val}</p>
                            </div>
                          ))}
                        </div>
                        {/* Cost */}
                        {u.cost && (
                          <div className="text-sm">
                            <span className="font-semibold">Cost</span>{' '}
                            <GlyphText text={u.cost} />
                          </div>
                        )}
                        {/* Abilities */}
                        {abilities && (
                          <div className="text-sm space-y-1">
                            <p className="font-semibold">Abilities</p>
                            <GlyphText text={abilities} />
                          </div>
                        )}
                        {/* Notes */}
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
