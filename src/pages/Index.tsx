import { useState, useCallback } from "react";
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

export default function Index() {
  const [tab, setTab] = useState<TabId>("ai");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrollToRuleId, setScrollToRuleId] = useState<string | null>(null);
  const { lang } = useLang();

  const handleNavigateToRule = useCallback((ruleId: string) => {
    setScrollToRuleId(ruleId);
    setTab("rules");
  }, []);

  const current = navItems.find((n) => n.id === tab)!;
  const title = lang === "RU" ? current.labelRU : current.labelEN;

  return (
    <div className="flex flex-col h-dvh">
      <TopAppBar title={title} icon={current.icon} onMenuClick={() => setDrawerOpen(true)} />
      <NavDrawer open={drawerOpen} onOpenChange={setDrawerOpen} active={tab} onChange={setTab} />
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
