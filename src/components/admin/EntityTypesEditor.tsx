import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Save, Loader2,
  ArrowUp, ArrowDown,
} from "lucide-react";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";
import PwaBumpButton from "@/components/admin/PwaBumpButton";

type FieldKind = "text" | "int" | "badge" | "image" | "glyphs";
type CardSlot = "badge" | "stat" | "body";

interface FieldDef {
  key: string;
  kind: FieldKind;
  label_en: string;
  label_ru: string;
  card_slot?: CardSlot;
  searchable?: boolean;
}

interface EntityType {
  type_key: string;
  label_en: string;
  label_ru: string;
  layout_ref: string | null;
  note: string | null;
  fields: FieldDef[];
}

const KINDS: FieldKind[] = ["text", "int", "badge", "image", "glyphs"];
const SLOTS: Array<CardSlot | "none"> = ["none", "badge", "stat", "body"];

function normalizeKey(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

export default function EntityTypesEditor() {
  const qc = useQueryClient();
  const [types, setTypes] = useState<EntityType[]>([]);
  const [layouts, setLayouts] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newEn, setNewEn] = useState("");
  const [newRu, setNewRu] = useState("");
  const [newLayout, setNewLayout] = useState<string>("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["generic_section"] });

  const load = async () => {
    const [t, l] = await Promise.all([
      (supabase.from as any)("entity_types").select("type_key,label_en,label_ru,layout_ref,note,fields").order("type_key"),
      (supabase.from as any)("card_layouts").select("id").order("id"),
    ]);
    setTypes(
      ((t.data ?? []) as any[]).map((r) => ({
        ...r,
        fields: Array.isArray(r.fields) ? r.fields : [],
      })),
    );
    setLayouts(((l.data ?? []) as Array<{ id: string }>).map((r) => r.id));
  };
  useEffect(() => { load(); }, []);

  const updateLocal = (tk: string, patch: Partial<EntityType>) =>
    setTypes((p) => p.map((t) => (t.type_key === tk ? { ...t, ...patch } : t)));

  const updateField = (tk: string, idx: number, patch: Partial<FieldDef>) =>
    setTypes((p) => p.map((t) => {
      if (t.type_key !== tk) return t;
      const fields = t.fields.map((f, i) => (i === idx ? { ...f, ...patch } : f));
      return { ...t, fields };
    }));

  const moveField = (tk: string, idx: number, dir: -1 | 1) =>
    setTypes((p) => p.map((t) => {
      if (t.type_key !== tk) return t;
      const j = idx + dir;
      if (j < 0 || j >= t.fields.length) return t;
      const fields = [...t.fields];
      [fields[idx], fields[j]] = [fields[j], fields[idx]];
      return { ...t, fields };
    }));

  const addField = (tk: string) =>
    updateLocal(tk, {
      fields: [
        ...(types.find((t) => t.type_key === tk)?.fields ?? []),
        { key: "", kind: "text", label_en: "", label_ru: "", card_slot: "body", searchable: false },
      ],
    });

  const removeField = (tk: string, idx: number) => {
    const t = types.find((x) => x.type_key === tk);
    if (!t) return;
    updateLocal(tk, { fields: t.fields.filter((_, i) => i !== idx) });
  };

  const validate = (t: EntityType): string | null => {
    const keys = new Set<string>();
    for (const f of t.fields) {
      if (!f.key.trim()) return "Every field needs a key.";
      if (!/^[a-z][a-z0-9_]*$/.test(f.key)) return `Invalid field key "${f.key}" (lowercase snake_case).`;
      if (keys.has(f.key)) return `Duplicate field key "${f.key}".`;
      keys.add(f.key);
    }
    return null;
  };

  const saveType = async (tk: string) => {
    const t = types.find((x) => x.type_key === tk);
    if (!t) return;
    const err = validate(t);
    if (err) { setErrors((p) => ({ ...p, [tk]: err })); return; }
    setErrors((p) => { const n = { ...p }; delete n[tk]; return n; });
    setSavingKey(tk);
    const fieldsPayload = t.fields.map((f) => {
      const out: FieldDef = {
        key: f.key, kind: f.kind, label_en: f.label_en, label_ru: f.label_ru,
        searchable: !!f.searchable,
      };
      if (f.card_slot) out.card_slot = f.card_slot;
      return out;
    });
    const { error } = await (supabase.from as any)("entity_types").update({
      label_en: t.label_en,
      label_ru: t.label_ru,
      layout_ref: t.layout_ref || null,
      note: t.note || null,
      fields: fieldsPayload,
    }).eq("type_key", tk);
    setSavingKey(null);
    if (error) {
      setErrors((p) => ({ ...p, [tk]: error.message }));
      return;
    }
    await load();
    invalidate();
  };

  const addType = async () => {
    setAddError(null);
    const key = newKey.trim();
    if (!key) { setAddError("type_key required"); return; }
    setAdding(true);
    const { error } = await (supabase.from as any)("entity_types").insert({
      type_key: key,
      label_en: newEn || key,
      label_ru: newRu || newEn || key,
      layout_ref: newLayout || null,
      fields: [],
    });
    setAdding(false);
    if (error) { setAddError(error.message); return; }
    setNewKey(""); setNewEn(""); setNewRu(""); setNewLayout("");
    setShowAdd(false);
    await load();
    invalidate();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const { error } = await (supabase.from as any)("entity_types").delete().eq("type_key", deleteTarget);
    setDeleting(false);
    if (error) {
      const msg = /foreign key|violates|restrict/i.test(error.message)
        ? "This type still has content items - delete them first."
        : error.message;
      setDeleteError(msg);
      return;
    }
    setDeleteTarget(null);
    await load();
    invalidate();
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Content Types</h1>
          <p className="text-sm text-muted-foreground">Define generic content types and their field schemas.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Add content type
        </button>
      </div>

      {showAdd && (
        <div className="rounded-md border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input
              value={newKey}
              onChange={(e) => setNewKey(normalizeKey(e.target.value))}
              placeholder="type_key (e.g. monsters)"
              className="px-2 py-1.5 rounded border border-border bg-background text-sm font-mono"
            />
            <input
              value={newEn}
              onChange={(e) => setNewEn(e.target.value)}
              placeholder="Label EN"
              className="px-2 py-1.5 rounded border border-border bg-background text-sm"
            />
            <input
              value={newRu}
              onChange={(e) => setNewRu(e.target.value)}
              placeholder="Label RU"
              className="px-2 py-1.5 rounded border border-border bg-background text-sm"
            />
            <select
              value={newLayout}
              onChange={(e) => setNewLayout(e.target.value)}
              className="px-2 py-1.5 rounded border border-border bg-background text-sm"
            >
              <option value="">default layout</option>
              {layouts.map((id) => <option key={id} value={id}>{id}</option>)}
            </select>
          </div>
          {addError && <div className="text-xs text-destructive">{addError}</div>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addType}
              disabled={adding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Create
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setAddError(null); }}
              className="px-3 py-1.5 rounded border border-border text-sm hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {types.map((t) => {
          const open = expanded === t.type_key;
          const err = errors[t.type_key];
          return (
            <div key={t.type_key} className="rounded-md border border-border bg-card">
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : t.type_key)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <span className="font-mono text-sm text-foreground">{t.type_key}</span>
                <span className="text-sm text-muted-foreground flex-1 truncate">
                  {t.label_en} / {t.label_ru}
                </span>
                <span className="text-xs text-muted-foreground">layout: {t.layout_ref ?? "—"}</span>
                <span className="text-xs text-muted-foreground">{t.fields.length} fields</span>
                <button
                  type="button"
                  onClick={() => { setDeleteTarget(t.type_key); setDeleteError(null); }}
                  className="text-destructive/60 hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {open && (
                <div className="border-t border-border p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      value={t.label_en}
                      onChange={(e) => updateLocal(t.type_key, { label_en: e.target.value })}
                      placeholder="Label EN"
                      className="px-2 py-1.5 rounded border border-border bg-background text-sm"
                    />
                    <input
                      value={t.label_ru}
                      onChange={(e) => updateLocal(t.type_key, { label_ru: e.target.value })}
                      placeholder="Label RU"
                      className="px-2 py-1.5 rounded border border-border bg-background text-sm"
                    />
                    <select
                      value={t.layout_ref ?? ""}
                      onChange={(e) => updateLocal(t.type_key, { layout_ref: e.target.value || null })}
                      className="px-2 py-1.5 rounded border border-border bg-background text-sm"
                    >
                      <option value="">default</option>
                      {layouts.map((id) => <option key={id} value={id}>{id}</option>)}
                    </select>
                    <input
                      value={t.note ?? ""}
                      onChange={(e) => updateLocal(t.type_key, { note: e.target.value })}
                      placeholder="note (optional)"
                      className="px-2 py-1.5 rounded border border-border bg-background text-sm"
                    />
                  </div>

                  <div className="rounded border border-border overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="text-left px-2 py-1.5">key</th>
                          <th className="text-left px-2 py-1.5">kind</th>
                          <th className="text-left px-2 py-1.5">label EN</th>
                          <th className="text-left px-2 py-1.5">label RU</th>
                          <th className="text-left px-2 py-1.5">slot</th>
                          <th className="text-left px-2 py-1.5">search</th>
                          <th className="px-2 py-1.5"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.fields.map((f, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-2 py-1">
                              <input
                                value={f.key}
                                onChange={(e) => updateField(t.type_key, i, { key: normalizeKey(e.target.value) })}
                                className="w-32 px-1.5 py-1 rounded border border-border bg-background font-mono"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <select
                                value={f.kind}
                                onChange={(e) => updateField(t.type_key, i, { kind: e.target.value as FieldKind })}
                                className="px-1.5 py-1 rounded border border-border bg-background"
                              >
                                {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-1">
                              <input
                                value={f.label_en}
                                onChange={(e) => updateField(t.type_key, i, { label_en: e.target.value })}
                                className="w-full min-w-32 px-1.5 py-1 rounded border border-border bg-background"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                value={f.label_ru}
                                onChange={(e) => updateField(t.type_key, i, { label_ru: e.target.value })}
                                className="w-full min-w-32 px-1.5 py-1 rounded border border-border bg-background"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <select
                                value={f.card_slot ?? "none"}
                                onChange={(e) => {
                                  const v = e.target.value as CardSlot | "none";
                                  updateField(t.type_key, i, { card_slot: v === "none" ? undefined : v });
                                }}
                                className="px-1.5 py-1 rounded border border-border bg-background"
                              >
                                {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={!!f.searchable}
                                onChange={(e) => updateField(t.type_key, i, { searchable: e.target.checked })}
                              />
                            </td>
                            <td className="px-2 py-1">
                              <div className="flex items-center gap-1 justify-end">
                                <button
                                  type="button"
                                  onClick={() => moveField(t.type_key, i, -1)}
                                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                  disabled={i === 0}
                                  title="Move up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveField(t.type_key, i, 1)}
                                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                  disabled={i === t.fields.length - 1}
                                  title="Move down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeField(t.type_key, i)}
                                  className="text-destructive/60 hover:text-destructive"
                                  title="Remove field"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {t.fields.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-2 py-3 text-center text-muted-foreground">No fields yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addField(t.type_key)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add field
                    </button>
                    <div className="flex-1" />
                    {err && <span className="text-xs text-destructive">{err}</span>}
                    <button
                      type="button"
                      onClick={() => saveType(t.type_key)}
                      disabled={savingKey === t.type_key}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
                    >
                      {savingKey === t.type_key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {types.length === 0 && (
          <div className="text-sm text-muted-foreground px-3 py-6 text-center border border-dashed border-border rounded-md">
            No content types yet.
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onClose={() => { setDeleteTarget(null); setDeleteError(null); }}
        onConfirm={handleDelete}
        deleting={deleting}
      />
      {deleteError && (
        <div className="text-xs text-destructive">{deleteError}</div>
      )}
    </div>
  );
}
