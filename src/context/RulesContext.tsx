import { createContext, useContext, useEffect, useState, ReactNode } from "react";

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
}

interface RulesData {
  rules: Rule[];
  components: Component[];
  loaded: boolean;
}

const RulesContext = createContext<RulesData>({ rules: [], components: [], loaded: false });

export function RulesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RulesData>({ rules: [], components: [], loaded: false });

  useEffect(() => {
    const KEY_MAP: Record<string, string> = {
      'location': 'locations',
      'mechanic': 'game_mechanics',
      'Альянс': 'alliance',
    };
    const normalizeCategory = (key: string) => KEY_MAP[key] ?? key;

    fetch("/merged_database_final.json")
      .then((r) => r.json())
      .then((json) => {
        const rules = (json.rules ?? []).map((r: Rule) => ({
          ...r,
          category: normalizeCategory(r.category),
        }));
        const components = json.components ?? [];
        console.log(`[RulesContext] Loaded ${rules.length} rules, ${components.length} components`);
        setData({ rules, components, loaded: true });
      })
      .catch((err) => {
        console.error("[RulesContext] Failed to load rules database:", err);
        setData((d) => ({ ...d, loaded: true }));
      });
  }, []);

  return <RulesContext.Provider value={data}>{children}</RulesContext.Provider>;
}

export const useRules = () => useContext(RulesContext);
