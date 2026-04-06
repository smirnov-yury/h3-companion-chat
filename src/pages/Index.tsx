import { useState, useCallback } from "react";
import BottomNav, { type TabId } from "@/components/BottomNav";
import ChatScreen from "@/components/ChatScreen";
import RulesTab from "@/components/RulesTab";
import ComponentsTab from "@/components/ComponentsTab";
import UnitsTab from "@/components/UnitsTab";
import PlaceholderTab from "@/components/PlaceholderTab";
import { useLang } from "@/context/LanguageContext";

export default function Index() {
  const [tab, setTab] = useState<TabId>("ai");
  const [scrollToRuleId, setScrollToRuleId] = useState<string | null>(null);
  const { lang } = useLang();

  const handleNavigateToRule = useCallback((ruleId: string) => {
    setScrollToRuleId(ruleId);
    setTab("rules");
  }, []);

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 flex flex-col overflow-hidden">
        {tab === "ai" ? (
          <ChatScreen />
        ) : tab === "rules" ? (
          <RulesTab scrollToRuleId={scrollToRuleId} onScrollHandled={() => setScrollToRuleId(null)} />
        ) : tab === "components" ? (
          <ComponentsTab onNavigateToRule={handleNavigateToRule} />
        ) : tab === "units" ? (
          <UnitsTab />
        ) : tab === "towns" ? (
          <PlaceholderTab title={lang === "RU" ? "Города — скоро" : "Towns — coming soon"} />
        ) : tab === "heroes" ? (
          <PlaceholderTab title={lang === "RU" ? "Герои — скоро" : "Heroes — coming soon"} />
        ) : null}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
