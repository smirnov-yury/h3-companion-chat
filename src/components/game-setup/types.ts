export type GameSetupMode = "clash" | "campaign" | "alliance" | "cooperative" | "solo";

export interface PlayerForm {
  name: string;
  town: string | null;
  heroId: string | null;
  team: "A" | "B" | null;
}

export interface GameSetupForm {
  mode: GameSetupMode;
  scenarioId: string | null;
  playerCount: number;
  players: PlayerForm[];
  startingPlayerIndex: number | null;
  mapVariantId: number | null;
}

export const INITIAL_FORM: GameSetupForm = {
  mode: "clash",
  scenarioId: null,
  playerCount: 2,
  players: [],
  startingPlayerIndex: null,
  mapVariantId: null,
};

/**
 * Pluralize "players" / "игрок" for a given count.
 * RU: 1 → игрок, 2-4 → игрока, 5+ → игроков (with 11-14 always игроков, 21/31/41 etc. → игрок).
 * EN: 1 → player, else → players.
 */
export function pluralizePlayers(n: number, lang: "RU" | "EN"): string {
  if (lang === "EN") return n === 1 ? "player" : "players";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "игрок";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "игрока";
  return "игроков";
}

export function formatPlayerRange(
  counts: number[] | null | undefined,
  lang: "RU" | "EN",
): string {
  if (!counts || counts.length === 0) return "?";
  const sorted = [...counts].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  if (sorted.length === 1) {
    return lang === "RU"
      ? `${min} ${pluralizePlayers(min, "RU")}`
      : `${min} player${min === 1 ? "" : "s"}`;
  }
  const consecutive = max - min + 1 === sorted.length;
  if (consecutive) {
    return lang === "RU"
      ? `${min}-${max} ${pluralizePlayers(max, "RU")}`
      : `${min}-${max} players`;
  }
  const sep = lang === "RU" ? " или " : " or ";
  const joined = sorted.join(sep);
  return lang === "RU"
    ? `${joined} ${pluralizePlayers(sorted[sorted.length - 1], "RU")}`
    : `${joined} players`;
}
