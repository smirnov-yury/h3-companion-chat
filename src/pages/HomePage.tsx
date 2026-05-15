import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import TopAppBar from "@/components/TopAppBar";
import NavDrawer from "@/components/NavDrawer";
import GlobalSearch from "@/components/GlobalSearch";
import SEOMeta from "@/components/SEOMeta";
import { useLang } from "@/context/LanguageContext";
import { useNavigate } from "react-router-dom";
import { findSectionByTabId, type SectionDef } from "@/config/sectionRegistry";
import type { TabId } from "@/components/NavDrawer";

export default function HomePage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleTabChange = (newTab: TabId) => {
    const def: SectionDef | undefined = findSectionByTabId(newTab);
    if (def) navigate(`/${def.slug}`);
  };

  return (
    <div className="flex flex-col h-dvh">
      <SEOMeta routeKey="home" />
      <TopAppBar
        title={lang === "RU" ? "Главная" : "Home"}
        onMenuClick={() => setDrawerOpen(true)}
      />
      {/* No active tab on home */}
      <NavDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        active={"" as TabId}
        onChange={handleTabChange}
      />
      <main className="flex-1 overflow-y-auto pt-11 lg:ml-56">
        <div className="min-h-full flex flex-col items-center justify-center px-4 py-10">
          <div className="w-full max-w-2xl text-center space-y-4 mb-8">
            <img
              src="/h3master-lockup-light.svg"
              alt="H3 Master — Board Game Companion"
              className="block dark:hidden w-72 h-72 sm:w-96 sm:h-96 mx-auto"
            />
            <img
              src="/h3master-lockup-dark.svg"
              alt=""
              aria-hidden="true"
              className="hidden dark:block w-72 h-72 sm:w-96 sm:h-96 mx-auto"
            />
            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight"
              style={{ color: "#E8B147" }}
            >
              H3 Master
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {lang === "RU"
                ? "Компаньон для настольной игры «Герои Меча и Магии III»"
                : "Companion for Heroes of Might & Magic III: The Board Game"}
            </p>
          </div>
          <div className="w-full max-w-2xl">
            <GlobalSearch mode="inline" autoFocus initialQuery={initialQuery} />
            <div className="mt-4 text-center">
              <Link
                to="/about"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {lang === "RU" ? "О приложении" : "About"}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
