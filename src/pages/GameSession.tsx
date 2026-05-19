import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Wand2 } from "lucide-react";
import TopAppBar from "@/components/TopAppBar";
import NavDrawer, { type TabId } from "@/components/NavDrawer";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { findSectionByTabId } from "@/config/sectionRegistry";
import SessionHeader from "@/components/game-session/SessionHeader";
import MapSection from "@/components/game-session/MapSection";
import CommonRulesSection from "@/components/game-session/CommonRulesSection";
import TimedEventsSection from "@/components/game-session/TimedEventsSection";
import PlayersGrid from "@/components/game-session/PlayersGrid";
import StorySection from "@/components/game-session/StorySection";
import AISetupSection from "@/components/game-session/AISetupSection";
import GameSessionExpired from "@/components/game-session/GameSessionExpired";
import H3MasterSpinner from "@/components/H3MasterSpinner";
import type { Payload } from "@/lib/setupResolver";

export default function GameSession() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { lang } = useLang();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sessionQ = useQuery({
    queryKey: ["game-session", uuid],
    enabled: !!uuid,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("id, name, scenario_id, player_count, payload, created_at, expires_at")
        .eq("id", uuid!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handleTabChange = (tab: TabId) => {
    const def = findSectionByTabId(tab);
    if (def) navigate(`/${def.slug}`);
  };

  const title = lang === "RU" ? "Партия" : "Game Session";

  return (
    <div className="flex flex-col h-dvh">
      <TopAppBar title={title} icon={Wand2} onMenuClick={() => setDrawerOpen(true)} />
      <NavDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        active={"game_setup" as TabId}
        onChange={handleTabChange}
      />
      <div className="flex-1 overflow-y-auto lg:ml-56 pt-11">
        {sessionQ.isLoading && (
          <div className="p-4 text-sm text-muted-foreground">
            {lang === "RU" ? "Загрузка..." : "Loading..."}
          </div>
        )}
        {!sessionQ.isLoading && !sessionQ.data && <GameSessionExpired />}
        {sessionQ.data && (
          <SessionContent
            payload={sessionQ.data.payload as unknown as Payload}
            expiresAt={sessionQ.data.expires_at}
          />
        )}
      </div>
    </div>
  );
}

function SessionContent({ payload, expiresAt }: { payload: Payload; expiresAt: string }) {
  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 pt-2 pb-8 space-y-6">
        <SessionHeader payload={payload} expiresAt={expiresAt} />
        <MapSection map={payload.map} playerCount={payload.player_count} />
        <CommonRulesSection common={payload.common} />
        <TimedEventsSection events={payload.common.timed_events} />
        <PlayersGrid players={payload.players} startingPlayerIndex={payload.starting_player_index} />
        <StorySection sections={payload.story_sections} />
        {payload.ai_setup && <AISetupSection aiSetup={payload.ai_setup} />}
      </div>
    </div>
  );
}
