/**
 * Generates dist/sitemap.xml at build time by fetching public entity tables
 * from Supabase REST API (PostgREST). Called from vite.config.ts via the
 * closeBundle hook.
 *
 * URL conventions match src/config/sectionRegistry.ts.
 *
 * IMPORTANT: do not import @supabase/supabase-js here — it pulls in
 * @supabase/realtime-js which requires native WebSocket support that Node 20
 * does not provide (build would fail in GitHub Actions).
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadEnv } from "vite";

const SITE_URL = "https://h3master.app";

interface UrlEntry {
  loc: string;
  changefreq: string;
  priority: string;
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlXml(u: UrlEntry, lastmod: string): string {
  return [
    "  <url>",
    `    <loc>${escapeXml(u.loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${u.changefreq}</changefreq>`,
    `    <priority>${u.priority}</priority>`,
    "  </url>",
  ].join("\n");
}

async function fetchTable(
  supabaseUrl: string,
  anonKey: string,
  table: string,
  select: string,
): Promise<Array<Record<string, unknown>>> {
  const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  const res = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: "application/json",
      Range: "0-9999",
      "Range-Unit": "items",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supabase ${table}: ${res.status} ${res.statusText} ${body}`);
  }
  return (await res.json()) as Array<Record<string, unknown>>;
}

export async function generateSitemap(outDir: string): Promise<void> {
  const env = loadEnv("production", process.cwd(), "VITE_");
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "[sitemap] Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY — skipping generation.",
    );
    return;
  }

  const lastmod = new Date().toISOString().split("T")[0];
  const urls: UrlEntry[] = [];

  // Static routes
  const staticRoutes: UrlEntry[] = [
    { loc: `${SITE_URL}/`, changefreq: "weekly", priority: "1.0" },
    { loc: `${SITE_URL}/about`, changefreq: "monthly", priority: "0.5" },
    { loc: `${SITE_URL}/donate`, changefreq: "monthly", priority: "0.5" },
    { loc: `${SITE_URL}/privacy`, changefreq: "yearly", priority: "0.3" },
    { loc: `${SITE_URL}/terms`, changefreq: "yearly", priority: "0.3" },
    { loc: `${SITE_URL}/rules`, changefreq: "monthly", priority: "0.9" },
    { loc: `${SITE_URL}/scenarios`, changefreq: "monthly", priority: "0.9" },
    { loc: `${SITE_URL}/heroes`, changefreq: "monthly", priority: "0.9" },
    { loc: `${SITE_URL}/units`, changefreq: "monthly", priority: "0.9" },
    { loc: `${SITE_URL}/towns`, changefreq: "monthly", priority: "0.8" },
    { loc: `${SITE_URL}/map-elements`, changefreq: "monthly", priority: "0.7" },
    { loc: `${SITE_URL}/events`, changefreq: "monthly", priority: "0.7" },
    { loc: `${SITE_URL}/decks`, changefreq: "monthly", priority: "0.8" },
    { loc: `${SITE_URL}/ai`, changefreq: "monthly", priority: "0.6" },
    { loc: `${SITE_URL}/game-setup`, changefreq: "monthly", priority: "0.7" },
    { loc: `${SITE_URL}/how-to-play`, changefreq: "monthly", priority: "0.8" },
  ];
  urls.push(...staticRoutes);

  async function pushEntity(
    table: string,
    select: string,
    builder: (row: Record<string, unknown>) => string | null,
    changefreq: string,
    priority: string,
  ): Promise<void> {
    try {
      const rows = await fetchTable(supabaseUrl!, supabaseAnonKey!, table, select);
      for (const row of rows) {
        const path = builder(row);
        if (path) urls.push({ loc: `${SITE_URL}${path}`, changefreq, priority });
      }
    } catch (err) {
      console.warn(
        `[sitemap] Skipped ${table}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // heroes: /heroes/{town_slug}/{id}
  await pushEntity(
    "heroes",
    "id,town",
    (r) => {
      const id = r.id as string | null;
      const town = r.town as string | null;
      if (!id || !town) return null;
      return `/heroes/${toSlug(town)}/${id}`;
    },
    "monthly",
    "0.7",
  );

  // unit_stats: /units/{town_slug}/{id}
  await pushEntity(
    "unit_stats",
    "id,town",
    (r) => {
      const id = r.id as string | null;
      const town = r.town as string | null;
      if (!id || !town) return null;
      return `/units/${toSlug(town)}/${id}`;
    },
    "monthly",
    "0.7",
  );

  // scenarios: /scenarios/{id}
  await pushEntity(
    "scenarios",
    "id",
    (r) => {
      const id = r.id as string | null;
      return id ? `/scenarios/${id}` : null;
    },
    "monthly",
    "0.8",
  );

  // rules: /rules/{category_slug}/{id}
  await pushEntity(
    "rules",
    "id,category",
    (r) => {
      const id = r.id as string | null;
      const category = r.category as string | null;
      if (!id || !category) return null;
      return `/rules/${toSlug(category)}/${id}`;
    },
    "monthly",
    "0.7",
  );

  // fields (map-elements): /map-elements/{id}
  await pushEntity(
    "fields",
    "id",
    (r) => {
      const id = r.id as string | null;
      return id ? `/map-elements/${id}` : null;
    },
    "monthly",
    "0.6",
  );

  // events: /events/{id}
  await pushEntity(
    "events",
    "id",
    (r) => {
      const id = r.id as string | null;
      return id ? `/events/${id}` : null;
    },
    "monthly",
    "0.6",
  );

  // towns: /towns/{id}
  await pushEntity(
    "towns",
    "id",
    (r) => {
      const id = r.id as string | null;
      return id ? `/towns/${id}` : null;
    },
    "monthly",
    "0.7",
  );

  // decks subtypes
  await pushEntity(
    "artifacts",
    "id",
    (r) => (r.id ? `/decks/artifacts/${r.id as string}` : null),
    "monthly",
    "0.6",
  );

  await pushEntity(
    "spells",
    "id",
    (r) => (r.id ? `/decks/spells/${r.id as string}` : null),
    "monthly",
    "0.6",
  );

  await pushEntity(
    "abilities",
    "id",
    (r) => (r.id ? `/decks/abilities/${r.id as string}` : null),
    "monthly",
    "0.6",
  );

  await pushEntity(
    "war_machines",
    "id",
    (r) => (r.id ? `/decks/warmachines/${r.id as string}` : null),
    "monthly",
    "0.6",
  );

  await pushEntity(
    "statistics",
    "id",
    (r) => (r.id ? `/decks/attributes/${r.id as string}` : null),
    "monthly",
    "0.5",
  );

  // guide sections: /guide/<slug> (visible only)
  await pushEntity(
    "guide_sections",
    "slug,is_visible,sort_order",
    (r) => {
      const slug = r.slug as string | null;
      const visible = r.is_visible as boolean | null;
      if (!slug || visible === false) return null;
      return `/guide/${slug}`;
    },
    "monthly",
    "0.7",
  );


  // De-duplicate
  const seen = new Set<string>();
  const unique = urls.filter((u) => {
    if (seen.has(u.loc)) return false;
    seen.add(u.loc);
    return true;
  });

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    unique.map((u) => urlXml(u, lastmod)).join("\n") +
    "\n</urlset>\n";

  const outPath = resolve(outDir, "sitemap.xml");
  await writeFile(outPath, body, "utf8");
  console.log(`[sitemap] Wrote ${unique.length} URLs to ${outPath}`);
}
