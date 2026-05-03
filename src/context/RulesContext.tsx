import { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const RulesContext = createContext<RulesData>({
  rules: [],
  components: [],
  loaded: false,
  refetch: async () => {},
});

const RULES_KEY = ["rules"] as const;
const COMPONENTS_KEY = ["components"] as const;

async function fetchRules(): Promise<Rule[]> {
  const { data, error } = await supabase.from("rules").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    category: r.category || "",
    title_en: r.title_en || "",
    title_ru: r.title_ru || "",
    text_en: r.text_en || "",
    text_ru: r.text_ru || "",
  }));
}

async function fetchComponents(): Promise<Component[]> {
  const { data, error } = await supabase.from("components").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
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
}

export function RulesProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const rulesQuery = useQuery({
    queryKey: RULES_KEY,
    queryFn: fetchRules,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const componentsQuery = useQuery({
    queryKey: COMPONENTS_KEY,
    queryFn: fetchComponents,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const refetch = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: RULES_KEY }),
      queryClient.invalidateQueries({ queryKey: COMPONENTS_KEY }),
    ]);
  };

  const value: RulesData = {
    rules: rulesQuery.data ?? [],
    components: componentsQuery.data ?? [],
    loaded: !rulesQuery.isLoading && !componentsQuery.isLoading,
    refetch,
  };

  return <RulesContext.Provider value={value}>{children}</RulesContext.Provider>;
}

export function useRules() {
  return useContext(RulesContext);
}
