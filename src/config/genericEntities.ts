// NEUTRAL pure module - imports NOTHING (no hooks, components, contexts, supabase client).
// Multi-Game Section 6 increment 1: types + pure helpers for the generic entity store
// (entity_types + entities tables). Text fields store "<key>_en"/"<key>_ru" inside attrs;
// all other kinds store the plain "<key>".

export interface EntityTypeField {
  key: string;
  kind: "text" | "int" | "badge" | "image" | "glyphs" | string;
  label_en: string;
  label_ru: string;
  card_slot?: "badge" | "stat" | "body" | string;
  searchable?: boolean;
}

export interface EntityTypeRow {
  type_key: string;
  label_en: string;
  label_ru: string;
  fields: EntityTypeField[];
  layout_ref: string | null;
}

export interface EntityRow {
  id: string;
  type_key: string;
  slug: string;
  name_en: string;
  name_ru: string | null;
  attrs: Record<string, unknown>;
  image: string | null;
  sort_order: number;
}

export function entityName(e: EntityRow, lang: string): string {
  return (lang === "RU" ? e.name_ru : e.name_en) || e.name_en || e.slug;
}

export function fieldLabel(f: EntityTypeField, lang: string): string {
  return (lang === "RU" ? f.label_ru : f.label_en) || f.label_en || f.key;
}

export function fieldValue(e: EntityRow, f: EntityTypeField, lang: string): string {
  const a = e.attrs ?? {};
  if (f.kind === "text") {
    const v = lang === "RU" ? (a[`${f.key}_ru`] ?? a[`${f.key}_en`]) : a[`${f.key}_en`];
    return v == null ? "" : String(v);
  }
  const v = a[f.key];
  return v == null ? "" : String(v);
}

export function typeFields(t: EntityTypeRow | null | undefined): EntityTypeField[] {
  return t && Array.isArray(t.fields) ? t.fields : [];
}

export function firstFieldBySlot(
  t: EntityTypeRow | null | undefined,
  slot: string,
): EntityTypeField | null {
  return typeFields(t).find((f) => f.card_slot === slot) ?? null;
}
