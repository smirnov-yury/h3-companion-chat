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
import AboutPage from "./pages/AboutPage.tsx";
import Index from "./pages/Index.tsx";

import AdminLogin from "./pages/AdminLogin.tsx";
import AdminPanel from "./pages/AdminPanel.tsx";
import AdminGuard from "./components/admin/AdminGuard.tsx";
import NotFound from "./pages/NotFound.tsx";
import PWAUpdateBanner from "./components/PWAUpdateBanner";
import SEOMeta from "./components/SEOMeta";

const queryClient = new QueryClient();

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
      </BrowserRouter>
    </TooltipProvider>
    </RulesProvider>
    </GlyphsProvider>
    </LanguageProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
