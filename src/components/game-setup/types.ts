export type GameSetupMode = "clash" | "campaign" | "alliance" | "cooperative" | "solo";

export interface PlayerForm {
  name: string;
  town: string | null;
  heroId: string | null;
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

export function formatPlayerRange(
  counts: number[] | null | undefined,
  lang: "RU" | "EN",
): string {
  if (!counts || counts.length === 0) return "?";
  const sorted = [...counts].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const ruPlural = (n: number) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "игрок";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "игрока";
    return "игроков";
  };

  if (sorted.length === 1) {
    return lang === "RU" ? `${min} ${ruPlural(min)}` : `${min} player${min === 1 ? "" : "s"}`;
  }
  const consecutive = max - min + 1 === sorted.length;
  if (consecutive) {
    return lang === "RU"
      ? `${min}-${max} ${ruPlural(max)}`
      : `${min}-${max} players`;
  }
  const sep = lang === "RU" ? " или " : " or ";
  const joined = sorted.join(sep);
  return lang === "RU" ? `${joined} ${ruPlural(sorted[sorted.length - 1])}` : `${joined} players`;
}
