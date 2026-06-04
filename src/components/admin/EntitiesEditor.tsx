import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Pencil, Save, Loader2, X } from "lucide-react";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";
import ImageUploader from "@/components/admin/ImageUploader";
import PwaBumpButton from "@/components/admin/PwaBumpButton";
import { SUPABASE_URL } from "@/integrations/supabase/client";

const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;

type FieldKind = "text" | "int" | "badge" | "image" | "glyphs" | string;

interface FieldDef {
  key: string;
  kind: FieldKind;
  label_en: string;
  label_ru: string;
  card_slot?: string;
  searchable?: boolean;
}

interface EntityTypeRow {
  type_key: string;
  label_en: string;
  label_ru: string;
  fields: FieldDef[];
}

interface EntityRow {
  id: string;
  type_key: string;
  slug: string;
  name_en: string;
  name_ru: string | null;
  attrs: Record<string, unknown>;
  image: string | null;
  sort_order: number;
}

interface FormState {
  isNew: boolean;
  original: EntityRow | null;
  slug: string;
  name_en: string;
  name_ru: string;
  sort_order: number;
  attrs: Record<string, unknown>;
}

function emptyForm(): FormState {
  return {
    isNew: true,
    original: null,
    slug: "",
    name_en: "",
    name_ru: "",
    sort_order: 0,
    attrs: {},
  };
}

function fromEntity(e: EntityRow): FormState {
  return {
    isNew: false,
    original: e,
    slug: e.slug,
    name_en: e.name_en,
    name_ru: e.name_ru ?? "",
    sort_order: e.sort_order ?? 0,
    attrs: { ...(e.attrs ?? {}) },
  };
}

function cleanAttrs(attrs: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v;
  }
  return out;
}

export default function EntitiesEditor() {
  const qc = useQueryClient();
  const [types, setTypes] = useState<EntityTypeRow[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [entities, setEntities] = useState<EntityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EntityRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["generic_section"] });

  const loadTypes = async () => {
    const { data } = await (supabase.from as any)("entity_types")
      .select("type_key,label_en,label_ru,fields")
      .order("type_key");
    const rows = ((data ?? []) as any[]).map((r) => ({
      ...r,
      fields: Array.isArray(r.fields) ? r.fields : [],
    })) as EntityTypeRow[];
    setTypes(rows);
    if (!selectedKey && rows.length > 0) setSelectedKey(rows[0].type_key);
  };

  const loadEntities = async (tk: string) => {
    if (!tk) { setEntities([]); return; }
    setLoading(true);
    const { data } = await (supabase.from as any)("entities")
      .select("id,type_key,slug,name_en,name_ru,attrs,image,sort_order")
      .eq("type_key", tk)
      .order("sort_order", { ascending: true })
      .order("name_en", { ascending: true });
    setEntities(((data ?? []) as any[]).map((r) => ({
      ...r,
      attrs: r.attrs && typeof r.attrs === "object" ? r.attrs : {},
    })) as EntityRow[]);
    setLoading(false);
  };

  useEffect(() => { loadTypes(); }, []);
  useEffect(() => { loadEntities(selectedKey); }, [selectedKey]);

  const currentType = useMemo(
    () => types.find((t) => t.type_key === selectedKey) ?? null,
    [types, selectedKey],
  );

  const setAttr = (k: string, v: unknown) => {
    setForm((f) => f ? { ...f, attrs: { ...f.attrs, [k]: v } } : f);
  };

  const handleSave = async () => {
    if (!form || !currentType) return;
    setFormError(null);
    const slug = form.slug.trim();
    const name_en = form.name_en.trim();
    if (!name_en) { setFormError("Name (EN) required"); return; }
    if (form.isNew && !slug) { setFormError("Slug required"); return; }

    const attrs = cleanAttrs(form.attrs);
    setSaving(true);

    if (form.isNew) {
      const id = `${currentType.type_key}:${slug}`;
      const { error } = await (supabase.from as any)("entities").insert({
        id,
        type_key: currentType.type_key,
        slug,
        name_en,
        name_ru: form.name_ru.trim() || null,
        attrs,
        sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
      });
      setSaving(false);
      if (error) { setFormError(error.message); return; }
    } else {
      const { error } = await (supabase.from as any)("entities").update({
        name_en,
        name_ru: form.name_ru.trim() || null,
        attrs,
        sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
      }).eq("id", form.original!.id);
      setSaving(false);
      if (error) { setFormError(error.message); return; }
    }
    setForm(null);
    await loadEntities(selectedKey);
    invalidate();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await (supabase.from as any)("entities").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) { return; }
    setDeleteTarget(null);
    await loadEntities(selectedKey);
    invalidate();
  };

  const renderFieldInput = (f: FieldDef) => {
    if (f.kind === "text") {
      return (
        <div key={f.key} className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground">
            {f.label_en} (EN)
            <textarea
              value={String(form?.attrs[`${f.key}_en`] ?? "")}
              onChange={(e) => setAttr(`${f.key}_en`, e.target.value)}
              rows={3}
              className="mt-1 w-full px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            {f.label_en} (RU)
            <textarea
              value={String(form?.attrs[`${f.key}_ru`] ?? "")}
              onChange={(e) => setAttr(`${f.key}_ru`, e.target.value)}
              rows={3}
              className="mt-1 w-full px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
            />
          </label>
        </div>
      );
    }
    if (f.kind === "int") {
      const v = form?.attrs[f.key];
      return (
        <label key={f.key} className="block text-xs text-muted-foreground">
          {f.label_en}
          <input
            type="number"
            value={v === undefined || v === null ? "" : String(v)}
            onChange={(e) => {
              const s = e.target.value;
              if (s === "") setAttr(f.key, "");
              else {
                const n = Number(s);
                setAttr(f.key, Number.isFinite(n) ? n : "");
              }
            }}
            className="mt-1 w-full px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
          />
        </label>
      );
    }
    return (
      <label key={f.key} className="block text-xs text-muted-foreground">
        {f.label_en}
        <input
          type="text"
          value={String(form?.attrs[f.key] ?? "")}
          onChange={(e) => setAttr(f.key, e.target.value)}
          className="mt-1 w-full px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground font-mono"
        />
      </label>
    );
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Content Items</h1>
          <p className="text-sm text-muted-foreground">Edit rows of the generic content store.</p>
        </div>
        <div className="flex items-center gap-2">
          <PwaBumpButton />
          <select
            value={selectedKey}
            onChange={(e) => { setSelectedKey(e.target.value); setForm(null); }}
            className="px-2 py-1.5 rounded border border-border bg-background text-sm"
          >
            {types.map((t) => (
              <option key={t.type_key} value={t.type_key}>
                {t.label_en} ({t.type_key})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!currentType}
            onClick={() => { setForm(emptyForm()); setFormError(null); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add item
          </button>
        </div>
      </div>

      {!currentType ? (
        <div className="text-sm text-muted-foreground">No content types defined.</div>
      ) : loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-2">
          {entities.length === 0 && (
            <div className="text-sm text-muted-foreground">No items yet.</div>
          )}
          {entities.map((e) => {
            const imgUrl = e.image ? `${STORAGE_BASE}/${currentType.type_key}/${e.image}` : null;
            return (
              <div key={e.id} className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
                <div className="w-10 h-14 rounded bg-muted overflow-hidden flex-shrink-0">
                  {imgUrl && <img src={imgUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground truncate">
                    {e.name_en}
                    {e.name_ru ? <span className="text-muted-foreground"> / {e.name_ru}</span> : null}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {e.slug} · sort {e.sort_order}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setForm(fromEntity(e)); setFormError(null); }}
                  className="text-muted-foreground hover:text-foreground"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(e)}
                  className="text-destructive/60 hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {form && currentType && (
        <div className="rounded-md border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {form.isNew ? "New item" : `Edit ${form.original?.id}`}
            </h2>
            <button
              type="button"
              onClick={() => { setForm(null); setFormError(null); }}
              className="text-muted-foreground hover:text-foreground"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="block text-xs text-muted-foreground md:col-span-1">
              Slug
              <input
                type="text"
                value={form.slug}
                readOnly={!form.isNew}
                onChange={(e) => setForm((f) => f ? { ...f, slug: e.target.value.toLowerCase() } : f)}
                className="mt-1 w-full px-2 py-1.5 rounded border border-border bg-background text-sm font-mono text-foreground disabled:opacity-60 read-only:opacity-60"
              />
            </label>
            <label className="block text-xs text-muted-foreground md:col-span-1">
              Sort order
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => f ? { ...f, sort_order: Number(e.target.value) || 0 } : f)}
                className="mt-1 w-full px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
              />
            </label>
            <label className="block text-xs text-muted-foreground md:col-span-1">
              Name (EN)
              <input
                type="text"
                value={form.name_en}
                onChange={(e) => setForm((f) => f ? { ...f, name_en: e.target.value } : f)}
                className="mt-1 w-full px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
              />
            </label>
            <label className="block text-xs text-muted-foreground md:col-span-1">
              Name (RU)
              <input
                type="text"
                value={form.name_ru}
                onChange={(e) => setForm((f) => f ? { ...f, name_ru: e.target.value } : f)}
                className="mt-1 w-full px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
              />
            </label>
          </div>

          <div className="space-y-3">
            {currentType.fields.map((f) => renderFieldInput(f))}
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground mb-2">Image</p>
            {form.isNew || !form.original ? (
              <p className="text-xs text-muted-foreground italic">Save first, then upload an image.</p>
            ) : (
              <ImageUploader
                table="entities"
                recordId={form.original.id}
                folder={currentType.type_key}
                imageField="image"
                currentImage={form.original.image}
                hasImageStatus={false}
                onUploaded={async () => { await loadEntities(selectedKey); invalidate(); }}
                onDeleted={async () => { await loadEntities(selectedKey); invalidate(); }}
              />
            )}
          </div>

          {formError && <div className="text-xs text-destructive">{formError}</div>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {form.isNew ? "Create" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => { setForm(null); setFormError(null); }}
              className="px-3 py-1.5 rounded border border-border text-sm hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
