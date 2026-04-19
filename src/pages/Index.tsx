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
} from "@/config/sectionRegistry";

export default function Index() {
  const navigate = useNavigate();
  const { section } = useParams<{ section?: string }>();
  const { lang } = useLang();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrollToRuleId, setScrollToRuleId] = useState<string | null>(null);

  // Derive active tab from URL. Unknown slug → default section.
  const matched = findSectionBySlug(section) ?? findSectionBySlug(DEFAULT_SLUG)!;
  const tab: TabId = matched.tabId;

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
          <RulesTab scrollToRuleId={scrollToRuleId} onScrollHandled={() => setScrollToRuleId(null)} />
        ) : tab === "decks" ? (
          <DecksTab />
        ) : tab === "scenarios" ? (
          <ScenariosTab />
        ) : tab === "map_elements" ? (
          <MapElementsTab />
        ) : tab === "global_events" ? (
          <GlobalEventsTab />
        ) : tab === "units" ? (
          <UnitsTab />
        ) : tab === "towns" ? (
          <TownsTab />
        ) : tab === "heroes" ? (
          <HeroesTab />
        ) : null}
      </div>
      <BackToTop />
    </div>
  );
}
