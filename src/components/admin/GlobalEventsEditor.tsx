import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Save, Loader2, Search } from "lucide-react";
import GlyphToolbar from "@/components/admin/GlyphToolbar";
import ImageUploader from "@/components/admin/ImageUploader";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

export type GlobalEventsTab = "events" | "astrologers";

const INPUT =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
const TEXTAREA = `${INPUT} resize-y font-mono`;
const TEXTAREA_PLAIN = `${INPUT} resize-y`;

type GERow = Record<string, unknown> & {
  id: string;
  name_en?: string | null;
  image?: string | null;
  image_status?: string | null;
  sort_order?: number | null;
};

interface TabConfig {
  label: string;
  table: string;
  folder: string;
  selectCols: string;
}

const CONFIGS: Record<GlobalEventsTab, TabConfig> = {
  events: {
    label: "Events",
    table: "events",
    folder: "events",
    selectCols:
      "id, name_en, name_ru, effect_en, effect_ru, notes_en, notes_ru, image, sort_order, image_status",
  },
  astrologers: {
    label: "Astrologers",
    table: "astrologers_proclaim",
    folder: "astrologers_proclaim",
    selectCols:
      "id, name_en, name_ru, effect_en, effect_ru, description_en, description_ru, notes_en, notes_ru, image, sort_order, image_status",
  },
};

type GEForm = Record<string, string | number | null>;

function buildEmptyForm(tab: GlobalEventsTab): GEForm {
  const base: GEForm = {
    name_en: "",
    name_ru: "",
    effect_en: "",
    effect_ru: "",
    notes_en: "",
    notes_ru: "",
    sort_order: null,
  };
  if (tab === "astrologers") return { ...base, description_en: "", description_ru: "" };
  return base;
}

function rowToForm(tab: GlobalEventsTab, row: GERow): GEForm {
  const str = (v: unknown) => ((v as string) ?? "");
  const base: GEForm = {
    name_en: str(row.name_en),
    name_ru: str(row.name_ru),
    effect_en: str(row.effect_en),
    effect_ru: str(row.effect_ru),
    notes_en: str(row.notes_en),
    notes_ru: str(row.notes_ru),
    sort_order: (row.sort_order as number | null) ?? null,
  };
  if (tab === "astrologers") {
    return {
      ...base,
      description_en: str(row.description_en),
      description_ru: str(row.description_ru),
    };
  }
  return base;
}

function formToPayload(form: GEForm): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(form)) {
    result[k] = typeof v === "string" ? (v || null) : v;
  }
  return result;
}

function FieldLabel({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{text}</label>
      {children}
    </div>
  );
}

export default function GlobalEventsEditor({ tab }: { tab: GlobalEventsTab }) {
  const cfg = CONFIGS[tab];
  const [items, setItems] = useState<GERow[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<GERow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [newId, setNewId] = useState("");
  const [form, setForm] = useState<GEForm>(() => buildEmptyForm(tab));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effEnRef = useRef<HTMLTextAreaElement>(null);
  const effRuRef = useRef<HTMLTextAreaElement>(null);
  const notesEnRef = useRef<HTMLTextAreaElement>(null);
  const notesRuRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setItems([]);
    setSelected(null);
    setIsNew(false);
    setForm(buildEmptyForm(tab));
    setError(null);
    setLoading(true);
    supabase
      .from(cfg.table as never)
      .select(cfg.selectCols)
      .order("sort_order", { ascending: true })
      .then(({ data }) => { setItems(((data as unknown) as GERow[]) ?? []); setLoading(false); });
  }, [tab, cfg.table, cfg.selectCols]);

  const filtered = items.filter((item) =>
    String(item.name_en ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const selectItem = (item: GERow) => {
    setSelected(item);
    setIsNew(false);
    setForm(rowToForm(tab, item));
    setError(null);
  };

  const startNew = () => {
    setSelected(null);
    setIsNew(true);
    setNewId("");
    setForm(buildEmptyForm(tab));
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const payload = formToPayload(form);
    if (isNew) {
      if (!newId.trim()) {
        setError("ID is required");
        setSaving(false);
        return;
      }
      const { error: e } = await supabase
        .from(cfg.table as never)
        .insert({ id: newId.trim(), ...payload } as never);
      if (e) {
        setError(e.message);
        toast.error(e.message);
      } else {
        const created: GERow = { id: newId.trim(), ...payload, image: null, image_status: null };
        setItems((prev) =>
          [...prev, created].sort(
            (a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0),
          ),
        );
        setSelected(created);
        setIsNew(false);
        toast.success("Saved");
      }
    } else if (selected) {
      const { error: e } = await supabase
        .from(cfg.table as never)
        .update(payload as never)
        .eq("id", selected.id);
      if (e) {
        setError(e.message);
        toast.error(e.message);
      } else {
        setItems((prev) =>
          prev
            .map((item) => (item.id === selected.id ? { ...item, ...payload } : item))
            .sort(
              (a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0),
            ),
        );
        setSelected((prev) => (prev ? { ...prev, ...payload } : null));
        toast.success("Saved");
      }
    }
    setSaving(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selected) return;
    const { error: e } = await supabase
      .from(cfg.table as never)
      .delete()
      .eq("id", selected.id);
    if (e) {
      toast.error(e.message);
    } else {
      setItems((prev) => prev.filter((item) => item.id !== selected.id));
      setSelected(null);
      setIsNew(false);
      setForm(buildEmptyForm(tab));
      toast.success("Deleted");
    }
    setDeleteOpen(false);
  };

  const refreshImage = async (id: string) => {
    const { data } = await supabase
      .from(cfg.table as never)
      .select("image, image_status")
      .eq("id", id)
      .single();
    if (data) {
      const d = data as { image: string | null; image_status: string | null };
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...d } : item)));
      setSelected((prev) => (prev ? { ...prev, ...d } : null));
    }
  };

  const f = (key: string) => String(form[key] ?? "");
  const setF = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value as string | number | null }));

  const singular = cfg.label.replace(/s$/, "");

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
            title={`New ${singular}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
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
                  <div className="font-medium truncate">{String(item.name_en ?? item.id)}</div>
                  <div className="opacity-60 text-[10px] truncate">{item.id}</div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 overflow-y-auto p-4">
        {selected || isNew ? (
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {isNew
                  ? `New ${singular}`
                  : String(selected?.name_en ?? selected?.id ?? "")}
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
                      placeholder="e.g. plague"
                      className={INPUT}
                    />
                  </FieldLabel>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <FieldLabel text="Name EN">
                    <input
                      type="text"
                      value={f("name_en")}
                      onChange={(e) => setF("name_en", e.target.value)}
                      className={INPUT}
                    />
                  </FieldLabel>
                  <FieldLabel text="Name RU">
                    <input
                      type="text"
                      value={f("name_ru")}
                      onChange={(e) => setF("name_ru", e.target.value)}
                      className={INPUT}
                    />
                  </FieldLabel>
                </div>
                <FieldLabel text="Sort Order">
                  <input
                    type="number"
                    value={(form.sort_order as number | null) ?? ""}
                    onChange={(e) =>
                      setF("sort_order", e.target.value ? Number(e.target.value) : null)
                    }
                    className={`${INPUT} w-32`}
                  />
                </FieldLabel>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Effect EN</label>
                  <GlyphToolbar textareaRef={effEnRef} onChange={(v) => setF("effect_en", v)} />
                  <textarea
                    ref={effEnRef}
                    value={f("effect_en")}
                    onChange={(e) => setF("effect_en", e.target.value)}
                    rows={4}
                    className={`mt-1 ${TEXTAREA}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Effect RU</label>
                  <GlyphToolbar textareaRef={effRuRef} onChange={(v) => setF("effect_ru", v)} />
                  <textarea
                    ref={effRuRef}
                    value={f("effect_ru")}
                    onChange={(e) => setF("effect_ru", e.target.value)}
                    rows={4}
                    className={`mt-1 ${TEXTAREA}`}
                  />
                </div>

                {tab === "astrologers" && (
                  <div className="grid grid-cols-2 gap-3">
                    <FieldLabel text="Description EN">
                      <textarea
                        value={f("description_en")}
                        onChange={(e) => setF("description_en", e.target.value)}
                        rows={3}
                        className={TEXTAREA_PLAIN}
                      />
                    </FieldLabel>
                    <FieldLabel text="Description RU">
                      <textarea
                        value={f("description_ru")}
                        onChange={(e) => setF("description_ru", e.target.value)}
                        rows={3}
                        className={TEXTAREA_PLAIN}
                      />
                    </FieldLabel>
                  </div>
                )}

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Notes EN</label>
                  <GlyphToolbar textareaRef={notesEnRef} onChange={(v) => setF("notes_en", v)} />
                  <textarea
                    ref={notesEnRef}
                    value={f("notes_en")}
                    onChange={(e) => setF("notes_en", e.target.value)}
                    rows={3}
                    className={`mt-1 ${TEXTAREA}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Notes RU</label>
                  <GlyphToolbar textareaRef={notesRuRef} onChange={(v) => setF("notes_ru", v)} />
                  <textarea
                    ref={notesRuRef}
                    value={f("notes_ru")}
                    onChange={(e) => setF("notes_ru", e.target.value)}
                    rows={3}
                    className={`mt-1 ${TEXTAREA}`}
                  />
                </div>
              </div>

              {!isNew && selected && (
                <div className="shrink-0">
                  <p className="text-xs text-muted-foreground mb-2">Image</p>
                  <ImageUploader
                    table={cfg.table}
                    recordId={selected.id}
                    folder={cfg.folder}
                    imageField="image"
                    currentImage={(selected.image as string | null) ?? null}
                    onUploaded={() => refreshImage(selected.id)}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Select an item or create new</div>
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
