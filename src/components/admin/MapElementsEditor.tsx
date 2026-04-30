import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Save, Loader2, Search } from "lucide-react";
import GlyphToolbar from "@/components/admin/GlyphToolbar";
import ImageUploader from "@/components/admin/ImageUploader";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

const INPUT =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
const TEXTAREA = `${INPUT} resize-y font-mono`;
const TEXTAREA_PLAIN = `${INPUT} resize-y`;

interface Field {
  id: string;
  name_en: string | null;
  name_ru: string | null;
  type_en: string | null;
  type_ru: string | null;
  effect_en: string | null;
  effect_ru: string | null;
  notes_en: string | null;
  notes_ru: string | null;
  image: string | null;
  sort_order: number | null;
  image_status: string | null;
  ai_context: string | null;
}

interface FieldForm {
  name_en: string;
  name_ru: string;
  type_en: string;
  type_ru: string;
  effect_en: string;
  effect_ru: string;
  notes_en: string;
  notes_ru: string;
  ai_context: string;
  sort_order: number | null;
}

function emptyForm(): FieldForm {
  return {
    name_en: "", name_ru: "", type_en: "", type_ru: "",
    effect_en: "", effect_ru: "", notes_en: "", notes_ru: "",
    ai_context: "", sort_order: null,
  };
}

function rowToForm(r: Field): FieldForm {
  return {
    name_en: r.name_en ?? "",
    name_ru: r.name_ru ?? "",
    type_en: r.type_en ?? "",
    type_ru: r.type_ru ?? "",
    effect_en: r.effect_en ?? "",
    effect_ru: r.effect_ru ?? "",
    notes_en: r.notes_en ?? "",
    notes_ru: r.notes_ru ?? "",
    ai_context: r.ai_context ?? "",
    sort_order: r.sort_order ?? null,
  };
}

function FieldLabel({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{text}</label>
      {children}
    </div>
  );
}

export default function MapElementsEditor() {
  const [items, setItems] = useState<Field[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Field | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [newId, setNewId] = useState("");
  const [form, setForm] = useState<FieldForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effEnRef = useRef<HTMLTextAreaElement>(null);
  const effRuRef = useRef<HTMLTextAreaElement>(null);
  const notesEnRef = useRef<HTMLTextAreaElement>(null);
  const notesRuRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase
      .from("fields")
      .select("id, name_en, name_ru, type_en, type_ru, effect_en, effect_ru, notes_en, notes_ru, image, sort_order, image_status, ai_context")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setItems((data as Field[]) ?? []));
  }, []);

  const selectItem = (item: Field) => {
    setSelected(item);
    setIsNew(false);
    setForm(rowToForm(item));
    setError(null);
  };

  const startNew = () => {
    setSelected(null);
    setIsNew(true);
    setNewId("");
    setForm(emptyForm());
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const payload = {
      name_en: form.name_en || null,
      name_ru: form.name_ru || null,
      type_en: form.type_en || null,
      type_ru: form.type_ru || null,
      effect_en: form.effect_en || null,
      effect_ru: form.effect_ru || null,
      notes_en: form.notes_en || null,
      notes_ru: form.notes_ru || null,
      ai_context: form.ai_context || null,
      sort_order: form.sort_order,
    };
    if (isNew) {
      if (!newId.trim()) {
        setError("ID is required");
        setSaving(false);
        return;
      }
      const { error: e } = await supabase.from("fields").insert({ id: newId.trim(), ...payload } as never);
      if (e) {
        setError(e.message);
      } else {
        const created: Field = { id: newId.trim(), ...payload, image: null, image_status: null };
        setItems((prev) =>
          [...prev, created].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
        );
        setSelected(created);
        setIsNew(false);
      }
    } else if (selected) {
      const { error: e } = await supabase.from("fields").update(payload as never).eq("id", selected.id);
      if (e) {
        setError(e.message);
      } else {
        setItems((prev) =>
          prev
            .map((item) => (item.id === selected.id ? { ...item, ...payload } : item))
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
        );
        setSelected((prev) => (prev ? { ...prev, ...payload } : null));
      }
    }
    setSaving(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selected) return;
    const { error: e } = await supabase.from("fields").delete().eq("id", selected.id);
    if (!e) {
      setItems((prev) => prev.filter((item) => item.id !== selected.id));
      setSelected(null);
      setIsNew(false);
      setForm(emptyForm());
    }
    setDeleteOpen(false);
  };

  const refreshImage = async (id: string) => {
    const { data } = await supabase.from("fields").select("image, image_status").eq("id", id).single();
    if (data) {
      const d = data as { image: string | null; image_status: string | null };
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...d } : item)));
      setSelected((prev) => (prev ? { ...prev, ...d } : null));
    }
  };

  const setF = (k: keyof FieldForm, v: unknown) =>
    setForm((prev) => ({ ...prev, [k]: v as never }));

  const filtered = items.filter((item) =>
    (item.name_en ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full gap-0 min-h-0">
      {/* Left list */}
      <div className="w-64 shrink-0 border-r border-border flex flex-col">
        <div className="p-2 border-b border-border flex gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-border bg-input text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={startNew}
            className="px-2 py-1.5 rounded-lg bg-primary text-primary-foreground"
            title="New Map Element"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectItem(item)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                selected?.id === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <div className="font-medium truncate">{item.name_en ?? item.id}</div>
              <div className="opacity-60 text-[10px] truncate">{item.id}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 overflow-y-auto p-4">
        {selected || isNew ? (
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {isNew ? "New Map Element" : selected?.name_en ?? selected?.id ?? ""}
              </h2>
              <div className="flex gap-2">
                {!isNew && (
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Save
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex gap-6">
              <div className="flex-1 space-y-4">
                {isNew && (
                  <FieldLabel text="ID *">
                    <input
                      type="text"
                      value={newId}
                      onChange={(e) => setNewId(e.target.value)}
                      placeholder="e.g. whirlpool"
                      className={INPUT}
                    />
                  </FieldLabel>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <FieldLabel text="Name EN">
                    <input type="text" value={form.name_en} onChange={(e) => setF("name_en", e.target.value)} className={INPUT} />
                  </FieldLabel>
                  <FieldLabel text="Name RU">
                    <input type="text" value={form.name_ru} onChange={(e) => setF("name_ru", e.target.value)} className={INPUT} />
                  </FieldLabel>
                  <FieldLabel text="Type EN">
                    <input type="text" value={form.type_en} onChange={(e) => setF("type_en", e.target.value)} className={INPUT} />
                  </FieldLabel>
                  <FieldLabel text="Type RU">
                    <input type="text" value={form.type_ru} onChange={(e) => setF("type_ru", e.target.value)} className={INPUT} />
                  </FieldLabel>
                </div>
                <FieldLabel text="Sort Order">
                  <input
                    type="number"
                    value={form.sort_order ?? ""}
                    onChange={(e) => setF("sort_order", e.target.value ? Number(e.target.value) : null)}
                    className={`${INPUT} w-32`}
                  />
                </FieldLabel>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Effect EN</label>
                  <GlyphToolbar textareaRef={effEnRef} onChange={(v) => setF("effect_en", v)} />
                  <textarea ref={effEnRef} value={form.effect_en} onChange={(e) => setF("effect_en", e.target.value)} rows={4} className={`mt-1 ${TEXTAREA}`} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Effect RU</label>
                  <GlyphToolbar textareaRef={effRuRef} onChange={(v) => setF("effect_ru", v)} />
                  <textarea ref={effRuRef} value={form.effect_ru} onChange={(e) => setF("effect_ru", e.target.value)} rows={4} className={`mt-1 ${TEXTAREA}`} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Notes EN</label>
                  <GlyphToolbar textareaRef={notesEnRef} onChange={(v) => setF("notes_en", v)} />
                  <textarea ref={notesEnRef} value={form.notes_en} onChange={(e) => setF("notes_en", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Notes RU</label>
                  <GlyphToolbar textareaRef={notesRuRef} onChange={(v) => setF("notes_ru", v)} />
                  <textarea ref={notesRuRef} value={form.notes_ru} onChange={(e) => setF("notes_ru", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
                </div>
                <FieldLabel text="AI Context">
                  <textarea value={form.ai_context} onChange={(e) => setF("ai_context", e.target.value)} rows={2} className={TEXTAREA_PLAIN} />
                </FieldLabel>
              </div>

              {!isNew && selected && (
                <div className="shrink-0">
                  <p className="text-xs text-muted-foreground mb-2">Image</p>
                  <ImageUploader
                    table="fields"
                    recordId={selected.id}
                    folder="fields"
                    imageField="image"
                    currentImage={selected.image}
                    onUploaded={() => refreshImage(selected.id)}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Select a map element or create new</div>
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteOpen}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
