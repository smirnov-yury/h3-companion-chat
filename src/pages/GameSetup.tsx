import { useEffect, useMemo, useState } from "react";
import { Wand2, ChevronLeft, ChevronRight, Clock, ExternalLink } from "lucide-react";
import TopAppBar from "@/components/TopAppBar";
import NavDrawer, { type TabId } from "@/components/NavDrawer";
import BackToTop from "@/components/BackToTop";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { findSectionByTabId } from "@/config/sectionRegistry";
import { supabase } from "@/integrations/supabase/client";
import StepProgress from "@/components/game-setup/StepProgress";
import Step1Scenario from "@/components/game-setup/Step1Scenario";
import Step2PlayerCount from "@/components/game-setup/Step2PlayerCount";
import Step3Players from "@/components/game-setup/Step3Players";
import Step4Review from "@/components/game-setup/Step4Review";
import { INITIAL_FORM, type GameSetupForm, type PlayerForm } from "@/components/game-setup/types";
import { useQuery } from "@tanstack/react-query";

function emptyPlayer(): PlayerForm {
  return { name: "", town: null, heroId: null, team: null };
}

export default function GameSetup() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<GameSetupForm>(INITIAL_FORM);
  interface RecentEntry {
    uuid: string;
    title: string;
    playerCount: number;
    createdAt: string;
  }
  const [recentSessions, setRecentSessions] = useState<RecentEntry[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("h3_recent_sessions") ?? "[]");
      setRecentSessions(Array.isArray(stored) ? stored : []);
    } catch {
      setRecentSessions([]);
    }
  }, []);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Auto-set playerCount to scenario.min_players when scenario changes.
  const scenarioMetaQ = useQuery({
    queryKey: ["game-setup", "scenario-meta", form.scenarioId],
    enabled: !!form.scenarioId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scenarios")
        .select("id, min_players, supported_player_counts")
        .eq("id", form.scenarioId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const scenarioMin = scenarioMetaQ.data?.min_players ?? 2;

  useEffect(() => {
    if (!scenarioMetaQ.data) return;
    const newCount = scenarioMetaQ.data.min_players ?? 2;
    setForm((f) => {
      if (f.playerCount === newCount && f.players.length === newCount) return f;
      const players = [...f.players];
      if (players.length > newCount) players.length = newCount;
      while (players.length < newCount) players.push(emptyPlayer());
      return { ...f, playerCount: newCount, players };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioMetaQ.data?.id]);

  const stepValid = useMemo(() => {
    if (currentStep === 1) {
      return !!form.scenarioId;
    }
    if (currentStep === 2) {
      return form.playerCount >= scenarioMin && form.playerCount <= 8;
    }
    if (currentStep === 3) {
      if (form.players.length !== form.playerCount) return false;
      const towns = new Set<string>();
      for (const p of form.players) {
        if (!p.name.trim() || !p.town || !p.heroId) return false;
        if (towns.has(p.town)) return false;
        towns.add(p.town);
      }
      return true;
    }
    return true;
  }, [currentStep, form, scenarioMin]);

  const handleTabChange = (tab: TabId) => {
    const def = findSectionByTabId(tab);
    if (def) navigate(`/${def.slug}`);
  };

  const goBack = () => setCurrentStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s));
  const goNext = () => setCurrentStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s));

  const title = lang === "RU" ? "Подготовка партии" : "Game Setup";

  return (
    <div className="flex flex-col h-dvh">
      <TopAppBar title={title} icon={Wand2} onMenuClick={() => setDrawerOpen(true)} />
      <NavDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        active={"game_setup" as TabId}
        onChange={handleTabChange}
      />
      <div className="fixed top-11 left-0 right-0 z-30 bg-background border-b border-border lg:left-56">
        <StepProgress current={currentStep} total={4} />
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto pt-[calc(2.75rem+72px)] lg:ml-56">
        <div className="max-w-2xl w-full mx-auto p-4 flex-1">
          <div className="mt-2">
            {currentStep === 1 && <Step1Scenario form={form} setForm={setForm} />}
            {currentStep === 1 && recentSessions.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Clock className="w-4 h-4" />
                  {lang === "RU" ? "Последние партии" : "Recent sessions"}
                </div>
                <div className="space-y-2">
                  {recentSessions.map((s) => {
                    const date = new Date(s.createdAt);
                    const dateLabel = isNaN(date.getTime())
                      ? ""
                      : date.toLocaleDateString(lang === "RU" ? "ru-RU" : "en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                    return (
                      <button
                        key={s.uuid}
                        type="button"
                        onClick={() => navigate(`/game/${s.uuid}`)}
                        className="w-full text-left flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">{s.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.playerCount} {lang === "RU" ? "игроков" : "players"}
                            {dateLabel ? ` · ${dateLabel}` : ""}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {currentStep === 2 && <Step2PlayerCount form={form} setForm={setForm} />}
            {currentStep === 3 && <Step3Players form={form} setForm={setForm} />}
            {currentStep === 4 && <Step4Review form={form} />}
          </div>

          {currentStep < 4 && (
            <div className="flex justify-between gap-2 mt-8 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                {lang === "RU" ? "Назад" : "Back"}
              </Button>
              <Button type="button" onClick={goNext} disabled={!stepValid}>
                {lang === "RU" ? "Далее" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          {currentStep === 4 && (
            <div className="mt-8 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={goBack}>
                <ChevronLeft className="w-4 h-4" />
                {lang === "RU" ? "Назад" : "Back"}
              </Button>
            </div>
          )}
        </div>
      </div>
      <BackToTop />
    </div>
  );
}
