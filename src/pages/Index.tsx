import { useCallback, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import TopAppBar from "@/components/TopAppBar";
import NavDrawer, { type TabId, navItems } from "@/components/NavDrawer";
import ChatScreen from "@/components/ChatScreen";
import RulesTab from "@/components/RulesTab";
import DecksTab from "@/components/DecksTab";
import ScenariosTab from "@/components/ScenariosTab";
import UnitsTab from "@/components/UnitsTab";
import TownsTab from "@/components/TownsTab";
import HeroesTab from "@/components/HeroesTab";
import GlobalEventsTab from "@/components/GlobalEventsTab";
import MapElementsTab from "@/components/MapElementsTab";
import BackToTop from "@/components/BackToTop";
import SEOMeta from "@/components/SEOMeta";
import { useLang } from "@/context/LanguageContext";
import {
  DEFAULT_SLUG,
  findSectionBySlug,
  findSectionByTabId,
  toSlug,
} from "@/config/sectionRegistry";

export default function Index() {
  const navigate = useNavigate();
  const params = useParams<{ section?: string; "*"?: string }>();
  const [searchParams] = useSearchParams();
  const { lang } = useLang();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrollToRuleId, setScrollToRuleId] = useState<string | null>(null);

  const initialSearch = searchParams.get("q") ?? "";

  // Derive active tab from URL. Unknown slug → default section.
  const matched = findSectionBySlug(params.section) ?? findSectionBySlug(DEFAULT_SLUG)!;
  const tab: TabId = matched.tabId;

  // Parse path segments after section slug: e.g. /heroes/castle/adelaide → ["castle","adelaide"]
  const restSegments = (params["*"] ?? "").split("/").filter(Boolean);

  // Disambiguate filter vs card id based on registry levels.
  // levels: ['id']                   → seg0 = card
  // levels: ['filter', 'id']         → 1 seg = ambiguous (filter OR card), 2 segs = filter+card
  // levels: ['subtype', 'filter', 'id'] (decks) → 1=subtype, 2=subtype+(filter|card), 3=all
  let urlFilter: string | undefined;
  let urlCardId: string | undefined;
  let urlSubtype: string | undefined;
  let urlDeckFilter: string | undefined;
  let urlDeckCardAmbiguous: string | undefined;

  if (matched.slug === "decks") {
    urlSubtype = restSegments[0];
    // For decks, seg1 could be filter or card; seg2 is card if both filter+card.
    if (restSegments.length === 2) {
      urlDeckCardAmbiguous = restSegments[1]; // tab decides: filter or card
    } else if (restSegments.length >= 3) {
      urlDeckFilter = restSegments[1];
      urlCardId = restSegments[2];
    }
  } else if (matched.levels.length === 1 && matched.levels[0] === "id") {
    // Single-level: seg0 is card id
    urlCardId = restSegments[0];
  } else if (matched.levels.length >= 2) {
    if (restSegments.length === 1) {
      // Ambiguous: pass only as initialCardId; tab resolves whether it's a filter or card.
      // urlFilter stays undefined so close/open URL builders don't preserve a non-explicit filter.
      urlCardId = restSegments[0];
    } else if (restSegments.length >= 2) {
      urlFilter = restSegments[0];
      urlCardId = restSegments[1];
    }
  }

  const handleTabChange = useCallback(
    (newTab: TabId) => {
      const def = findSectionByTabId(newTab);
      if (def) navigate(`/${def.slug}`);
    },
    [navigate],
  );

  const handleNavigateToRule = useCallback(
    (ruleId: string) => {
      setScrollToRuleId(ruleId);
      const rules = findSectionByTabId("rules");
      if (rules) navigate(`/${rules.slug}`);
    },
    [navigate],
  );

  /** Push /:section/:filterSlug, or /:section if filter cleared. */
  const handleFilterChange = useCallback(
    (filterValue: string | null) => {
      const slug = matched.slug;
      if (!filterValue) navigate(`/${slug}`);
      else navigate(`/${slug}/${toSlug(filterValue)}`);
    },
    [matched.slug, navigate],
  );

  /** Open card → /:section/:filter/:cardId or /:section/:cardId */
  const handleCardOpen = useCallback(
    (cardId: string, currentFilter?: string | null) => {
      const slug = matched.slug;
      const filterPart = currentFilter ? `/${toSlug(currentFilter)}` : "";
      navigate(`/${slug}${filterPart}/${cardId}`);
    },
    [matched.slug, navigate],
  );

  /** Close card → /:section/:filter or /:section */
  const handleCardClose = useCallback(
    (currentFilter?: string | null) => {
      const slug = matched.slug;
      const filterPart = currentFilter ? `/${toSlug(currentFilter)}` : "";
      navigate(`/${slug}${filterPart}`);
    },
    [matched.slug, navigate],
  );

  /** Decks: subtype change → /decks/:subtype (clears filter+card). */
  const handleDecksSubtypeChange = useCallback(
    (subtype: string) => {
      navigate(`/decks/${toSlug(subtype)}`);
    },
    [navigate],
  );

  /** Decks: filter change within current subtype. */
  const handleDecksFilterChange = useCallback(
    (subtype: string, filterValue: string | null) => {
      if (!filterValue) navigate(`/decks/${toSlug(subtype)}`);
      else navigate(`/decks/${toSlug(subtype)}/${toSlug(filterValue)}`);
    },
    [navigate],
  );

  /** Decks: open card → /decks/:subtype/:filter/:id or /decks/:subtype/:id */
  const handleDecksCardOpen = useCallback(
    (subtype: string, filterValue: string | null, cardId: string) => {
      const sub = toSlug(subtype);
      if (filterValue) navigate(`/decks/${sub}/${toSlug(filterValue)}/${cardId}`);
      else navigate(`/decks/${sub}/${cardId}`);
    },
    [navigate],
  );

  /** Decks: close card → /decks/:subtype/:filter or /decks/:subtype */
  const handleDecksCardClose = useCallback(
    (subtype: string, filterValue: string | null) => {
      const sub = toSlug(subtype);
      if (filterValue) navigate(`/decks/${sub}/${toSlug(filterValue)}`);
      else navigate(`/decks/${sub}`);
    },
    [navigate],
  );

  const current = navItems.find((n) => n.id === tab)!;
  const title = lang === "RU" ? current.labelRU : current.labelEN;

  return (
    <div className="flex flex-col h-dvh">
      <TopAppBar title={title} icon={current.icon} onMenuClick={() => setDrawerOpen(true)} />
      <NavDrawer open={drawerOpen} onOpenChange={setDrawerOpen} active={tab} onChange={handleTabChange} />
      <div className="flex-1 flex flex-col overflow-hidden pt-11 lg:ml-56">
        {tab === "ai" ? (
          <ChatScreen />
        ) : tab === "rules" ? (
          <RulesTab
            scrollToRuleId={scrollToRuleId}
            onScrollHandled={() => setScrollToRuleId(null)}
            initialFilter={urlFilter}
            initialCardId={urlCardId}
            initialSearch={initialSearch}
            onFilterChange={handleFilterChange}
            onCardOpen={handleCardOpen}
            onCardClose={handleCardClose}
          />
        ) : tab === "decks" ? (
          <DecksTab
            initialSubtype={urlSubtype}
            initialFilter={urlDeckFilter}
            initialCardId={urlCardId}
            initialAmbiguous={urlDeckCardAmbiguous}
            initialSearch={initialSearch}
            onSubtypeChange={handleDecksSubtypeChange}
            onFilterChange={handleDecksFilterChange}
            onCardOpen={handleDecksCardOpen}
            onCardClose={handleDecksCardClose}
          />
        ) : tab === "scenarios" ? (
          <ScenariosTab
            initialCardId={urlCardId}
            searchQuery={initialSearch}
            onCardOpen={handleCardOpen}
            onCardClose={handleCardClose}
          />
        ) : tab === "map_elements" ? (
          <MapElementsTab
            initialFilter={urlFilter}
            initialCardId={urlCardId}
            initialSearch={initialSearch}
            onFilterChange={handleFilterChange}
            onCardOpen={handleCardOpen}
            onCardClose={handleCardClose}
          />
        ) : tab === "global_events" ? (
          <GlobalEventsTab
            initialCardId={urlCardId}
            initialSearch={initialSearch}
            onCardOpen={handleCardOpen}
            onCardClose={handleCardClose}
          />
        ) : tab === "units" ? (
          <UnitsTab
            initialFilter={urlFilter}
            initialCardId={urlCardId}
            initialSearch={initialSearch}
            onFilterChange={handleFilterChange}
            onCardOpen={handleCardOpen}
            onCardClose={handleCardClose}
          />
        ) : tab === "towns" ? (
          <TownsTab
            initialCardId={urlCardId}
            onCardOpen={handleCardOpen}
            onCardClose={handleCardClose}
          />
        ) : tab === "heroes" ? (
          <HeroesTab
            initialFilter={urlFilter}
            initialCardId={urlCardId}
            initialSearch={initialSearch}
            onFilterChange={handleFilterChange}
            onCardOpen={handleCardOpen}
            onCardClose={handleCardClose}
          />
        ) : null}
      </div>
      <BackToTop />
    </div>
  );
}
