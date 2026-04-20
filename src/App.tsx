import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RulesProvider } from "./context/RulesContext";
import { LanguageProvider } from "./context/LanguageContext";
import { GlyphsProvider } from "./context/GlyphsContext";
import HomePage from "./pages/HomePage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import Index from "./pages/Index.tsx";
import Admin from "./pages/Admin.tsx";
import NotFound from "./pages/NotFound.tsx";
import PWAUpdateBanner from "./components/PWAUpdateBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <GlyphsProvider>
    <RulesProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAUpdateBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/:section/*" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </RulesProvider>
    </GlyphsProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;

