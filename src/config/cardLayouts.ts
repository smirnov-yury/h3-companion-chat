import type React from "react";

export interface CardLayout {
  id: string;
  aspectRatio: string | null;
  widthPx: number | null;
  heightPx: number | null;
  colsBase: number;
  colsSm: number | null;
  colsMd: number | null;
  colsLg: number | null;
  colsXl: number | null;
  objectFit: "cover" | "contain" | "fill" | "none" | "scale-down";
  objectPosition: string;
  gap: number;
  badgeSlots: string[];
}

export const CARD_LAYOUT_DEFAULTS: Record<string, CardLayout> = {
  poster_5x7:          { id: "poster_5x7",          aspectRatio: "5/7", widthPx: null, heightPx: null, colsBase: 2, colsSm: 3,    colsMd: null, colsLg: 4, colsXl: 6,    objectFit: "cover",   objectPosition: "center", gap: 3, badgeSlots: ["top-left"] },
  landscape_4x3_dense: { id: "landscape_4x3_dense", aspectRatio: "4/3", widthPx: null, heightPx: null, colsBase: 2, colsSm: 3,    colsMd: null, colsLg: 4, colsXl: 6,    objectFit: "cover",   objectPosition: "center", gap: 3, badgeSlots: ["top-left"] },
  landscape_4x3:       { id: "landscape_4x3",       aspectRatio: "4/3", widthPx: null, heightPx: null, colsBase: 2, colsSm: null, colsMd: null, colsLg: 4, colsXl: null, objectFit: "cover",   objectPosition: "center", gap: 3, badgeSlots: [] },
  square_contain:      { id: "square_contain",      aspectRatio: "1/1", widthPx: null, heightPx: null, colsBase: 2, colsSm: 3,    colsMd: null, colsLg: 4, colsXl: 6,    objectFit: "contain", objectPosition: "center", gap: 3, badgeSlots: ["top-left"] },
  square_cover_left:   { id: "square_cover_left",   aspectRatio: "1/1", widthPx: null, heightPx: null, colsBase: 2, colsSm: 3,    colsMd: null, colsLg: 4, colsXl: 6,    objectFit: "cover",   objectPosition: "left",   gap: 3, badgeSlots: ["top-left"] },
};

export const DEFAULT_LAYOUT_ID = "poster_5x7";

export const GRID_LAYOUT_KEYS: Record<string, string> = {
  artifacts: "poster_5x7", spells: "poster_5x7", abilities: "poster_5x7", attributes: "poster_5x7", warmachines: "poster_5x7",
  map_events: "poster_5x7", pandora: "poster_5x7", ai_cards: "poster_5x7", morale: "poster_5x7",
  fields: "landscape_4x3_dense",
  events: "landscape_4x3", astrologers: "landscape_4x3",
  units: "square_contain",
  heroes: "square_cover_left",
};

export function resolveLayoutId(gridKey: string): string {
  return GRID_LAYOUT_KEYS[gridKey] ?? DEFAULT_LAYOUT_ID;
}

export function defaultLayoutForGrid(gridKey: string): CardLayout {
  return CARD_LAYOUT_DEFAULTS[resolveLayoutId(gridKey)] ?? CARD_LAYOUT_DEFAULTS[DEFAULT_LAYOUT_ID];
}

const GRID_COLS_CLASSES: Record<string, string> = {
  "2|3|4|6": "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3",
  "2|_|4|_": "grid grid-cols-2 lg:grid-cols-4 gap-3",
};

export function gridColsClass(layout: CardLayout): string {
  const key = `${layout.colsBase}|${layout.colsSm ?? "_"}|${layout.colsLg ?? "_"}|${layout.colsXl ?? "_"}`;
  return GRID_COLS_CLASSES[key] ?? GRID_COLS_CLASSES["2|3|4|6"];
}

export function aspectStyle(layout: CardLayout): React.CSSProperties {
  if (layout.aspectRatio) return { aspectRatio: layout.aspectRatio.replace("/", " / ") };
  if (layout.widthPx && layout.heightPx) return { aspectRatio: `${layout.widthPx} / ${layout.heightPx}` };
  return { aspectRatio: "5 / 7" };
}

export function objectStyle(layout: CardLayout): React.CSSProperties {
  return { objectFit: layout.objectFit, objectPosition: layout.objectPosition };
}
