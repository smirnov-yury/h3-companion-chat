import { SECTION_REGISTRY } from "@/config/sectionRegistry";
import { resolveBranding } from "@/config/branding";

// Static-page labels not in SECTION_REGISTRY.
const STATIC_LABELS: Record<string, { en: string; ru: string }> = {
  about:   { en: "About",            ru: "О приложении" },
  privacy: { en: "Privacy Policy",   ru: "Политика конфиденциальности" },
  terms:   { en: "Terms of Service", ru: "Условия использования" },
  donate:  { en: "Support",          ru: "Поддержать" },
};

const SECTION_LABELS: Record<string, { en: string; ru: string }> = {
  rules:         { en: "Rules",          ru: "Правила" },
  scenarios:     { en: "Scenarios",      ru: "Сценарии" },
  "map-elements":{ en: "Map Elements",   ru: "Элементы карты" },
  events:        { en: "Global Events",  ru: "Глобальные события" },
  decks:         { en: "Decks",          ru: "Колоды" },
  units:         { en: "Units",          ru: "Юниты" },
  heroes:        { en: "Heroes",         ru: "Герои" },
  towns:         { en: "Towns",          ru: "Города" },
  ai:            { en: "AI Game Master", ru: "ИИ Мастер игры" },
  "game-setup":  { en: "Game Setup",     ru: "Подготовка партии" },
};

function prettify(segment: string): string {
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbs(pathname: string, isRu: boolean): BreadcrumbItem[] {
  const clean = (pathname || "").replace(/^\/+|\/+$/g, "");
  if (!clean) return [];

  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const homeLabel = isRu ? "Главная" : "Home";
  const crumbs: BreadcrumbItem[] = [
    { name: homeLabel, url: `${SITE_URL}/` },
  ];

  let accumulated = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    accumulated += `/${seg}`;
    let name: string;

    if (i === 0) {
      const sectionEntry = SECTION_LABELS[seg] || STATIC_LABELS[seg];
      if (sectionEntry) {
        name = isRu ? sectionEntry.ru : sectionEntry.en;
      } else {
        name = prettify(seg);
      }
    } else {
      name = prettify(seg);
    }

    crumbs.push({ name, url: `${SITE_URL}${accumulated}` });
  }

  void SECTION_REGISTRY;

  return crumbs;
}
