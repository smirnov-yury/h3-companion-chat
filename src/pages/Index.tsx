import { useState, useCallback } from "react";
import TopAppBar from "@/components/TopAppBar";
import NavDrawer, { type TabId } from "@/components/NavDrawer";
import ChatScreen from "@/components/ChatScreen";
import RulesTab from "@/components/RulesTab";
import ComponentsTab from "@/components/ComponentsTab";
import ScenariosTab from "@/components/ScenariosTab";
import UnitsTab from "@/components/UnitsTab";
import TownsTab from "@/components/TownsTab";
import HeroesTab from "@/components/HeroesTab";
import BackToTop from "@/components/BackToTop";
import { useLang } from "@/context/LanguageContext";

const tabTitles: Record<TabId, { ru: string; en: string }> = {
  rules:      { ru: "Правила",       en: "Rules" },
  components: { ru: "Компоненты",    en: "Components" },
  scenarios:  { ru: "Сценарии",      en: "Scenarios" },
  units:      { ru: "Юниты",         en: "Units" },
  towns:      { ru: "Города",        en: "Towns" },
  heroes:     { ru: "Герои",         en: "Heroes" },
  ai:         { ru: "ИИ Мастер Игры", en: "AI Game Master" },
};

export default function Index() {
  const [tab, setTab] = useState<TabId>("ai");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrollToRuleId, setScrollToRuleId] = useState<string | null>(null);
  const { lang } = useLang();

  const handleNavigateToRule = useCallback((ruleId: string) => {
    setScrollToRuleId(ruleId);
    setTab("rules");
  }, []);

  const title = lang === "RU" ? tabTitles[tab].ru : tabTitles[tab].en;

  return (
    <div className="flex flex-col h-dvh">
      <TopAppBar title={title} onMenuClick={() => setDrawerOpen(true)} />
      <NavDrawer open={drawerOpen} onOpenChange={setDrawerOpen} active={tab} onChange={setTab} />
      <div className="flex-1 flex flex-col overflow-hidden pt-14 lg:ml-56">
        {tab === "ai" ? (
          <ChatScreen />
        ) : tab === "rules" ? (
          <RulesTab scrollToRuleId={scrollToRuleId} onScrollHandled={() => setScrollToRuleId(null)} />
        ) : tab === "components" ? (
          <ComponentsTab onNavigateToRule={handleNavigateToRule} />
        ) : tab === "scenarios" ? (
          <ScenariosTab />
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
