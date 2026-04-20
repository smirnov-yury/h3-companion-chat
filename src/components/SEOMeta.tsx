import { Helmet } from "react-helmet-async";
import { useLang } from "@/context/LanguageContext";
import type { TabId } from "@/components/NavDrawer";

const SITE_URL = "https://h3-companion-ai.lovable.app";
const APP_NAME = "Heroes III Board Game Companion";

const DESCRIPTIONS = {
  EN: "Digital companion for the Heroes of Might & Magic III board game. Rules, scenarios, unit cards, heroes, spells, artifacts — always at hand. Offline-ready PWA.",
  RU: "Цифровой помощник для настольной игры Герои Меча и Магии III. Правила, сценарии, юниты, герои, заклинания, артефакты. Работает офлайн.",
} as const;

type RouteKey = TabId | "home" | "about";

const TITLES: Record<RouteKey, { en: string; ru: string }> = {
  home: { en: "Heroes III Companion — Home", ru: "Heroes III Companion — Главная" },
  about: { en: "About — Heroes III Companion", ru: "О приложении — Heroes III Companion" },
  rules: { en: "Rules — Heroes III Companion", ru: "Правила — Heroes III Companion" },
  scenarios: { en: "Scenarios — Heroes III Companion", ru: "Сценарии — Heroes III Companion" },
  units: { en: "Units — Heroes III Companion", ru: "Юниты — Heroes III Companion" },
  heroes: { en: "Heroes — Heroes III Companion", ru: "Герои — Heroes III Companion" },
  decks: { en: "Decks — Heroes III Companion", ru: "Колоды — Heroes III Companion" },
  map_elements: {
    en: "Map Elements — Heroes III Companion",
    ru: "Элементы карты — Heroes III Companion",
  },
  global_events: {
    en: "Global Events — Heroes III Companion",
    ru: "Глобальные события — Heroes III Companion",
  },
  towns: { en: "Towns — Heroes III Companion", ru: "Города — Heroes III Companion" },
  ai: { en: "AI Game Master — Heroes III Companion", ru: "ИИ Мастер — Heroes III Companion" },
};

interface SEOMetaProps {
  routeKey?: RouteKey;
}

export default function SEOMeta({ routeKey }: SEOMetaProps) {
  const { lang } = useLang();
  const isRu = lang === "RU";

  const titles = routeKey ? TITLES[routeKey] : null;
  const title = titles ? (isRu ? titles.ru : titles.en) : APP_NAME;
  const description = isRu ? DESCRIPTIONS.RU : DESCRIPTIONS.EN;
  const url =
    typeof window !== "undefined" ? window.location.origin + window.location.pathname : SITE_URL;

  return (
    <Helmet>
      <html lang={isRu ? "ru" : "en"} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={APP_NAME} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={APP_NAME} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
