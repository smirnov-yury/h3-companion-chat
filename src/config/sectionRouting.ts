import {
  findSectionBySlug,
  findSectionByTabId,
  DEFAULT_SLUG,
  type SectionDef,
} from "@/config/sectionRegistry";
import type { TabId } from "@/config/navItems";

export interface RoutingSectionRow {
  id: string;
  slug: string;
  parent_id: string | null;
  data_source: string | null;
}
export interface RedirectRow {
  old_slug: string;
  new_slug: string;
}

export interface ResolvedSection extends SectionDef {
  isGeneric: boolean;
}

export interface SectionRouting {
  resolveBySlug: (slug: string | undefined) => {
    def: ResolvedSection;
    redirectTo: string | null;
    notFound: boolean;
  };
  liveSlugForTabId: (tabId: string) => string;
}

function genericDef(row: RoutingSectionRow): ResolvedSection {
  return {
    slug: row.slug,
    tabId: row.id as TabId,
    levels: [],
    table: row.data_source,
    isGeneric: true,
  };
}

function toResolved(def: SectionDef, liveSlug: string): ResolvedSection {
  return { ...def, slug: liveSlug, isGeneric: false };
}

export function buildSectionRouting(
  rows: RoutingSectionRow[],
  redirects: RedirectRow[],
): SectionRouting {
  const topRows = rows.filter((r) => r.parent_id === null);
  const bySlug = new Map(topRows.map((r) => [r.slug, r]));
  const byId = new Map(topRows.map((r) => [r.id, r]));
  const redirectMap = new Map(redirects.map((r) => [r.old_slug, r.new_slug]));

  const resolveLive = (liveSlug: string): ResolvedSection | undefined => {
    const row = bySlug.get(liveSlug);
    if (row) {
      const structural = findSectionByTabId(row.id as TabId);
      return structural ? toResolved(structural, liveSlug) : genericDef(row);
    }
    const fallback = findSectionBySlug(liveSlug);
    return fallback ? toResolved(fallback, fallback.slug) : undefined;
  };

  const resolveBySlug = (slug: string | undefined) => {
    const incoming = slug ?? "";
    const newSlug = redirectMap.get(incoming);
    const liveSlug = newSlug ?? incoming;
    const live = resolveLive(liveSlug);
    const defaultDef = toResolved(findSectionBySlug(DEFAULT_SLUG)!, findSectionBySlug(DEFAULT_SLUG)!.slug);
    const resolved = live ?? defaultDef;
    const redirectTo = newSlug && newSlug !== incoming ? newSlug : null;
    const notFound = !live && !newSlug && incoming !== "";
    return { def: resolved, redirectTo, notFound };
  };

  const liveSlugForTabId = (tabId: string): string => {
    const row = byId.get(tabId);
    if (row) return row.slug;
    const def = findSectionByTabId(tabId as TabId);
    return def ? def.slug : tabId;
  };

  return { resolveBySlug, liveSlugForTabId };
}
