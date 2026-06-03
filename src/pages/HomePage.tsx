import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import TopAppBar from "@/components/TopAppBar";
import NavDrawer from "@/components/NavDrawer";
import GlobalSearch from "@/components/GlobalSearch";
import SEOMeta from "@/components/SEOMeta";
import { useLang } from "@/context/LanguageContext";
import { useNavigate } from "react-router-dom";
import { findSectionByTabId, type SectionDef } from "@/config/sectionRegistry";
import type { TabId } from "@/components/NavDrawer";
import Footer from "@/components/Footer";
import { resolveBranding } from "@/config/branding";

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
          <div className="w-full max-w-[290px] sm:max-w-[330px] text-center mb-8">
            <img
              src="/h3master-lockup-horizontal-A-light.svg"
              alt="H3 Master — Board Game Companion"
              className="block dark:hidden w-full h-auto mx-auto"
            />
            <img
              src="/h3master-lockup-horizontal-A-dark.svg"
              alt=""
              aria-hidden="true"
              className="hidden dark:block w-full h-auto mx-auto"
            />
          </div>
          <div className="w-full max-w-2xl">
            <GlobalSearch mode="inline" autoFocus initialQuery={initialQuery} />
            <div className="mt-6 text-center">
              <Footer variant="minimal" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
