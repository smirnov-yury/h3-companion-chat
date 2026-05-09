import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import type { GameSetupForm } from "./types";

interface Props {
  form: GameSetupForm;
}

export default function Step4Review({ form }: Props) {
  const { lang } = useLang();
  const navigate = useNavigate();

  const dataQ = useQuery({
    queryKey: ["game-setup", "review", form.scenarioId, form.players.map((p) => `${p.town}:${p.heroId}`).join(",")],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const heroIds = form.players.map((p) => p.heroId).filter(Boolean) as string[];
      const [scen, heroes, towns] = await Promise.all([
        form.scenarioId
          ? supabase
              .from("scenarios")
              .select("id, title_en, title_ru, summary_en, summary_ru, supported_player_counts, scenario_books!inner(id, title_en, title_ru)")
              .eq("id", form.scenarioId)
              .single()
          : Promise.resolve({ data: null, error: null } as const),
        heroIds.length
          ? supabase.from("heroes").select("id, name_en, name_ru").in("id", heroIds)
          : Promise.resolve({ data: [], error: null } as const),
        supabase.from("towns").select("name_en, name_ru"),
      ]);
      const book = (scen.data as any)?.scenario_books ?? null;
      return {
        book,
        scenario: scen.data,
        heroes: heroes.data ?? [],
        towns: towns.data ?? [],
      };
    },
  });

  const heroName = (id: string | null) => {
    const h = dataQ.data?.heroes.find((x) => x.id === id);
    if (!h) return "?";
    return lang === "RU" ? h.name_ru || h.name_en : h.name_en;
  };
  const townName = (en: string | null) => {
    if (!en) return "?";
    const t = dataQ.data?.towns.find((x) => x.name_en === en);
    if (!t) return en;
    return lang === "RU" ? t.name_ru || t.name_en : t.name_en;
  };

  const supported = (dataQ.data?.scenario?.supported_player_counts as number[] | null) ?? [];
  const isNative = supported.includes(form.playerCount);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold mb-2">
          {lang === "RU" ? "Сценарий" : "Scenario"}
        </h2>
        <div className="border border-border rounded-lg p-3 bg-card">
          <div className="text-xs text-muted-foreground">
            {dataQ.data?.book
              ? lang === "RU"
                ? dataQ.data.book.title_ru || dataQ.data.book.title_en
                : dataQ.data.book.title_en
              : ""}
          </div>
          <div className="font-semibold">
            {dataQ.data?.scenario
              ? lang === "RU"
                ? dataQ.data.scenario.title_ru || dataQ.data.scenario.title_en
                : dataQ.data.scenario.title_en
              : ""}
          </div>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-primary/20 text-foreground">
            {form.mode}
          </span>
          {dataQ.data?.scenario && (
            <p className="text-xs text-muted-foreground mt-2">
              {lang === "RU"
                ? dataQ.data.scenario.summary_ru || dataQ.data.scenario.summary_en
                : dataQ.data.scenario.summary_en}
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">
          {lang === "RU" ? "Игроки" : "Players"}
        </h2>
        <ol className="space-y-1">
          {form.players.map((p, i) => (
            <li key={i} className="text-sm">
              <span className="text-muted-foreground">{i + 1}.</span>{" "}
              <span className="font-medium">
                {p.name || (lang === "RU" ? `Игрок ${i + 1}` : `Player ${i + 1}`)}
              </span>{" "}
              — {townName(p.town)} — {heroName(p.heroId)}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">
          {lang === "RU" ? "Параметры" : "Settings"}
        </h2>
        <ul className="text-sm space-y-1">
          <li>
            {lang === "RU" ? "Игроков" : "Players"}: {form.playerCount}{" "}
            <span className={`text-xs ${isNative ? "text-muted-foreground" : "text-yellow-500"}`}>
              ({isNative ? (lang === "RU" ? "нативный" : "native") : (lang === "RU" ? "масштабирование" : "scaled")})
            </span>
          </li>
          <li>
            {lang === "RU" ? "Стартовый игрок" : "Starting player"}:{" "}
            {lang === "RU" ? "случайный" : "random"}
          </li>
        </ul>
      </section>

      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={() => navigate("/game/preview", { state: { form } })}
      >
        <Wand2 className="w-4 h-4" />
        {lang === "RU" ? "Сгенерировать партию" : "Generate game"}
      </Button>
    </div>
  );
}
