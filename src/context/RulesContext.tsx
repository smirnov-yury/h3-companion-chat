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

export interface Component {
  id: string;
  title_en: string;
  title_ru: string;
  description_en: string;
  description_ru: string;
  image: string;
  rule_id: string | null;
  body_en?: string;
  body_ru?: string;
  category?: string;
  type?: string;
  faction?: string;
  media_url?: string | null;
}

interface RulesData {
  rules: Rule[];
  components: Component[];
  loaded: boolean;
  refetch: () => Promise<void>;
}

const RulesContext = createContext<RulesData>({ rules: [], components: [], loaded: false, refetch: async () => {} });

export function RulesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RulesData>({ rules: [], components: [], loaded: false, refetch: async () => {} });

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

  const loadComponents = useCallback(async (): Promise<Component[]> => {
    const { data: compsData } = await supabase.from("components").select("*").order("sort_order");
    return (compsData ?? []).map((c: any) => ({
      id: c.id,
      title_en: c.title_en || "",
      title_ru: c.title_ru || "",
      description_en: c.body_en || "",
      description_ru: c.body_ru || "",
      body_en: c.body_en || "",
      body_ru: c.body_ru || "",
      image: c.image || "",
      rule_id: c.rule_id || null,
      category: c.category || "",
      type: c.type || "",
      faction: c.faction || "",
      media_url: c.media_url || null,
    }));
  }, []);

  const refetch = useCallback(async () => {
    try {
      const [rules, components] = await Promise.all([loadRules(), loadComponents()]);
      setData(prev => ({ ...prev, rules, components }));
    } catch (err) {
      console.error("[RulesContext] Refetch failed:", err);
    }
  }, [loadRules, loadComponents]);

  useEffect(() => {
    async function init() {
      try {
        const [rules, components] = await Promise.all([loadRules(), loadComponents()]);
        setData({ rules, components, loaded: true, refetch });
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
