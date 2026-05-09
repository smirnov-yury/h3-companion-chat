import { useQuery } from "@tanstack/react-query";
import { Dice5, Dices, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { componentImageUrl } from "@/lib/storage";
import type { GameSetupForm, PlayerForm } from "./types";

interface Props {
  form: GameSetupForm;
  setForm: React.Dispatch<React.SetStateAction<GameSetupForm>>;
}

interface HeroOpt {
  id: string;
  name_en: string;
  name_ru: string | null;
  town: string | null;
  image: string | null;
}

export default function Step3Players({ form, setForm }: Props) {
  const { lang } = useLang();

  const townsQ = useQuery({
    queryKey: ["game-setup", "towns"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("towns")
        .select("id, name_en, name_ru, sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const heroesQ = useQuery({
    queryKey: ["game-setup", "heroes-all"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("heroes")
        .select("id, name_en, name_ru, town, image, sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as HeroOpt[];
    },
  });

  const updatePlayer = (idx: number, patch: Partial<PlayerForm>) => {
    setForm((f) => {
      const players = f.players.map((p, i) => (i === idx ? { ...p, ...patch } : p));
      return { ...f, players };
    });
  };

  const heroesForTown = (town: string | null) =>
    (heroesQ.data ?? []).filter((h) => h.town === town);

  const randomHero = (idx: number) => {
    const p = form.players[idx];
    if (!p?.town) return;
    const allHeroes = heroesForTown(p.town);
    if (!allHeroes.length) return;
    const pool = allHeroes.filter((h) => h.id !== p.heroId);
    const list = pool.length > 0 ? pool : allHeroes;
    const pick = list[Math.floor(Math.random() * list.length)];
    updatePlayer(idx, { heroId: pick.id });
  };

  const randomFaction = (idx: number) => {
    const allTowns = (townsQ.data ?? []).map((t) => t.name_en);
    const currentTown = form.players[idx]?.town;
    const takenByOthers = new Set(
      form.players
        .filter((_, i) => i !== idx)
        .map((p) => p.town)
        .filter((t): t is string => !!t),
    );
    const available = allTowns.filter((t) => !takenByOthers.has(t));
    if (!available.length) return;
    const pool = available.filter((t) => t !== currentTown);
    const list = pool.length > 0 ? pool : available;
    const pickedTown = list[Math.floor(Math.random() * list.length)];
    const heroes = (heroesQ.data ?? []).filter((h) => h.town === pickedTown);
    const pickedHero = heroes.length
      ? heroes[Math.floor(Math.random() * heroes.length)]
      : null;
    updatePlayer(idx, { town: pickedTown, heroId: pickedHero?.id ?? null });
  };

  const randomFactionsAll = () => {
    const towns = (townsQ.data ?? []).map((t) => t.name_en);
    const shuffled = [...towns].sort(() => Math.random() - 0.5);
    setForm((f) => {
      const players = f.players.map((p, i) => {
        const town = shuffled[i] ?? null;
        const heroList = (heroesQ.data ?? []).filter((h) => h.town === town);
        const hero = heroList.length
          ? heroList[Math.floor(Math.random() * heroList.length)]
          : null;
        return { ...p, town, heroId: hero?.id ?? null };
      });
      return { ...f, players };
    });
  };

  const reset = () => {
    setForm((f) => ({
      ...f,
      players: f.players.map(() => ({ name: "", town: null, heroId: null })),
    }));
  };

  const duplicateOf = (idx: number): number | null => {
    const town = form.players[idx]?.town;
    if (!town) return null;
    const j = form.players.findIndex((p, i) => i !== idx && p.town === town);
    return j === -1 ? null : j;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {form.players.map((p, idx) => {
          const dup = duplicateOf(idx);
          const dupName =
            dup !== null
              ? form.players[dup].name ||
                (lang === "RU" ? `Игрок ${dup + 1}` : `Player ${dup + 1}`)
              : "";
          const heroList = heroesForTown(p.town);
          return (
            <div key={idx} className="border border-border rounded-lg p-3 space-y-2 bg-card">
              <div className="text-xs font-semibold text-muted-foreground">
                {lang === "RU" ? `Игрок ${idx + 1}` : `Player ${idx + 1}`}
              </div>
              <Input
                maxLength={30}
                value={p.name}
                onChange={(e) => updatePlayer(idx, { name: e.target.value })}
                placeholder={lang === "RU" ? `Игрок ${idx + 1}` : `Player ${idx + 1}`}
              />
              <div>
                <div className="flex gap-2">
                  <Select
                    value={p.town ?? ""}
                    onValueChange={(v) => updatePlayer(idx, { town: v, heroId: null })}
                  >
                    <SelectTrigger className={`flex-1 ${dup !== null ? "border-destructive" : ""}`}>
                      <SelectValue
                        placeholder={lang === "RU" ? "Фракция" : "Faction"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(townsQ.data ?? []).map((t) => (
                        <SelectItem key={t.id} value={t.name_en}>
                          {lang === "RU" ? t.name_ru || t.name_en : t.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => randomFaction(idx)}
                    title={lang === "RU" ? "Случайная фракция" : "Random faction"}
                  >
                    <Dices className="w-4 h-4" />
                  </Button>
                </div>
                {dup !== null && (
                  <p className="text-xs text-destructive mt-1">
                    {lang === "RU"
                      ? `Фракция уже выбрана игроком ${dup + 1}: ${dupName}`
                      : `Faction already picked by player ${dup + 1}: ${dupName}`}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Select
                  value={p.heroId ?? ""}
                  onValueChange={(v) => updatePlayer(idx, { heroId: v })}
                  disabled={!p.town}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue
                      placeholder={lang === "RU" ? "Герой" : "Hero"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {heroList.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        <div className="flex items-center gap-2">
                          {h.image && (
                            <img
                              src={componentImageUrl("heroes", h.image)}
                              alt=""
                              className="w-8 h-8 object-cover rounded"
                              loading="lazy"
                            />
                          )}
                          <span>{lang === "RU" ? h.name_ru || h.name_en : h.name_en}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={!p.town}
                  onClick={() => randomHero(idx)}
                  title={lang === "RU" ? "Случайный" : "Random"}
                >
                  <Dice5 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={randomFactionsAll}>
          <Dice5 className="w-4 h-4" />
          {lang === "RU" ? "Случайные фракции всем" : "Random factions for all"}
        </Button>
        <Button type="button" variant="ghost" onClick={reset}>
          <RotateCcw className="w-4 h-4" />
          {lang === "RU" ? "Сбросить" : "Reset"}
        </Button>
      </div>
    </div>
  );
}
