import { useMemo, useState } from "react";
import { Wand2, ChevronLeft, ChevronRight } from "lucide-react";
import TopAppBar from "@/components/TopAppBar";
import NavDrawer, { type TabId } from "@/components/NavDrawer";
import BackToTop from "@/components/BackToTop";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { findSectionByTabId } from "@/config/sectionRegistry";
import StepProgress from "@/components/game-setup/StepProgress";
import Step1Scenario from "@/components/game-setup/Step1Scenario";
import Step2PlayerCount from "@/components/game-setup/Step2PlayerCount";
import Step3Players from "@/components/game-setup/Step3Players";
import Step4Review from "@/components/game-setup/Step4Review";
import { INITIAL_FORM, type GameSetupForm } from "@/components/game-setup/types";

export default function GameSetup() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<GameSetupForm>(INITIAL_FORM);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [countTouched, setCountTouched] = useState(false);

  const setFormWrapped: React.Dispatch<React.SetStateAction<GameSetupForm>> = (updater) => {
    setForm((prev) => {
      const next = typeof updater === "function" ? (updater as (p: GameSetupForm) => GameSetupForm)(prev) : updater;
      if (next.playerCount !== prev.playerCount) setCountTouched(true);
      return next;
    });
  };

  const stepValid = useMemo(() => {
    if (currentStep === 1) {
      return form.mode === "clash" && !!form.bookId && !!form.scenarioId;
    }
    if (currentStep === 2) {
      return countTouched && form.playerCount >= 2 && form.playerCount <= 8;
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
  }, [currentStep, form, countTouched]);

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
      <div className="flex-1 flex flex-col overflow-y-auto pt-11 lg:ml-56">
        <StepProgress current={currentStep} total={4} />
        <div className="max-w-2xl w-full mx-auto p-4 flex-1">
          {currentStep === 1 && <Step1Scenario form={form} setForm={setFormWrapped} />}
          {currentStep === 2 && <Step2PlayerCount form={form} setForm={setFormWrapped} />}
          {currentStep === 3 && <Step3Players form={form} setForm={setFormWrapped} />}
          {currentStep === 4 && <Step4Review form={form} />}

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
