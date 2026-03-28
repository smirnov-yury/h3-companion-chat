import { useState } from "react";
import BottomNav, { type TabId } from "@/components/BottomNav";
import ChatScreen from "@/components/ChatScreen";
import RulesTab from "@/components/RulesTab";
import PlaceholderTab from "@/components/PlaceholderTab";

const PLACEHOLDERS: Record<Exclude<TabId, "ai" | "rules">, string> = {
  components: "Компоненты — скоро",
  setup: "Сетап — скоро",
  city: "Город — скоро",
};

export default function Index() {
  const [tab, setTab] = useState<TabId>("ai");

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 flex flex-col overflow-hidden">
        {tab === "ai" ? (
          <ChatScreen />
        ) : tab === "rules" ? (
          <RulesTab />
        ) : (
          <PlaceholderTab title={PLACEHOLDERS[tab as keyof typeof PLACEHOLDERS]} />
        )}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
