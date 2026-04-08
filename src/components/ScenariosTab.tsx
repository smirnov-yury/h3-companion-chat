import { useState, useEffect } from "react";
import { Search, Map as MapIcon, BookOpen, Users, Clock, Gauge, Swords, Heart, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import ScenarioDetail from "@/components/ScenarioDetail";

interface Scenario {
  id: string;
  book_id: string;
  slug: string;
  mode: string;
  title_en: string;
  title_ru: string | null;
  summary_en: string | null;
  summary_ru: string | null;
  min_players: number | null;
  max_players: number | null;
  rounds_min: number | null;
  rounds_max: number | null;
  scenario_length_text_en: string | null;
  scenario_length_text_ru: string | null;
  difficulty_text_en: string | null;
  difficulty_text_ru: string | null;
  has_map_variants: boolean;
  has_story: boolean;
  has_ai_setup: boolean;
  campaign_group_en: string | null;
  campaign_group_ru: string | null;
  sort_order: number;
  book_title_en?: string;
  book_title_ru?: string | null;
}

const MODE_COLORS: Record<string, string> = {
  clash: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  cooperative: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  campaign: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const MODE_LABELS_EN: Record<string, string> = { clash: "Clash", cooperative: "Cooperative", campaign: "Campaign" };
const MODE_LABELS_RU: Record<string, string> = { clash: "Столкновение", cooperative: "Кооператив", campaign: "Кампания" };
const MODE_ICONS: Record<string, typeof Swords> = { clash: Swords, cooperative: Heart, campaign: Crown };
const MODE_ORDER = ["clash", "cooperative", "campaign"];

interface Props { searchQuery?: string; }

export default function ScenariosTab({ searchQuery = "" }: Props) {
  const { lang } = useLang();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [filterMode, setFilterMode] = useState("all");

  useEffect(() => {
    (async () => {
      const { data: scenData } = await supabase.from("scenarios").select("*").order("sort_order");
      const { data: bookData } = await supabase.from("scenario_books").select("id, title_en, title_ru");
      const bookMap = new Map((bookData || []).map(b => [b.id, b]));
      const items: Scenario[] = (scenData || []).map(s => ({
        ...s,
        book_title_en: bookMap.get(s.book_id)?.title_en,
        book_title_ru: bookMap.get(s.book_id)?.title_ru,
      }));
      setScenarios(items);
      setLoaded(true);
    })();
  }, []);

  const q = searchQuery.toLowerCase();
  const afterMode = filterMode === "all" ? scenarios : scenarios.filter(s => s.mode === filterMode);
  const filtered = searchQuery
    ? afterMode.filter(s => {
        const fields = [s.title_en, s.title_ru, s.summary_en, s.summary_ru, s.campaign_group_en];
        return fields.some(f => f && f.toLowerCase().includes(q));
      })
    : afterMode;

  const title = (s: Scenario) => lang === "RU" ? (s.title_ru || s.title_en) : s.title_en;
  const modeLabel = (m: string) => lang === "RU" ? (MODE_LABELS_RU[m] || m) : (MODE_LABELS_EN[m] || m);

  const playerText = (s: Scenario) => {
    if (!s.min_players) return null;
    if (s.min_players === s.max_players) return `${s.min_players}`;
    return `${s.min_players}–${s.max_players}`;
  };

  const roundsText = (s: Scenario) => {
    if (!s.rounds_min) return null;
    if (s.rounds_min === s.rounds_max) return `${s.rounds_min}`;
    return `${s.rounds_min}–${s.rounds_max}`;
  };

  // Group by mode, then campaign by campaign_group
  const grouped = MODE_ORDER.filter(m => filterMode === "all" || filterMode === m)
    .map(mode => ({
      mode,
      items: filtered.filter(s => s.mode === mode),
    }))
    .filter(g => g.items.length > 0);

  if (!loaded) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground text-sm">{lang === "RU" ? "Загрузка…" : "Loading…"}</p></div>;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Mode filters */}
        <div className="flex gap-1.5 overflow-x-auto px-3 pt-3 pb-2 scrollbar-none shrink-0">
          {["all", ...MODE_ORDER].map(m => (
            <button key={m} onClick={() => setFilterMode(m)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${filterMode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {m === "all" ? (lang === "RU" ? "Все" : "All") : modeLabel(m)}
            </button>
          ))}
        </div>

        <div className="p-3 pt-0 overflow-y-auto flex-1">
          {filtered.length === 0 && searchQuery ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <Search size={32} />
              <p className="text-sm">{lang === "RU" ? "Ничего не найдено" : "Nothing found"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map(({ mode, items }) => {
                const ModeIcon = MODE_ICONS[mode] || Swords;
                if (mode === "campaign") {
                  // Sub-group by campaign_group
                  const groups = new Map<string, Scenario[]>();
                  items.forEach(s => {
                    const key = (lang === "RU" ? (s.campaign_group_ru || s.campaign_group_en) : s.campaign_group_en) || "Other";
                    if (!groups.has(key)) groups.set(key, []);
                    groups.get(key)!.push(s);
                  });
                  return (
                    <div key={mode}>
                      <div className="flex items-center gap-2 mb-2">
                        <ModeIcon className="w-4 h-4 text-amber-500" />
                        <h2 className="text-sm font-bold text-foreground">{modeLabel(mode)}</h2>
                      </div>
                      {Array.from(groups.entries()).map(([groupName, groupItems]) => (
                        <div key={groupName} className="mb-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-1.5 ml-1">{groupName}</p>
                          <div className="grid grid-cols-1 gap-2">
                            {groupItems.map(s => renderCard(s))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                return (
                  <div key={mode}>
                    <div className="flex items-center gap-2 mb-2">
                      <ModeIcon className={`w-4 h-4 ${mode === "clash" ? "text-blue-500" : "text-green-500"}`} />
                      <h2 className="text-sm font-bold text-foreground">{modeLabel(mode)}</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {items.map(s => renderCard(s))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <ScenarioDetail scenario={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );

  function renderCard(s: Scenario) {
    const pt = playerText(s);
    const rt = roundsText(s);
    const diff = lang === "RU" ? (s.difficulty_text_ru || s.difficulty_text_en) : s.difficulty_text_en;
    return (
      <button key={s.id} onClick={() => setSelected(s)}
        className="flex flex-col rounded-xl border border-border bg-card p-3 text-left hover:border-primary transition-colors w-full">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground flex-1">{title(s)}</p>
          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${MODE_COLORS[s.mode] || "bg-muted text-muted-foreground"}`}>
            {modeLabel(s.mode)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {lang === "RU" ? (s.summary_ru || s.summary_en) : s.summary_en}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {pt && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users size={12} /> {pt} {lang === "RU" ? "игр." : "players"}
            </span>
          )}
          {rt && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock size={12} /> {rt} {lang === "RU" ? "раунд." : "rounds"}
            </span>
          )}
          {diff && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Gauge size={12} /> {diff}
            </span>
          )}
          {s.has_map_variants && <Map size={12} className="text-muted-foreground" />}
          {s.has_story && <BookOpen size={12} className="text-muted-foreground" />}
        </div>
      </button>
    );
  }
}
