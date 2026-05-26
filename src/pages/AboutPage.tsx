import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Map,
  Layers,
  Zap,
  Package,
  Shield,
  Star,
  Building2,
  Bot,
  Heart,
  Mail,
  Smartphone,
  Wand2,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import TopAppBar from "@/components/TopAppBar";
import NavDrawer from "@/components/NavDrawer";
import { Button } from "@/components/ui/button";
import { useLang } from "@/context/LanguageContext";
import { findSectionByTabId, type SectionDef } from "@/config/sectionRegistry";
import type { TabId } from "@/components/NavDrawer";
import { checkForPWAUpdate } from "@/pwa/registerSW";
import SEOMeta from "@/components/SEOMeta";
import Footer from "@/components/Footer";

const EMAIL_USER = "privacy";
const EMAIL_DOMAIN = "h3master.app";

interface FeatureRow {
  icon: LucideIcon;
  en: string;
  ru: string;
}

const features: FeatureRow[] = [
  { icon: BookOpen, en: "Rules", ru: "Правила" },
  { icon: Map, en: "Scenarios", ru: "Сценарии" },
  { icon: Layers, en: "Map Elements", ru: "Элементы карты" },
  { icon: Zap, en: "Global Events", ru: "Глобальные события" },
  { icon: Package, en: "Decks", ru: "Колоды" },
  { icon: Shield, en: "Units", ru: "Юниты" },
  { icon: Star, en: "Heroes", ru: "Герои" },
  { icon: Building2, en: "Towns", ru: "Города" },
  { icon: Bot, en: "AI Game Master", ru: "ИИ Мастер игры" },
  { icon: Wand2, en: "Game Setup", ru: "Подготовка партии" },
];

export default function AboutPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const isRu = lang === "RU";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [emailRevealed, setEmailRevealed] = useState(false);

  const handleTabChange = (newTab: TabId) => {
    const def: SectionDef | undefined = findSectionByTabId(newTab);
    if (def) navigate(`/${def.slug}`);
  };

  const handleCheckUpdate = async () => {
    setChecking(true);
    const result = await checkForPWAUpdate();
    setChecking(false);
    if (result === "current") {
      toast(isRu ? "У вас последняя версия" : "You have the latest version");
    } else if (result === "unavailable") {
      toast(
        isRu
          ? "Обновления недоступны в режиме предпросмотра"
          : "Updates unavailable in preview mode"
      );
    }
    // "updated" → banner appears automatically
  };

  return (
    <div className="flex flex-col h-dvh">
      <SEOMeta routeKey="about" />
      <TopAppBar
        title={isRu ? "О приложении" : "About"}
        onMenuClick={() => setDrawerOpen(true)}
      />
      <NavDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        active={"" as TabId}
        onChange={handleTabChange}
      />
      <main className="flex-1 overflow-y-auto pt-11 lg:ml-56">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-12">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isRu ? "Назад" : "Back"}
          </Link>

          {/* 1. Hero */}
          <section className="text-center space-y-3">
            <h1
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ color: "#E8B147" }}
            >
              H3 Master
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              {isRu
                ? "Неофициальный компаньон для настольной игры «Герои Меча и Магии III». Правила, сценарии, карточки — всегда под рукой."
                : "Unofficial companion for Heroes of Might & Magic III: The Board Game. Rules, scenarios, cards — always at hand."}
            </p>
          </section>

          {/* 2. Features list */}
          <section>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {features.map(({ icon: Icon, en, ru }) => (
                <li
                  key={en}
                  className="flex items-center gap-3 px-3 py-2 rounded-md border border-border bg-card"
                >
                  <Icon className="w-5 h-5 shrink-0 text-primary" />
                  <span className="text-sm font-medium">{isRu ? ru : en}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 3. About / SEO text */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">
              {isRu ? "О приложении" : "About the App"}
            </h2>
            {isRu ? (
              <>
                <p className="text-sm leading-relaxed text-foreground/90">
                  H3 Master — неофициальное фанатское приложение-компаньон для игроков в настольную игру «Герои Меча и Магии III» от Archon Studio.
                </p>
                <p className="text-sm leading-relaxed text-foreground/90">
                  Полные правила, все книги миссий (MB1–MB9), карточки юнитов и героев, артефакты, заклинания, умения, городские постройки, элементы карты и глобальные события — всё в одном месте. Поддержка русского языка, ИИ Мастер игры с голосовым вводом и многоходовым диалогом с памятью, генератор подготовки партии для быстрого старта.
                </p>
                <p className="text-xs text-muted-foreground">
                  Ключевые слова: H3 Master, настольная игра Герои Меча и Магии 3, HoMM3BG, приложение-компаньон, правила игры, Archon Studio, просмотр сценариев, карточки юнитов, голосовой ввод, ИИ Мастер игры, подготовка партии.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-foreground/90">
                  H3 Master is an unofficial fan-made companion app for players of Heroes of Might & Magic III: The Board Game by Archon Studio.
                </p>
                <p className="text-sm leading-relaxed text-foreground/90">
                  Covers the full rulebook, all mission books (MB1–MB9), unit and hero cards, artifact, spell and ability decks, town buildings, map elements, and global events — all in one place. Russian language support, an AI Game Master with voice input and multi-turn conversation memory, plus a Game Setup generator for quick game configuration.
                </p>
                <p className="text-xs text-muted-foreground">
                  Keywords: H3 Master, Heroes of Might and Magic III board game, HoMM3BG, companion app, rules reference, offline rulebook, Archon Studio, scenario viewer, unit cards, voice input, AI Game Master, game setup generator.
                </p>
              </>
            )}
          </section>

          {/* 4. Add to Home Screen */}
          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                {isRu ? "Установить приложение" : "Install the App"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? "Добавьте на главный экран для лучшего опыта"
                  : "Add to your home screen for the best experience"}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <h3 className="text-sm font-semibold">iOS (Safari)</h3>
                <ol className="text-sm text-foreground/90 space-y-1 list-decimal list-inside">
                  {isRu ? (
                    <>
                      <li>Откройте в Safari</li>
                      <li>Нажмите значок «Поделиться»</li>
                      <li>Выберите «На экран «Домой»»</li>
                    </>
                  ) : (
                    <>
                      <li>Open in Safari</li>
                      <li>Tap the Share icon</li>
                      <li>Select «Add to Home Screen»</li>
                    </>
                  )}
                </ol>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <h3 className="text-sm font-semibold">Android (Chrome)</h3>
                <ol className="text-sm text-foreground/90 space-y-1 list-decimal list-inside">
                  {isRu ? (
                    <>
                      <li>Откройте в Chrome</li>
                      <li>Нажмите меню (⋮)</li>
                      <li>Выберите «Добавить на главный экран»</li>
                    </>
                  ) : (
                    <>
                      <li>Open in Chrome</li>
                      <li>Tap menu (⋮)</li>
                      <li>Select «Add to Home screen»</li>
                    </>
                  )}
                </ol>
              </div>
            </div>
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckUpdate}
                disabled={checking}
              >
                <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
                {isRu ? "Проверить обновления" : "Check for updates"}
              </Button>
            </div>
          </section>

          {/* 5. Donate */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">
              {isRu ? "Поддержать проект" : "Support the Project"}
            </h2>
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <Heart className="w-10 h-10 mx-auto text-primary" />
              <p className="mt-3 text-sm text-foreground/90 max-w-md mx-auto">
                {isRu
                  ? "H3 Master — бесплатный фанатский проект без рекламы. Поддержка покрывает хостинг и AI."
                  : "H3 Master is a free, fan-made project with no ads. Donations cover hosting and AI costs."}
              </p>
              <Button className="mt-4" onClick={() => navigate("/donate")}>
                <Heart className="w-4 h-4 mr-2" />
                {isRu ? "Поддержать проект" : "Support the project"}
              </Button>
            </div>
          </section>

          {/* 6. Contact */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">
              {isRu ? "Контакты" : "Contact"}
            </h2>
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <Mail className="w-10 h-10 mx-auto text-primary" />
              {emailRevealed ? (
                <a
                  href={`mailto:${EMAIL_USER}@${EMAIL_DOMAIN}`}
                  className="mt-3 inline-block text-base font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {EMAIL_USER}@{EMAIL_DOMAIN}
                </a>
              ) : (
                <button
                  onClick={() => setEmailRevealed(true)}
                  className="mt-3 inline-block text-base font-semibold text-foreground hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
                >
                  {EMAIL_USER} [at] {EMAIL_DOMAIN}
                  <span className="block text-xs text-muted-foreground mt-1 font-normal">
                    {isRu ? "Нажмите чтобы показать" : "Click to reveal"}
                  </span>
                </button>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {isRu
                  ? "Для любых вопросов: конфиденциальность, GDPR-запросы, сообщения об ошибках, обратная связь."
                  : "For anything: privacy questions, GDPR requests, bug reports, feedback."}
              </p>
            </div>
          </section>

          {/* 7. Disclaimer */}
          <section className="space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isRu
                ? "Неофициальное фанатское приложение-компаньон. Не аффилировано с Ubisoft Entertainment или Archon Studio и не одобрено ими. Весь игровой контент основан на официальных PDF-файлах правил и предоставляется исключительно для образовательных и справочных целей. Heroes of Might & Magic является торговой маркой Ubisoft Entertainment. Heroes of Might & Magic III: The Board Game является продуктом Archon Studio и используется в рамках принципов добросовестного использования для фанатского сопровождения."
                : "Unofficial fan-made companion. Not affiliated with or endorsed by Ubisoft Entertainment or Archon Studio. All game content is based on official rulebook PDFs and provided for educational and reference purposes only. Heroes of Might & Magic is a trademark of Ubisoft Entertainment. Heroes of Might & Magic III: The Board Game is a product of Archon Studio and is used under principles of fair use for fan companionship."}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isRu ? (
                <>
                  Используя H3 Master, вы принимаете{" "}
                  <Link to="/terms" className="underline hover:text-primary transition-colors">
                    Условия использования
                  </Link>{" "}
                  и подтверждаете ознакомление с{" "}
                  <Link to="/privacy" className="underline hover:text-primary transition-colors">
                    Политикой конфиденциальности
                  </Link>
                  .
                </>
              ) : (
                <>
                  By using H3 Master, you accept our{" "}
                  <Link to="/terms" className="underline hover:text-primary transition-colors">
                    Terms of Service
                  </Link>{" "}
                  and acknowledge our{" "}
                  <Link to="/privacy" className="underline hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                  .
                </>
              )}
            </p>
          </section>

          <Footer />
        </div>
      </main>
    </div>
  );
}
