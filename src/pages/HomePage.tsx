import { useState } from "react";
import { Link } from "react-router-dom";
import TopAppBar from "@/components/TopAppBar";
import NavDrawer from "@/components/NavDrawer";
import GlobalSearch from "@/components/GlobalSearch";
import { useLang } from "@/context/LanguageContext";
import { useNavigate } from "react-router-dom";
import { findSectionByTabId, type SectionDef } from "@/config/sectionRegistry";
import type { TabId } from "@/components/NavDrawer";

export default function HomePage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleTabChange = (newTab: TabId) => {
    const def: SectionDef | undefined = findSectionByTabId(newTab);
    if (def) navigate(`/${def.slug}`);
  };

  return (
    <div className="flex flex-col h-dvh">
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
          <div className="w-full max-w-2xl text-center space-y-2 mb-8">
            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight"
              style={{ color: "#E1BB3A" }}
            >
              Heroes III Board Game
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {lang === "RU" ? "Приложение‑компаньон" : "Companion App"}
            </p>
          </div>
          <div className="w-full max-w-2xl">
            <GlobalSearch mode="inline" autoFocus />
          </div>
        </div>
      </main>
    </div>
  );
}
