import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dices } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPlayerRange, type GameSetupForm, type GameSetupMode } from "./types";

interface Props {
  form: GameSetupForm;
  setForm: React.Dispatch<React.SetStateAction<GameSetupForm>>;
}

const MODES: { id: GameSetupMode; ru: string; en: string; enabled: boolean }[] = [
  { id: "clash", ru: "Битва", en: "Clash", enabled: true },
  { id: "campaign", ru: "Кампания", en: "Campaign", enabled: false },
  { id: "alliance", ru: "Альянс", en: "Alliance", enabled: false },
  { id: "cooperative", ru: "Кооператив", en: "Co-op", enabled: false },
  { id: "solo", ru: "Соло", en: "Solo", enabled: false },
];

export default function Step1Scenario({ form, setForm }: Props) {
  const { lang } = useLang();
  const [bookFilter, setBookFilter] = useState<string | null>(null);

  type ScenarioRow = {
    id: string;
    title_en: string;
    title_ru: string | null;
    summary_en: string | null;
    summary_ru: string | null;
    sort_order: number | null;
    supported_player_counts: number[] | null;
    min_players: number | null;
    max_players: number | null;
    rounds_min: number | null;
    rounds_max: number | null;
    book_id: string;
  };

  type BookRow = {
    id: string;
    title_en: string;
    title_ru: string | null;
    release_order: number | null;
  };

  type ScenarioWithBook = ScenarioRow & { book: BookRow | null };

  const scenariosQ = useQuery({
    queryKey: ["game-setup", "all-clash-scenarios"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ScenarioWithBook[]> => {
      const [scenRes, booksRes] = await Promise.all([
        supabase
          .from("scenarios")
          .select("id, title_en, title_ru, summary_en, summary_ru, sort_order, supported_player_counts, min_players, max_players, rounds_min, rounds_max, book_id")
          .eq("mode", "clash"),
        supabase
          .from("scenario_books")
          .select("id, title_en, title_ru, release_order"),
      ]);
      if (scenRes.error) throw scenRes.error;
      if (booksRes.error) throw booksRes.error;
      const booksMap = new Map<string, BookRow>(
        (booksRes.data ?? []).map((b) => [b.id, b as BookRow]),
      );
      const merged: ScenarioWithBook[] = (scenRes.data ?? []).map((s) => ({
        ...(s as ScenarioRow),
        book: booksMap.get((s as ScenarioRow).book_id) ?? null,
      }));
      merged.sort((a, b) => {
        const ba = a.book?.release_order ?? 999;
        const bb = b.book?.release_order ?? 999;
        if (ba !== bb) return ba - bb;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });
      return merged;
    },
  });

  const books = useMemo(() => {
    const map = new Map<string, BookRow>();
    for (const s of scenariosQ.data ?? []) {
      if (s.book && !map.has(s.book.id)) map.set(s.book.id, s.book);
    }
    return Array.from(map.values()).sort(
      (a, b) => (a.release_order ?? 999) - (b.release_order ?? 999),
    );
  }, [scenariosQ.data]);

  const filteredScenarios = (scenariosQ.data ?? []).filter(
    (s) => bookFilter === null || s.book_id === bookFilter,
  );

  const selectedScenario = scenariosQ.data?.find((s) => s.id === form.scenarioId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold mb-2">
          {lang === "RU" ? "Режим игры" : "Game mode"}
        </h2>
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MODES.map((m) => {
            const active = form.mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                disabled={!m.enabled}
                onClick={() => m.enabled && setForm((f) => ({ ...f, mode: m.id }))}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors flex-shrink-0 whitespace-nowrap ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-border hover:bg-muted"
                } ${!m.enabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {lang === "RU" ? m.ru : m.en}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-2">{lang === "RU" ? "Книга" : "Book"}</h2>
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setBookFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border flex-shrink-0 whitespace-nowrap ${
              bookFilter === null
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border hover:bg-muted"
            }`}
          >
            {lang === "RU" ? "Все" : "All"}
          </button>
          {books.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBookFilter(b.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border flex-shrink-0 whitespace-nowrap ${
                bookFilter === b.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-muted"
              }`}
            >
              {lang === "RU" ? b.title_ru || b.title_en : b.title_en}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-2">
          {lang === "RU" ? "Сценарий" : "Scenario"}
        </h2>
        <div className="flex gap-2">
          <Select
            value={form.scenarioId ?? ""}
            onValueChange={(v) => setForm((f) => ({ ...f, scenarioId: v }))}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={lang === "RU" ? "Выберите сценарий" : "Select scenario"} />
            </SelectTrigger>
            <SelectContent className="max-h-[min(60vh,400px)]">
              {filteredScenarios.map((s) => {
                const book = s.book;
                const bookTitle = lang === "RU" ? book?.title_ru || book?.title_en : book?.title_en;
                const sName = lang === "RU" ? s.title_ru || s.title_en : s.title_en;
                const range = formatPlayerRange(s.supported_player_counts as number[] | null, lang);
                return (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="font-medium">{sName}</span>
                    <span className="text-muted-foreground ml-1">({range})</span>
                    <span className="mx-1 text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{bookTitle}</span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              if (!filteredScenarios.length) return;
              const pool = filteredScenarios.filter((s) => s.id !== form.scenarioId);
              const list = pool.length > 0 ? pool : filteredScenarios;
              const pick = list[Math.floor(Math.random() * list.length)];
              setForm((f) => ({ ...f, scenarioId: pick.id }));
            }}
            title={lang === "RU" ? "Случайный сценарий" : "Random scenario"}
          >
            <Dices className="w-4 h-4" />
          </Button>
        </div>

        {selectedScenario && (
          <>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary">Clash</Badge>
              <Badge variant="secondary">
                {formatPlayerRange(selectedScenario.supported_player_counts as number[] | null, lang)}
              </Badge>
              {selectedScenario.rounds_min && (
                <Badge variant="secondary">
                  {selectedScenario.rounds_min}-{selectedScenario.rounds_max}{" "}
                  {lang === "RU" ? "раундов" : "rounds"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
              {lang === "RU"
                ? selectedScenario.summary_ru || selectedScenario.summary_en
                : selectedScenario.summary_en}
            </p>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground italic">
        {lang === "RU" ? "🎲 Не знаешь что выбрать? Жми кубик" : "🎲 Not sure? Hit the dice"}
      </p>
    </div>
  );
}
