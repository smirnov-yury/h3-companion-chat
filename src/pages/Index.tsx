import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const { lang } = useLang();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrollToRuleId, setScrollToRuleId] = useState<string | null>(null);

  // Derive active tab from URL. Unknown slug → default section.
  const matched = findSectionBySlug(params.section) ?? findSectionBySlug(DEFAULT_SLUG)!;
  const tab: TabId = matched.tabId;

  // Parse path segments after section slug: e.g. /heroes/castle/adelaide → ["castle","adelaide"]
  const restSegments = (params["*"] ?? "").split("/").filter(Boolean);
  const urlFilter = restSegments[0]; // first sub-segment = filter slug (or subtype for decks)
  const urlSubFilter = restSegments[1]; // for decks: filter within subtype

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

  /** Decks: subtype change → /decks/:subtype (clears filter). */
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
            onFilterChange={handleFilterChange}
          />
        ) : tab === "decks" ? (
          <DecksTab
            initialSubtype={urlFilter}
            initialFilter={urlSubFilter}
            onSubtypeChange={handleDecksSubtypeChange}
            onFilterChange={handleDecksFilterChange}
          />
        ) : tab === "scenarios" ? (
          <ScenariosTab />
        ) : tab === "map_elements" ? (
          <MapElementsTab initialFilter={urlFilter} onFilterChange={handleFilterChange} />
        ) : tab === "global_events" ? (
          <GlobalEventsTab />
        ) : tab === "units" ? (
          <UnitsTab initialFilter={urlFilter} onFilterChange={handleFilterChange} />
        ) : tab === "towns" ? (
          <TownsTab />
        ) : tab === "heroes" ? (
          <HeroesTab initialFilter={urlFilter} onFilterChange={handleFilterChange} />
        ) : null}
      </div>
      <BackToTop />
    </div>
  );
}
