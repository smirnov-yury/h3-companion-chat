import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Server,
  Bot,
  Globe,
  ShieldCheck,
} from "lucide-react";
import TopAppBar from "@/components/TopAppBar";
import NavDrawer from "@/components/NavDrawer";
import Footer from "@/components/Footer";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";
import { useLang } from "@/context/LanguageContext";
import { findSectionByTabId, type SectionDef } from "@/config/sectionRegistry";
import type { TabId } from "@/components/NavDrawer";
import { trackDonationIntent } from "@/lib/analytics";

const KOFI_URL = "https://ko-fi.com/h3master";

interface CostRow {
  icon: typeof Server;
  labelEn: string;
  labelRu: string;
  valueEn: string;
  valueRu: string;
}

const costs: CostRow[] = [
  {
    icon: Server,
    labelEn: "Hetzner server",
    labelRu: "Сервер Hetzner",
    valueEn: "~€6 / month",
    valueRu: "~€6 / месяц",
  },
  {
    icon: Bot,
    labelEn: "OpenAI API (AI Game Master)",
    labelRu: "OpenAI API (ИИ Мастер игры)",
    valueEn: "~€15-20 / month",
    valueRu: "~€15-20 / месяц",
  },
  {
    icon: Globe,
    labelEn: "Domain h3master.app",
    labelRu: "Домен h3master.app",
    valueEn: "~€15 / year",
    valueRu: "~€15 / год",
  },
];

export default function DonatePage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const isRu = lang === "RU";
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleTabChange = (newTab: TabId) => {
    const def: SectionDef | undefined = findSectionByTabId(newTab);
    if (def) navigate(`/${def.slug}`);
  };

  const handleSupport = () => {
    trackDonationIntent("page");
    window.open(KOFI_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col h-dvh">
      <SEOMeta routeKey="donate" />
      <TopAppBar
        title={isRu ? "Поддержать" : "Support"}
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
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isRu ? "Назад" : "Back"}
          </button>

          {/* Hero */}
          <section className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {isRu ? "Поддержать H3 Master" : "Support H3 Master"}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              {isRu
                ? "H3 Master — бесплатный фанатский проект. Поддержка покрывает хостинг и AI и помогает развивать приложение без рекламы и платных стен."
                : "H3 Master is a free, fan-made project. Your support covers hosting and AI costs and helps the app grow — no ads, no paywalls, ever."}
            </p>
          </section>

          {/* Cost breakdown */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {isRu ? "Куда идут пожертвования" : "Where the money goes"}
            </h2>
            <div className="space-y-2">
              {costs.map((row) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.labelEn}
                    className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 shrink-0 text-primary" />
                      <span className="text-sm font-medium">
                        {isRu ? row.labelRu : row.labelEn}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {isRu ? row.valueRu : row.valueEn}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              {isRu
                ? "Любая сумма помогает. Можно задонатить разово или подписаться на ежемесячный тип на Ko-fi."
                : "Any amount helps. You can tip once or set up a monthly tip on Ko-fi."}
            </p>
          </section>

          {/* CTA */}
          <section className="text-center space-y-3">
            <Button size="lg" onClick={handleSupport}>
              <Heart className="w-4 h-4 mr-2" />
              {isRu ? "Поддержать на Ko-fi" : "Support on Ko-fi"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {isRu
                ? "Откроется в новой вкладке. Платёж обрабатывает Ko-fi через PayPal."
                : "Opens in a new tab. Payment processed by Ko-fi via PayPal."}
            </p>
          </section>

          {/* Trust */}
          <section className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
            <ShieldCheck className="w-5 h-5 shrink-0 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">
              {isRu
                ? "Никаких карточных данных не проходит через h3master.app"
                : "No card data ever passes through h3master.app"}
            </p>
          </section>

          <Footer />
        </div>
      </main>
    </div>
  );
}
