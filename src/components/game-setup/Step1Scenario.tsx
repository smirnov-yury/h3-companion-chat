import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GameSetupForm, GameSetupMode } from "./types";

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

  const booksQ = useQuery({
    queryKey: ["game-setup", "books", form.mode],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: scens, error: e1 } = await supabase
        .from("scenarios")
        .select("book_id")
        .eq("mode", form.mode);
      if (e1) throw e1;
      const ids = Array.from(new Set((scens ?? []).map((s) => s.book_id)));
      if (!ids.length) return [];
      const { data, error } = await supabase
        .from("scenario_books")
        .select("id, title_en, title_ru, release_order, source_type")
        .in("id", ids)
        .order("release_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const scenariosQ = useQuery({
    queryKey: ["game-setup", "scenarios", form.bookId, form.mode],
    enabled: !!form.bookId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scenarios")
        .select("id, title_en, title_ru, summary_en, summary_ru, sort_order")
        .eq("book_id", form.bookId!)
        .eq("mode", form.mode)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Default first book
  useEffect(() => {
    if (!form.bookId && booksQ.data && booksQ.data.length > 0) {
      setForm((f) => ({ ...f, bookId: booksQ.data![0].id }));
    }
  }, [booksQ.data, form.bookId, setForm]);

  // Reset scenario when book changes / default first scenario
  useEffect(() => {
    if (scenariosQ.data && scenariosQ.data.length > 0) {
      const exists = scenariosQ.data.some((s) => s.id === form.scenarioId);
      if (!exists) {
        setForm((f) => ({ ...f, scenarioId: scenariosQ.data![0].id }));
      }
    }
  }, [scenariosQ.data, form.scenarioId, setForm]);

  const selectedScenario = scenariosQ.data?.find((s) => s.id === form.scenarioId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold mb-2">
          {lang === "RU" ? "Режим игры" : "Game mode"}
        </h2>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => {
            const active = form.mode === m.id;
            const btn = (
              <button
                key={m.id}
                type="button"
                disabled={!m.enabled}
                onClick={() => m.enabled && setForm((f) => ({ ...f, mode: m.id }))}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-border hover:bg-muted"
                } ${!m.enabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {lang === "RU" ? m.ru : m.en}
              </button>
            );
            if (m.enabled) return btn;
            return (
              <Tooltip key={m.id}>
                <TooltipTrigger asChild><span>{btn}</span></TooltipTrigger>
                <TooltipContent>{lang === "RU" ? "В разработке" : "In development"}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-2">{lang === "RU" ? "Книга" : "Book"}</h2>
        <Select
          value={form.bookId ?? ""}
          onValueChange={(v) => setForm((f) => ({ ...f, bookId: v, scenarioId: null }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={lang === "RU" ? "Выберите книгу" : "Select book"} />
          </SelectTrigger>
          <SelectContent>
            {(booksQ.data ?? []).map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {lang === "RU" ? b.title_ru || b.title_en : b.title_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-2">
          {lang === "RU" ? "Сценарий" : "Scenario"}
        </h2>
        <Select
          value={form.scenarioId ?? ""}
          onValueChange={(v) => setForm((f) => ({ ...f, scenarioId: v }))}
          disabled={!form.bookId}
        >
          <SelectTrigger>
            <SelectValue placeholder={lang === "RU" ? "Выберите сценарий" : "Select scenario"} />
          </SelectTrigger>
          <SelectContent>
            {(scenariosQ.data ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {lang === "RU" ? s.title_ru || s.title_en : s.title_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedScenario && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {lang === "RU"
              ? selectedScenario.summary_ru || selectedScenario.summary_en
              : selectedScenario.summary_en}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground italic">
        {lang === "RU"
          ? "Если играете впервые — выберите Base → Monk's Retreat"
          : "First time? Pick Base → Monk's Retreat"}
      </p>
    </div>
  );
}
