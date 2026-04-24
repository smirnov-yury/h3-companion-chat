import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Lang = "RU" | "EN";

interface LanguageContextValue {
  lang: Lang;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "RU",
  toggleLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("app_language") as Lang) || "RU");
  const toggleLang = useCallback(() => setLang((l) => {
    const next = l === "RU" ? "EN" : "RU";
    localStorage.setItem("app_language", next);
    return next;
  }), []);
  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
