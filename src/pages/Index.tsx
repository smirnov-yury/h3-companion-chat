import { useState, useCallback, useRef, useEffect } from "react";
import BottomNav, { type TabId } from "@/components/BottomNav";
import ChatScreen from "@/components/ChatScreen";
import RulesTab from "@/components/RulesTab";
import ComponentsTab from "@/components/ComponentsTab";
import UnitsTab from "@/components/UnitsTab";
import PlaceholderTab from "@/components/PlaceholderTab";
import { useLang } from "@/context/LanguageContext";

const PLACEHOLDERS: Record<Exclude<TabId, "ai" | "rules" | "components">, { RU: string; EN: string }> = {
  setup: { RU: "Сетап — скоро", EN: "Setup — coming soon" },
  city: { RU: "Город — скоро", EN: "City — coming soon" },
};

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
        ) : (
          <PlaceholderTab title={PLACEHOLDERS[tab as keyof typeof PLACEHOLDERS][lang]} />
        )}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
