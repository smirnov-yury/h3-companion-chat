import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { buildPayload } from "@/lib/setupResolver";
import { getClientHash } from "@/lib/clientHash";
import type { GameSetupForm } from "./types";

interface Props {
  form: GameSetupForm;
}

export default function Step4Review({ form }: Props) {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);

  const dataQ = useQuery({
    queryKey: ["game-setup", "review", form.scenarioId, form.players.map((p) => `${p.town}:${p.heroId}`).join(",")],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const heroIds = form.players.map((p) => p.heroId).filter(Boolean) as string[];
      const scenP = form.scenarioId
        ? supabase
            .from("scenarios")
            .select("id, title_en, title_ru, summary_en, summary_ru, supported_player_counts, book_id")
            .eq("id", form.scenarioId)
            .single()
        : Promise.resolve({ data: null, error: null } as const);
      const heroesP = heroIds.length
        ? supabase.from("heroes").select("id, name_en, name_ru").in("id", heroIds)
        : Promise.resolve({ data: [], error: null } as const);
      const townsP = supabase.from("towns").select("name_en, name_ru");
      const [scen, heroes, towns] = await Promise.all([scenP, heroesP, townsP]);
      const bookId = (scen.data as { book_id?: string } | null)?.book_id;
      const bookRes = bookId
        ? await supabase
            .from("scenario_books")
            .select("id, title_en, title_ru")
            .eq("id", bookId)
            .single()
        : { data: null, error: null };
      return {
        book: bookRes.data,
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
        disabled={generating}
        onClick={async () => {
          if (!form.scenarioId) return;
          setGenerating(true);
          try {
            const heroIds = form.players.map((p) => p.heroId).filter((x): x is string => !!x);
            const towns = Array.from(new Set(form.players.map((p) => p.town).filter((x): x is string => !!x)));
            const townIdsLower = Array.from(new Set(form.players.map((p) => p.town?.toLowerCase()).filter((x): x is string => !!x)));

            const [scenRes, blocksRes, mvRes, teRes, heroesRes, unitsRes, buildingsRes, ipHash] = await Promise.all([
              supabase.from("scenarios").select("id, title_en, title_ru, summary_en, summary_ru, mode, rounds_min, rounds_max, book_id").eq("id", form.scenarioId).single(),
              supabase.from("scenario_setup_blocks").select("id, scenario_id, player_count, block_type, title_en, title_ru, content_en, content_ru, sort_order").eq("scenario_id", form.scenarioId),
              supabase.from("scenario_map_variants").select("id, scenario_id, player_count, variant_label_en, variant_label_ru, map_setup_text_en, map_setup_text_ru, tile_counts, layout_notes_en, layout_notes_ru, map_image, sort_order").eq("scenario_id", form.scenarioId),
              supabase.from("scenario_timed_events").select("id, scenario_id, player_count, trigger_type, trigger_round, trigger_label_en, trigger_label_ru, condition_en, condition_ru, effect_en, effect_ru").eq("scenario_id", form.scenarioId),
              heroIds.length
                ? supabase.from("heroes").select("id, name_en, name_ru, image, attack, defense, power, knowledge").in("id", heroIds)
                : Promise.resolve({ data: [], error: null } as const),
              towns.length
                ? supabase.from("unit_stats").select("id, name_en, name_ru, town, tier, number, cost, image").in("town", towns)
                : Promise.resolve({ data: [], error: null } as const),
              townIdsLower.length
                ? supabase.from("town_buildings").select("id, town_id, name_en, name_ru, cost, dwelling_tier").in("town_id", townIdsLower)
                : Promise.resolve({ data: [], error: null } as const),
              getClientHash(),
            ]);

            if (scenRes.error) throw scenRes.error;
            if (blocksRes.error) throw blocksRes.error;
            if (mvRes.error) throw mvRes.error;
            if (teRes.error) throw teRes.error;
            if (heroesRes.error) throw heroesRes.error;
            if (unitsRes.error) throw unitsRes.error;
            if (buildingsRes.error) throw buildingsRes.error;

            const bookId = scenRes.data.book_id;
            const { data: bookData } = await supabase
              .from("scenario_books")
              .select("id, title_en, title_ru")
              .eq("id", bookId)
              .single();

            const payload = buildPayload({
              form: {
                scenarioId: form.scenarioId,
                playerCount: form.playerCount,
                players: form.players.map((p) => ({ name: p.name, town: p.town, heroId: p.heroId })),
                startingPlayerIndex: form.startingPlayerIndex,
              },
              scenario: scenRes.data,
              book: bookData ?? null,
              setupBlocks: (blocksRes.data ?? []) as never,
              mapVariants: (mvRes.data ?? []) as never,
              timedEvents: (teRes.data ?? []) as never,
              heroes: (heroesRes.data ?? []) as never,
              units: (unitsRes.data ?? []) as never,
              buildings: (buildingsRes.data ?? []) as never,
            });

            const insertRes = await supabase
              .from("game_sessions")
              .insert({
                scenario_id: form.scenarioId,
                player_count: form.playerCount,
                payload: payload as unknown as Record<string, unknown>,
                ip_hash: ipHash,
              })
              .select("id")
              .single();

            if (insertRes.error) throw insertRes.error;
            navigate(`/game/${insertRes.data.id}`);
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            toast.error(lang === "RU" ? `Ошибка: ${msg}` : `Error: ${msg}`);
            setGenerating(false);
          }
        }}
      >
        <Wand2 className="w-4 h-4" />
        {generating
          ? lang === "RU" ? "Генерация..." : "Generating..."
          : lang === "RU" ? "Сгенерировать партию" : "Generate game"}
      </Button>
    </div>
  );
}
