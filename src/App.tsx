import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { initAnalytics, trackPageView } from "@/lib/analytics";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RulesProvider } from "./context/RulesContext";
import { LanguageProvider } from "./context/LanguageContext";
import { GlyphsProvider } from "./context/GlyphsContext";
import HomePage from "./pages/HomePage.tsx";
import NotFound from "./pages/NotFound.tsx";
import PWAUpdateBanner from "./components/PWAUpdateBanner";
import SEOMeta from "./components/SEOMeta";
import CookieConsent from "./components/CookieConsent";
import H3MasterSpinner from "@/components/H3MasterSpinner";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { RuleExtModalProvider } from "@/context/RuleExtModalContext";
import RuleExtModal from "@/components/RuleExtModal";

// Lazy-loaded routes. Heavy or rarely visited.
const AboutPage  = lazy(() => import("./pages/AboutPage.tsx"));
const Index      = lazy(() => import("./pages/Index.tsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.tsx"));
const AdminPanel = lazy(() => import("./pages/AdminPanel.tsx"));
const AdminGuard = lazy(() => import("./components/admin/AdminGuard.tsx"));
const GameSetup  = lazy(() => import("./pages/GameSetup.tsx"));
const GameSession = lazy(() => import("./pages/GameSession.tsx"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const DonatePage = lazy(() => import("@/pages/DonatePage"));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-foreground">
      <H3MasterSpinner variant="draw" size={64} className="text-foreground" ariaLabel="Loading" />
    </div>
  );
}

function AnalyticsBoot() {
  const location = useLocation();
  useEffect(() => {
    initAnalytics();
  }, []);
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <GlyphsProvider>
    <RulesProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" richColors theme="dark" />
      <PWAUpdateBanner />
      <BrowserRouter>
        <RuleExtModalProvider>
          <SEOMeta />
          <CookieConsent />
          <AnalyticsBoot />
          <RuleExtModal />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/donate" element={<DonatePage />} />
              <Route path="/admin" element={<AdminAuthProvider><AdminGuard><AdminPanel /></AdminGuard></AdminAuthProvider>} />
              <Route path="/dragonutopia/login" element={<AdminAuthProvider><AdminLogin /></AdminAuthProvider>} />
              <Route path="/dragonutopia/*" element={<AdminAuthProvider><AdminGuard><AdminPanel /></AdminGuard></AdminAuthProvider>} />
              <Route path="/game-setup" element={<GameSetup />} />
              <Route path="/game/:uuid" element={<GameSession />} />
              <Route path="/:section/*" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </RuleExtModalProvider>
      </BrowserRouter>
    </TooltipProvider>
    </RulesProvider>
    </GlyphsProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
