import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EntityLink {
  to_type: string;
  to_id: string;
  link_type: string;
  context_text: string | null;
  // Resolved display name (filled after fetching the target entity)
  name_en?: string;
  name_ru?: string | null;
}

const NAME_TABLES: Record<string, { table: string; nameField: "name" | "title" }> = {
  spell: { table: "spells", nameField: "name" },
  ability: { table: "abilities", nameField: "name" },
  artifact: { table: "artifacts", nameField: "name" },
  unit: { table: "unit_stats", nameField: "name" },
  hero: { table: "heroes", nameField: "name" },
  rule: { table: "rules", nameField: "title" },
};

export function useEntityLinks(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
) {
  const [links, setLinks] = useState<EntityLink[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entityType || !entityId) {
      setLinks([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("entity_links")
        .select("to_type, to_id, link_type, context_text, sort_order")
        .eq("from_type", entityType)
        .eq("from_id", entityId)
        .order("sort_order", { ascending: true });

      if (cancelled) return;
      const rows = (data ?? []) as EntityLink[];
      if (rows.length === 0) {
        setLinks([]);
        setLoading(false);
        return;
      }

      // Resolve display names per to_type
      const byType: Record<string, string[]> = {};
      rows.forEach((r) => {
        (byType[r.to_type] ??= []).push(r.to_id);
      });

      const nameMap = new Map<string, { name_en: string; name_ru: string | null }>();
      await Promise.all(
        Object.entries(byType).map(async ([type, ids]) => {
          const cfg = NAME_TABLES[type];
          if (!cfg) return;
          const fields =
            cfg.nameField === "title" ? "id, title_en, title_ru" : "id, name_en, name_ru";
          const { data: rowsData } = await supabase
            .from(cfg.table as never)
            .select(fields)
            .in("id", ids);
          (rowsData ?? []).forEach((row: Record<string, unknown>) => {
            const id = row.id as string;
            const en = (cfg.nameField === "title" ? row.title_en : row.name_en) as string;
            const ru = (cfg.nameField === "title" ? row.title_ru : row.name_ru) as
              | string
              | null;
            nameMap.set(`${type}:${id}`, { name_en: en, name_ru: ru ?? null });
          });
        }),
      );

      if (cancelled) return;
      setLinks(
        rows.map((r) => {
          const meta = nameMap.get(`${r.to_type}:${r.to_id}`);
          return { ...r, name_en: meta?.name_en, name_ru: meta?.name_ru ?? null };
        }),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  return { links, loading };
}
