import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, Map, MapPin, CalendarDays, Layers, Swords, User, Castle,
  MessageCircle, Wand2, Circle, GraduationCap, type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { navItems } from "@/config/navItems";

export interface NavSection {
  id: string;
  labelRU: string;
  labelEN: string;
  icon: LucideIcon;
}

export const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Map,
  MapPin,
  CalendarDays,
  Layers,
  Swords,
  User,
  Castle,
  MessageCircle,
  Wand2,
  GraduationCap,
};

interface SectionRow {
  id: string;
  label_en: string;
  label_ru: string;
  icon: string | null;
  sort_order: number;
  is_visible: boolean;
  parent_id: string | null;
}

/**
 * Top-level navigation sections, sourced from the `sections` table.
 * Falls back to the hardcoded `navItems` while loading, on error, or if the
 * table returns no usable rows. Guarantees the nav never disappears.
 */
export function useNavSections(): NavSection[] {
  const { data } = useQuery({
    queryKey: ["nav_sections"],
    queryFn: async (): Promise<NavSection[]> => {
      const { data, error } = await supabase
        .from("sections")
        .select("id,label_en,label_ru,icon,sort_order,is_visible,parent_id")
        .is("parent_id", null)
        .eq("is_visible", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as SectionRow[];
      return rows.map<NavSection>((r) => ({
        id: r.id,
        labelRU: r.label_ru,
        labelEN: r.label_en,
        icon: (r.icon && ICON_MAP[r.icon]) || Circle,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!data || data.length === 0) return navItems;
  return data;
}
