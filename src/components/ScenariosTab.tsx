import { useState, useEffect, useMemo } from "react";
import { Map as MapIcon, BookOpen, Users, Clock, Gauge, Swords, Heart, Crown, Shield, User, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import ScenarioDetail from "@/components/ScenarioDetail";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EmptyState, SkeletonList } from "@/components/ui/empty-state";

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

interface Book { id: string; title_en: string; title_ru: string | null; }

const MODE_COLORS: Record<string, string> = {
  clash: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  cooperative: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  campaign: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  alliance: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  solo: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
};

const MODE_LABELS_EN: Record<string, string> = { clash: "Clash", cooperative: "Coop", campaign: "Campaign", alliance: "Alliance", solo: "Solo" };
const MODE_LABELS_RU: Record<string, string> = { clash: "Столкновение", cooperative: "Кооператив", campaign: "Кампания", alliance: "Альянс", solo: "Соло" };
const MODE_ICONS: Record<string, typeof Swords> = { clash: Swords, cooperative: Heart, campaign: Crown, alliance: Shield, solo: User };
const MODE_ORDER = ["clash", "cooperative", "campaign", "alliance", "solo"];

interface Props {
  searchQuery?: string;
  initialCardId?: string;
  onCardOpen?: (cardId: string) => void;
  onCardClose?: () => void;
}

export default function ScenariosTab({ searchQuery = "", initialCardId, onCardOpen, onCardClose }: Props) {
  const { lang } = useLang();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Applied filters
  const [filterMode, setFilterMode] = useState("all");
  const [filterPlayers, setFilterPlayers] = useState("all");
  const [filterBook, setFilterBook] = useState("all");

  // Draft filters (inside sheet)
  const [draftMode, setDraftMode] = useState("all");
  const [draftPlayers, setDraftPlayers] = useState("all");
  const [draftBook, setDraftBook] = useState("all");

  useEffect(() => {
    (async () => {
      const { data: scenData } = await supabase.from("scenarios").select("*").order("sort_order");
      const { data: bookData } = await supabase.from("scenario_books").select("id, title_en, title_ru");
      const bookList = bookData || [];
      const bookMap = new Map(bookList.map(b => [b.id, b]));
      const items: Scenario[] = (scenData || []).map(s => ({
        ...s,
        book_title_en: bookMap.get(s.book_id)?.title_en,
        book_title_ru: bookMap.get(s.book_id)?.title_ru,
      }));
      setScenarios(items);
      setBooks(bookList);
      setLoaded(true);
    })();
  }, []);

  const activeCount = [filterMode, filterPlayers, filterBook].filter(f => f !== "all").length;

  const q = searchQuery.toLowerCase();
  const filtered = useMemo(() => {
    let result = scenarios;
    if (filterMode !== "all") result = result.filter(s => s.mode === filterMode);
    if (filterPlayers !== "all") {
      const pc = Number(filterPlayers);
      result = result.filter(s => s.min_players != null && s.max_players != null && pc >= s.min_players && pc <= s.max_players);
    }
    if (filterBook !== "all") result = result.filter(s => s.book_id === filterBook);
    if (searchQuery) {
      result = result.filter(s => {
        const fields = [s.title_en, s.title_ru, s.summary_en, s.summary_ru, s.campaign_group_en];
        return fields.some(f => f && f.toLowerCase().includes(q));
      });
    }
    return result;
  }, [scenarios, filterMode, filterPlayers, filterBook, searchQuery, q]);

  const title = (s: Scenario) => lang === "RU" ? (s.title_ru || s.title_en) : s.title_en;
  const modeLabel = (m: string) => lang === "RU" ? (MODE_LABELS_RU[m] || m) : (MODE_LABELS_EN[m] || m);
  const bookLabel = (b: Book) => lang === "RU" ? (b.title_ru || b.title_en) : b.title_en;

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

  const grouped = MODE_ORDER.filter(m => filterMode === "all" || filterMode === m)
    .map(mode => ({ mode, items: filtered.filter(s => s.mode === mode) }))
    .filter(g => g.items.length > 0);

  const openSheet = () => {
    setDraftMode(filterMode);
    setDraftPlayers(filterPlayers);
    setDraftBook(filterBook);
    setSheetOpen(true);
  };

  const applyFilters = () => {
    setFilterMode(draftMode);
    setFilterPlayers(draftPlayers);
    setFilterBook(draftBook);
    setSheetOpen(false);
  };

  const resetDraft = () => {
    setDraftMode("all");
    setDraftPlayers("all");
    setDraftBook("all");
  };

  const allLabel = lang === "RU" ? "Все" : "All";
  const PILL = "px-3 py-1.5 lg:px-4 lg:py-2 rounded-full text-xs font-medium transition-colors text-center w-auto";
  const PILL_ON = "bg-primary text-primary-foreground";
  const PILL_OFF = "bg-muted text-muted-foreground";

  const resetAllFilters = () => { setFilterMode("all"); setFilterPlayers("all"); setFilterBook("all"); };
  const hasAnyFilter = activeCount > 0 || !!searchQuery;

  if (!loaded) return <div className="p-3 h-full overflow-y-auto"><SkeletonList /></div>;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Filter button */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <button onClick={openSheet}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${activeCount > 0 ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
            <SlidersHorizontal size={14} />
            {lang === "RU" ? "Фильтры" : "Filters"}{activeCount > 0 && ` · ${activeCount}`}
          </button>
        </div>

        <div className="p-3 pt-0 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <EmptyState onReset={hasAnyFilter ? resetAllFilters : undefined} />
          ) : (
            <div className="space-y-4">
              {grouped.map(({ mode, items }) => {
                const ModeIcon = MODE_ICONS[mode] || Swords;
                if (mode === "campaign") {
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
                      <ModeIcon className={`w-4 h-4 ${mode === "clash" ? "text-blue-500" : mode === "alliance" ? "text-purple-500" : mode === "solo" ? "text-slate-500" : "text-green-500"}`} />
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

      {/* Filter Bottom Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[70dvh] rounded-t-2xl flex flex-col max-w-2xl lg:mx-auto">
          <SheetHeader className="shrink-0">
            <SheetTitle>{lang === "RU" ? "Фильтры" : "Filters"}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-5 py-4">
            {/* Mode */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">{lang === "RU" ? "Режим" : "Mode"}</p>
              <div className="flex flex-wrap gap-2">
                {["all", ...MODE_ORDER].map(m => (
                  <button key={m} onClick={() => setDraftMode(m)}
                    className={`${PILL} ${draftMode === m ? PILL_ON : PILL_OFF}`}>
                    {m === "all" ? allLabel : modeLabel(m)}
                  </button>
                ))}
              </div>
            </div>

            {/* Players */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">{lang === "RU" ? "Игроки" : "Players"}</p>
              <div className="flex flex-wrap gap-2">
                {["all", "1", "2", "3", "4"].map(p => (
                  <button key={p} onClick={() => setDraftPlayers(p)}
                    className={`${PILL} ${draftPlayers === p ? PILL_ON : PILL_OFF}`}>
                    {p === "all" ? allLabel : p}
                  </button>
                ))}
              </div>
            </div>

            {/* Book */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">{lang === "RU" ? "Книга" : "Book"}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setDraftBook("all")}
                  className={`${PILL} ${draftBook === "all" ? PILL_ON : PILL_OFF}`}>
                  {allLabel}
                </button>
                {books.map(b => (
                  <button key={b.id} onClick={() => setDraftBook(b.id)}
                    className={`${PILL} ${draftBook === b.id ? PILL_ON : PILL_OFF}`}>
                    {bookLabel(b)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="flex gap-3 pt-3 pb-2 border-t border-border shrink-0">
            <button onClick={resetDraft}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors">
              {lang === "RU" ? "Сбросить" : "Reset"}
            </button>
            <button onClick={applyFilters}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              {lang === "RU" ? "Применить" : "Apply"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

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
          {s.has_map_variants && <MapIcon size={12} className="text-muted-foreground" />}
          {s.has_story && <BookOpen size={12} className="text-muted-foreground" />}
        </div>
      </button>
    );
  }
}
