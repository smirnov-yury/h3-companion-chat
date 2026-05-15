import { Helmet } from "react-helmet-async";
import { useLang } from "@/context/LanguageContext";
import type { TabId } from "@/components/NavDrawer";

const SITE_URL = "https://h3master.app";
const APP_NAME = "H3 Master";
const APP_FULL_NAME = "H3 Master — Companion for Heroes of Might & Magic III: The Board Game";

const DESCRIPTIONS = {
  EN: "H3 Master — unofficial companion app for Heroes of Might & Magic III: The Board Game. Rules, scenarios, units, heroes, spells, artifacts. Offline-ready PWA.",
  RU: "H3 Master — неофициальное приложение-компаньон для настольной игры «Герои Меча и Магии III». Правила, сценарии, юниты, герои, заклинания, артефакты. Работает офлайн.",
} as const;

type RouteKey = TabId | "home" | "about";

const TITLES: Record<RouteKey, { en: string; ru: string }> = {
  home:          { en: "H3 Master — HoMM III Board Game Companion", ru: "H3 Master — Компаньон для «Герои Меча и Магии III»" },
  about:         { en: "About — H3 Master",                          ru: "О приложении — H3 Master" },
  rules:         { en: "Rules — H3 Master",                          ru: "Правила — H3 Master" },
  scenarios:     { en: "Scenarios — H3 Master",                      ru: "Сценарии — H3 Master" },
  units:         { en: "Units — H3 Master",                          ru: "Юниты — H3 Master" },
  heroes:        { en: "Heroes — H3 Master",                         ru: "Герои — H3 Master" },
  decks:         { en: "Decks — H3 Master",                          ru: "Колоды — H3 Master" },
  map_elements:  { en: "Map Elements — H3 Master",                   ru: "Элементы карты — H3 Master" },
  global_events: { en: "Global Events — H3 Master",                  ru: "Глобальные события — H3 Master" },
  towns:         { en: "Towns — H3 Master",                          ru: "Города — H3 Master" },
  ai:            { en: "AI Game Master — H3 Master",                 ru: "ИИ Мастер игры — H3 Master" },
  game_setup:    { en: "Game Setup — H3 Master",                     ru: "Подготовка партии — H3 Master" },
};

interface SEOMetaProps {
  routeKey?: RouteKey;
}

export default function SEOMeta({ routeKey }: SEOMetaProps) {
  const { lang } = useLang();
  const isRu = lang === "RU";

  const titles = routeKey ? TITLES[routeKey] : null;
  const title = titles ? (isRu ? titles.ru : titles.en) : APP_FULL_NAME;
  const description = isRu ? DESCRIPTIONS.RU : DESCRIPTIONS.EN;
  const url =
    typeof window !== "undefined" ? window.location.origin + window.location.pathname : SITE_URL;

  return (
    <Helmet>
      <html lang={isRu ? "ru" : "en"} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:site_name" content={APP_NAME} />
      <meta property="og:title" content={APP_FULL_NAME} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={APP_FULL_NAME} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
