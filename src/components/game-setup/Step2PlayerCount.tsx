import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { GameSetupForm, PlayerForm } from "./types";

interface Props {
  form: GameSetupForm;
  setForm: React.Dispatch<React.SetStateAction<GameSetupForm>>;
}

const ALL = [2, 3, 4, 5, 6, 7, 8];

function emptyPlayer(i: number): PlayerForm {
  return { name: "", town: null, heroId: null };
}

export default function Step2PlayerCount({ form, setForm }: Props) {
  const { lang } = useLang();

  const scenarioQ = useQuery({
    queryKey: ["game-setup", "scenario-detail", form.scenarioId],
    enabled: !!form.scenarioId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scenarios")
        .select("id, min_players, max_players, supported_player_counts")
        .eq("id", form.scenarioId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const min = scenarioQ.data?.min_players ?? 2;
  const supported: number[] = (scenarioQ.data?.supported_player_counts as number[] | null) ?? [];

  const handleClick = (n: number) => {
    setForm((f) => {
      const players = [...f.players];
      if (players.length > n) players.length = n;
      while (players.length < n) players.push(emptyPlayer(players.length));
      return { ...f, playerCount: n, players };
    });
  };

  const isSupported = (n: number) => supported.includes(n);
  const isDisabled = (n: number) => n < min;

  const nearestSupported =
    supported.length > 0
      ? supported.filter((s) => s <= form.playerCount).sort((a, b) => b - a)[0] ??
        Math.min(...supported)
      : null;

  const selectedNative = isSupported(form.playerCount);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold">
        {lang === "RU" ? "Количество игроков" : "Number of players"}
      </h2>
      <div className="flex flex-wrap gap-2">
        {ALL.map((n) => {
          const disabled = isDisabled(n);
          const native = isSupported(n);
          const warning = !native && !disabled;
          const active = form.playerCount === n;
          const btn = (
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleClick(n)}
              className={`min-w-[56px] h-12 px-4 rounded-full text-sm font-semibold border-2 transition-colors flex items-center justify-center gap-1 ${
                disabled
                  ? "opacity-30 cursor-not-allowed border-border bg-muted"
                  : active
                  ? warning
                    ? "bg-yellow-500/20 border-yellow-500 text-foreground"
                    : "bg-primary text-primary-foreground border-primary"
                  : warning
                  ? "border-yellow-500/60 text-foreground hover:bg-yellow-500/10"
                  : "border-border bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {warning && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
              {n}
            </button>
          );
          const tip = disabled
            ? lang === "RU"
              ? `Сценарий рассчитан минимум на ${min} игроков`
              : `Scenario requires at least ${min} players`
            : native
            ? lang === "RU"
              ? "Нативный режим"
              : "Native"
            : lang === "RU"
            ? "Карта будет автоматически масштабирована — проверьте баланс"
            : "Map will be auto-scaled, verify balance";
          return (
            <Tooltip key={n}>
              <TooltipTrigger asChild>
                <span>{btn}</span>
              </TooltipTrigger>
              <TooltipContent>{tip}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="text-xs">
        {selectedNative ? (
          <span className="text-muted-foreground">
            {lang === "RU" ? "Нативный режим" : "Native"}
          </span>
        ) : (
          <span className="text-yellow-500 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {lang === "RU"
              ? `Карта будет масштабирована с ${nearestSupported}p`
              : `Map scaled from ${nearestSupported}p`}
          </span>
        )}
      </div>
    </div>
  );
}
