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

  const loadFromSupabase = useCallback(async () => {
    const [{ data: rulesData }, { data: compsData }] = await Promise.all([
      supabase.from("rules").select("*").order("sort_order"),
      supabase.from("components").select("*").order("sort_order"),
    ]);

    const rules: Rule[] = (rulesData ?? []).map((r: any) => ({
      id: r.id,
      category: r.category || "",
      title_en: r.title_en || "",
      title_ru: r.title_ru || "",
      text_en: r.text_en || "",
      text_ru: r.text_ru || "",
    }));

    const components: Component[] = (compsData ?? []).map((c: any) => ({
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

    return { rules, components };
  }, []);

  const refetch = useCallback(async () => {
    try {
      const { rules, components } = await loadFromSupabase();
      console.log(`[RulesContext] Refetched ${rules.length} rules, ${components.length} components`);
      setData(prev => ({ ...prev, rules, components }));
    } catch (err) {
      console.error("[RulesContext] Refetch failed:", err);
    }
  }, [loadFromSupabase]);

  useEffect(() => {
    const KEY_MAP: Record<string, string> = {
      location: "locations",
      mechanic: "game_mechanics",
      Альянс: "alliance",
    };
    const normalizeCategory = (key: string) => KEY_MAP[key] ?? key;

    async function init() {
      try {
        // Check if Supabase has data
        const { count } = await supabase
          .from("components")
          .select("id", { count: "exact", head: true });

        if (count && count > 0) {
          // Load from Supabase
          const { rules, components } = await loadFromSupabase();
          console.log(`[RulesContext] Loaded from Supabase: ${rules.length} rules, ${components.length} components`);
          setData({ rules, components, loaded: true, refetch });
          return;
        }

        // Seed from JSON
        console.log("[RulesContext] Supabase empty, seeding from JSON...");
        const json = await fetch("/merged_database_final.json").then((r) => r.json());

        const jsonRules = (json.rules ?? []).map((r: any) => ({
          id: r.id,
          category: normalizeCategory(r.category || ""),
          title_en: r.title_en || null,
          title_ru: r.title_ru || null,
          text_en: r.text_en || null,
          text_ru: r.text_ru || null,
        }));

        const jsonComponents = (json.components ?? []).map((c: any) => ({
          id: c.id,
          title_en: c.title_en || null,
          title_ru: c.title_ru || null,
          body_en: c.description_en || null,
          body_ru: c.description_ru || null,
          image: c.image || null,
          rule_id: c.rule_id || null,
          category: "",
          type: null,
          faction: null,
        }));

        // Seed categories
        const COMPONENT_CATEGORIES = [
          { key: "unit", label_ru: "Юниты", label_en: "Units", sort_order: 0 },
          { key: "card", label_ru: "Карты", label_en: "Cards", sort_order: 1 },
          { key: "hero", label_ru: "Герои", label_en: "Heroes", sort_order: 2 },
          { key: "token", label_ru: "Жетоны", label_en: "Tokens", sort_order: 3 },
          { key: "icon", label_ru: "Иконки", label_en: "Icons", sort_order: 4 },
          { key: "schema", label_ru: "Схемы", label_en: "Schemas", sort_order: 5 },
          { key: "game", label_ru: "Игровое", label_en: "Game", sort_order: 6 },
          { key: "book", label_ru: "Книги", label_en: "Books", sort_order: 7 },
          { key: "mission", label_ru: "Миссии", label_en: "Missions", sort_order: 8 },
          { key: "location", label_ru: "Локации", label_en: "Locations", sort_order: 9 },
          { key: "rule", label_ru: "Правила", label_en: "Rules", sort_order: 10 },
          { key: "miss", label_ru: "Разное", label_en: "Misc", sort_order: 11 },
          { key: "other", label_ru: "Прочее", label_en: "Other", sort_order: 12 },
        ];

        // Insert in batches
        const BATCH = 500;
        for (let i = 0; i < jsonRules.length; i += BATCH) {
          await supabase.from("rules").upsert(jsonRules.slice(i, i + BATCH), { onConflict: "id" });
        }
        for (let i = 0; i < jsonComponents.length; i += BATCH) {
          await supabase.from("components").upsert(jsonComponents.slice(i, i + BATCH), { onConflict: "id" });
        }
        await supabase.from("categories").upsert(COMPONENT_CATEGORIES, { onConflict: "key" });

        console.log(`[RulesContext] Seeded ${jsonRules.length} rules, ${jsonComponents.length} components, ${COMPONENT_CATEGORIES.length} categories`);

        // Now load back from Supabase
        const { rules, components } = await loadFromSupabase();
        setData({ rules, components, loaded: true, refetch });
      } catch (err) {
        console.error("[RulesContext] Init failed:", err);
        // Fallback to JSON
        try {
          const json = await fetch("/merged_database_final.json").then((r) => r.json());
          const rules = (json.rules ?? []).map((r: any) => ({
            ...r,
            category: (KEY_MAP as any)[r.category] ?? r.category,
          }));
          const components = json.components ?? [];
          setData({ rules, components, loaded: true, refetch });
        } catch {
          setData((d) => ({ ...d, loaded: true, refetch }));
        }
      }
    }

    init();
  }, []);

  return <RulesContext.Provider value={data}>{children}</RulesContext.Provider>;
}

export const useRules = () => useContext(RulesContext);
