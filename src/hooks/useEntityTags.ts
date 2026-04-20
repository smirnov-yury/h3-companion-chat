import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EntityTag {
  id: string;
  name_en: string;
  name_ru: string;
  category: string;
}

export function useEntityTags(entityType: string | null | undefined, entityId: string | null | undefined) {
  const [tags, setTags] = useState<EntityTag[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entityType || !entityId) {
      setTags([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("entity_tags")
      .select("tag_id, tags(id, name_en, name_ru, category)")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .then(({ data }) => {
        if (cancelled) return;
        const out: EntityTag[] = [];
        (data ?? []).forEach((row: { tags: EntityTag | EntityTag[] | null }) => {
          const t = row.tags;
          if (!t) return;
          if (Array.isArray(t)) out.push(...t);
          else out.push(t);
        });
        setTags(out);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  return { tags, loading };
}
