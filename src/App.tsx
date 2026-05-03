import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
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

// Lazy-loaded routes. Heavy or rarely visited.
const AboutPage  = lazy(() => import("./pages/AboutPage.tsx"));
const Index      = lazy(() => import("./pages/Index.tsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.tsx"));
const AdminPanel = lazy(() => import("./pages/AdminPanel.tsx"));
const AdminGuard = lazy(() => import("./components/admin/AdminGuard.tsx"));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
      Loading...
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
    <LanguageProvider>
    <GlyphsProvider>
    <RulesProvider>
    <TooltipProvider>
      <SEOMeta />
      <Toaster />
      <Sonner position="top-center" richColors theme="dark" />
      <PWAUpdateBanner />
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/admin" element={<AdminGuard><AdminPanel /></AdminGuard>} />
            <Route path="/dragonutopia/login" element={<AdminLogin />} />
            <Route path="/dragonutopia/*" element={<AdminGuard><AdminPanel /></AdminGuard>} />
            <Route path="/:section/*" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
    </RulesProvider>
    </GlyphsProvider>
    </LanguageProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
