import { Helmet } from "react-helmet-async";
import { useLang } from "@/context/LanguageContext";
import type { TabId } from "@/components/NavDrawer";
import { buildBreadcrumbs } from "@/seo/buildBreadcrumbs";

const SITE_URL = "https://h3master.app";
const APP_NAME = "H3 Master";
const APP_FULL_NAME = "H3 Master — Companion for Heroes of Might & Magic III: The Board Game";

type RouteKey = TabId | "home" | "about" | "privacy" | "terms";

const DESCRIPTIONS: Record<RouteKey | "default", { en: string; ru: string }> = {
  default:       { en: "H3 Master — unofficial companion app for Heroes of Might & Magic III: The Board Game. Rules, scenarios, units, heroes, spells, artifacts. Offline-ready PWA.",
                   ru: "H3 Master — неофициальное приложение-компаньон для настольной игры «Герои Меча и Магии III». Правила, сценарии, юниты, герои, заклинания, артефакты. Работает офлайн." },
  home:          { en: "H3 Master — unofficial companion app for Heroes of Might & Magic III: The Board Game. Rules, scenarios, units, heroes, spells, artifacts. Offline-ready PWA.",
                   ru: "H3 Master — неофициальное приложение-компаньон для настольной игры «Герои Меча и Магии III». Правила, сценарии, юниты, герои, заклинания, артефакты. Работает офлайн." },
  about:         { en: "About H3 Master — credits, disclaimer, and project background for the unofficial Heroes III board game companion app.",
                   ru: "О приложении H3 Master — благодарности, отказ от ответственности и история проекта неофициального приложения-компаньона для настольной игры «Герои Меча и Магии III»." },
  privacy:       { en: "Privacy Policy for H3 Master companion app — what data we collect, how it's stored, your rights under GDPR.",
                   ru: "Политика конфиденциальности H3 Master — какие данные собираются, как хранятся, ваши права согласно GDPR." },
  terms:         { en: "Terms of Service for H3 Master companion app — usage rules, disclaimer, and licensing information.",
                   ru: "Условия использования H3 Master — правила использования, отказ от ответственности и информация о лицензии." },
  rules:         { en: "All 271 rules of Heroes III: The Board Game — preparation, turns, combat, towns, FAQ. Searchable by category.",
                   ru: "Все 271 правило настольной игры «Герои Меча и Магии III» — подготовка, ходы, бой, города, FAQ. Поиск по категориям." },
  scenarios:     { en: "All 61 scenarios from 10 mission books — setup, map variants, story, victory conditions, timed events.",
                   ru: "Все 61 сценарий из 10 буклетов — подготовка, варианты карт, сюжет, условия победы, события по раундам." },
  units:         { en: "All 241 unit cards in Heroes III: The Board Game — stats, abilities, special rules. Few, Pack, Neutral variants.",
                   ru: "Все 241 карта юнитов в «Героях Меча и Магии III» — характеристики, способности, спец-правила. Few, Pack, Neutral варианты." },
  heroes:        { en: "All 65 heroes with class, specialty, stats and level abilities. Castle, Rampart, Tower, Inferno, Necropolis, Dungeon, Stronghold, Fortress, Conflux, Cove.",
                   ru: "Все 65 героев с классом, специализацией, характеристиками и способностями уровней. Замок, Оплот, Башня, Инферно, Некрополис, Подземелье, Цитадель, Крепость, Конфлюкс, Бухта." },
  decks:         { en: "Artifacts, spells, abilities, war machines, and statistic cards — full reference with effects and rarities.",
                   ru: "Артефакты, заклинания, способности, осадные орудия и карты характеристик — полный справочник с эффектами и редкостью." },
  map_elements:  { en: "All map locations, glyphs, and map events — what each tile does, how visiting works, encounter rules.",
                   ru: "Все локации карты, глифы и события карты — что делает каждая клетка, правила посещения и встреч." },
  global_events: { en: "Events, Astrologers Proclaim, vs Computer (AI) cards, and Morale cards — every recurring effect across the campaign.",
                   ru: "События, Воззвания астрологов, карты ИИ (vs Computer) и карты Морали — все повторяющиеся эффекты в кампании." },
  towns:         { en: "All 10 town factions with their buildings, dwellings, and starting layouts. Castle, Rampart, Tower and more.",
                   ru: "Все 10 фракций городов с постройками, жилищами и начальными раскладками. Замок, Оплот, Башня и другие." },
  ai:            { en: "AI Game Master — ask any rule question about Heroes III: The Board Game. Cited answers with rulebook references. Bilingual EN/RU.",
                   ru: "ИИ Мастер игры — задайте любой вопрос по правилам настольной игры «Герои Меча и Магии III». Ответы с цитатами из правил. Двуязычно EN/RU." },
  game_setup:    { en: "Game Setup wizard — pick scenario, players, factions, and generate a ready-to-share session link. Supports Clash, Campaign, Co-op, Alliance, Solo.",
                   ru: "Мастер подготовки партии — выберите сценарий, игроков, фракции и сгенерируйте ссылку на сессию. Поддержка режимов Clash, Campaign, Co-op, Alliance, Solo." },
};


const TITLES: Record<RouteKey, { en: string; ru: string }> = {
  home:          { en: "H3 Master — HoMM III Board Game Companion", ru: "H3 Master — Компаньон для «Герои Меча и Магии III»" },
  about:         { en: "About — H3 Master",                          ru: "О приложении — H3 Master" },
  privacy:       { en: "Privacy Policy — H3 Master",                 ru: "Политика конфиденциальности — H3 Master" },
  terms:         { en: "Terms of Service — H3 Master",               ru: "Условия использования — H3 Master" },
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
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "/";
  const crumbs = buildBreadcrumbs(pathname, isRu);
  const breadcrumbJsonLd =
    crumbs.length >= 2
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: crumbs.map((c, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            name: c.name,
            item: c.url,
          })),
        }
      : null;

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
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          data-rh-key="breadcrumb-jsonld"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbJsonLd),
          }}
        />
      )}
    </Helmet>
  );
}
