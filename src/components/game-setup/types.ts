export type GameSetupMode = "clash" | "campaign" | "alliance" | "cooperative" | "solo";

export interface PlayerForm {
  name: string;
  town: string | null;
  heroId: string | null;
}

export interface GameSetupForm {
  mode: GameSetupMode;
  bookId: string | null;
  scenarioId: string | null;
  playerCount: number;
  players: PlayerForm[];
  startingPlayerIndex: number | null;
  mapVariantId: number | null;
}

export const INITIAL_FORM: GameSetupForm = {
  mode: "clash",
  bookId: null,
  scenarioId: null,
  playerCount: 2,
  players: [],
  startingPlayerIndex: null,
  mapVariantId: null,
};
