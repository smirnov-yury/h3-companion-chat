import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Rule {
  id: string;
  category: string;
  title_en: string;
  title_ru: string;
  text_en: string;
  text_ru: string;
}

interface RulesData {
  rules: Rule[];
  loaded: boolean;
  refetch: () => Promise<void>;
}

const RulesContext = createContext<RulesData>({ rules: [], loaded: false, refetch: async () => {} });

export function RulesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RulesData>({ rules: [], loaded: false, refetch: async () => {} });

  const loadRules = useCallback(async (): Promise<Rule[]> => {
    const { data: rulesData } = await supabase.from("rules").select("*").order("sort_order");
    return (rulesData ?? []).map((r: any) => ({
      id: r.id,
      category: r.category || "",
      title_en: r.title_en || "",
      title_ru: r.title_ru || "",
      text_en: r.text_en || "",
      text_ru: r.text_ru || "",
    }));
  }, []);

  const refetch = useCallback(async () => {
    try {
      const rules = await loadRules();
      setData(prev => ({ ...prev, rules }));
    } catch (err) {
      console.error("[RulesContext] Refetch failed:", err);
    }
  }, [loadRules]);

  useEffect(() => {
    async function init() {
      try {
        const rules = await loadRules();
        setData({ rules, loaded: true, refetch });
      } catch (err) {
        console.error("[RulesContext] Init failed:", err);
        setData(prev => ({ ...prev, loaded: true }));
      }
    }
    init();
  }, []);

  return <RulesContext.Provider value={data}>{children}</RulesContext.Provider>;
}

export function useRules() {
  return useContext(RulesContext);
}
