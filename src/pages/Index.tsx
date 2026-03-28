import { useState } from "react";
import BottomNav, { type TabId } from "@/components/BottomNav";
import ChatScreen from "@/components/ChatScreen";
import RulesTab from "@/components/RulesTab";
import PlaceholderTab from "@/components/PlaceholderTab";

import { useLang } from "@/context/LanguageContext";

const PLACEHOLDERS: Record<Exclude<TabId, "ai" | "rules">, { RU: string; EN: string }> = {
  components: { RU: "Компоненты — скоро", EN: "Components — coming soon" },
  setup: { RU: "Сетап — скоро", EN: "Setup — coming soon" },
  city: { RU: "Город — скоро", EN: "City — coming soon" },
};

export default function Index() {
  const [tab, setTab] = useState<TabId>("ai");
  const { lang } = useLang();

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 flex flex-col overflow-hidden">
        {tab === "ai" ? (
          <ChatScreen />
        ) : tab === "rules" ? (
          <RulesTab />
        ) : (
          <PlaceholderTab title={PLACEHOLDERS[tab as keyof typeof PLACEHOLDERS][lang]} />
        )}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
