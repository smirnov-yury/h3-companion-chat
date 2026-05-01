import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Save, Loader2, Search } from "lucide-react";
import GlyphToolbar from "@/components/admin/GlyphToolbar";
import ImageUploader from "@/components/admin/ImageUploader";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

export type DeckTab = "artifacts" | "spells" | "abilities" | "attributes" | "war-machines";

interface DeckConfig {
  label: string;
  table: string;
  folder: string;
  imageField: string;
  selectCols: string;
}

const CONFIGS: Record<DeckTab, DeckConfig> = {
  artifacts: {
    label: "Artifacts",
    table: "artifacts",
    folder: "artifacts",
    imageField: "image",
    selectCols: "id, name_en, name_ru, quality, description_en, description_ru, effect_en, effect_ru, sort_order, ai_context, image, image_status",
  },
  spells: {
    label: "Spells",
    table: "spells",
    folder: "spells",
    imageField: "image",
    selectCols: "id, name_en, name_ru, level, school, effect_en, effect_ru, notes_en, notes_ru, sort_order, ai_context, image, image_status",
  },
  abilities: {
    label: "Abilities",
    table: "abilities",
    folder: "abilities",
    imageField: "image_regular",
    selectCols: "id, name_en, name_ru, effect_en, effect_ru, effect_empowered_en, effect_empowered_ru, effect_expert_en, effect_expert_ru, notes_en, notes_ru, sort_order, ai_context, image_regular, image_status",
  },
  attributes: {
    label: "Attributes",
    table: "statistics",
    folder: "statistics",
    imageField: "image",
    selectCols: "id, name_en, name_ru, card_type, stat_type, effect_en, effect_ru, effect_en_expert, notes_en, notes_ru, sort_order, image",
  },
  "war-machines": {
    label: "War Machines",
    table: "war_machines",
    folder: "war-machines",
    imageField: "image",
    selectCols: "id, name_en, name_ru, ability_en, ability_ru, cost_blacksmith, cost_trade_post, notes_en, notes_ru, sort_order, image, image_status",
  },
};

const ARTIFACT_QUALITIES = ["", "minor", "major", "relic"];
const SPELL_SCHOOLS = ["", "air", "earth", "fire", "water"];
const SPELL_LEVELS = ["", "1", "2", "3", "4", "5"];

type DeckRow = Record<string, unknown>;

const INPUT = "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
const TEXTAREA = `${INPUT} resize-y font-mono`;
const TEXTAREA_PLAIN = `${INPUT} resize-y`;

function buildEmptyForm(tab: DeckTab): DeckRow {
  const base: DeckRow = {
    name_en: "", name_ru: "", sort_order: 0, notes_en: "", notes_ru: "", ai_context: "",
  };
  if (tab === "artifacts") return { name_en: "", name_ru: "", sort_order: 0 as number | null, ai_context: "", quality: "", description_en: "", description_ru: "", effect_en: "", effect_ru: "" };
  if (tab === "spells") return { ...base, level: "", school: "", effect_en: "", effect_ru: "" };
  if (tab === "abilities") return { ...base, effect_en: "", effect_ru: "", effect_empowered_en: "", effect_empowered_ru: "", effect_expert_en: "", effect_expert_ru: "" };
  if (tab === "attributes") return { ...base, card_type: "", stat_type: "", effect_en: "", effect_ru: "", effect_en_expert: "" };
  return { ...base, ability_en: "", ability_ru: "", cost_blacksmith: "", cost_trade_post: "" };
}

function rowToForm(tab: DeckTab, row: DeckRow): DeckRow {
  const str = (v: unknown) => (v as string) ?? "";
  const num = (v: unknown) => (v as number | null) ?? null;
  const base: DeckRow = {
    name_en: str(row.name_en), name_ru: str(row.name_ru),
    sort_order: num(row.sort_order), notes_en: str(row.notes_en),
    notes_ru: str(row.notes_ru), ai_context: str(row.ai_context),
  };
  if (tab === "artifacts") return { name_en: str(row.name_en), name_ru: str(row.name_ru), sort_order: num(row.sort_order), ai_context: str(row.ai_context), quality: str(row.quality), description_en: str(row.description_en), description_ru: str(row.description_ru), effect_en: str(row.effect_en), effect_ru: str(row.effect_ru) };
  if (tab === "spells") return { ...base, level: str(row.level), school: str(row.school), effect_en: str(row.effect_en), effect_ru: str(row.effect_ru) };
  if (tab === "abilities") return { ...base, effect_en: str(row.effect_en), effect_ru: str(row.effect_ru), effect_empowered_en: str(row.effect_empowered_en), effect_empowered_ru: str(row.effect_empowered_ru), effect_expert_en: str(row.effect_expert_en), effect_expert_ru: str(row.effect_expert_ru) };
  if (tab === "attributes") return { ...base, card_type: str(row.card_type), stat_type: str(row.stat_type), effect_en: str(row.effect_en), effect_ru: str(row.effect_ru), effect_en_expert: str(row.effect_en_expert) };
  return { ...base, ability_en: str(row.ability_en), ability_ru: str(row.ability_ru), cost_blacksmith: str(row.cost_blacksmith), cost_trade_post: str(row.cost_trade_post) };
}

function formToPayload(form: DeckRow): DeckRow {
  const result: DeckRow = {};
  for (const [k, v] of Object.entries(form)) {
    if (typeof v === "string") result[k] = v || null;
    else result[k] = v;
  }
  return result;
}

export default function DecksEditor({ tab }: { tab: DeckTab }) {
  const cfg = CONFIGS[tab];
  const [items, setItems] = useState<DeckRow[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DeckRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [newId, setNewId] = useState("");
  const [form, setForm] = useState<DeckRow>(() => buildEmptyForm(tab));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effEnRef = useRef<HTMLTextAreaElement>(null);
  const effRuRef = useRef<HTMLTextAreaElement>(null);
  const effEmpEnRef = useRef<HTMLTextAreaElement>(null);
  const effEmpRuRef = useRef<HTMLTextAreaElement>(null);
  const effExpEnRef = useRef<HTMLTextAreaElement>(null);
  const effExpRuRef = useRef<HTMLTextAreaElement>(null);

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
      .then(({ data }) => { setItems((data as DeckRow[]) ?? []); setLoading(false); });
  }, [tab, cfg.table, cfg.selectCols]);

  const filtered = items.filter((item) =>
    String(item.name_en ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const selectItem = (item: DeckRow) => {
    setSelected(item);
    setIsNew(false);
    setError(null);
    setForm(rowToForm(tab, item));
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
      if (!newId.trim()) { setError("ID is required"); setSaving(false); return; }
      const { error: e } = await supabase.from(cfg.table as never).insert({ id: newId.trim(), ...payload } as never);
      if (e) { setError(e.message); toast.error(e.message); } else {
        const created: DeckRow = { id: newId.trim(), ...payload, [cfg.imageField]: null, image_status: "pending" };
        setItems((prev) => [...prev, created].sort((a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0)));
        setSelected(created);
        setIsNew(false);
        toast.success("Saved");
      }
    } else if (selected) {
      const { error: e } = await supabase.from(cfg.table as never).update(payload as never).eq("id", selected.id as string);
      if (e) { setError(e.message); toast.error(e.message); } else {
        setItems((prev) =>
          prev.map((item) => item.id === selected.id ? { ...item, ...payload } : item)
            .sort((a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0))
        );
        setSelected((prev) => prev ? { ...prev, ...payload } : null);
        toast.success("Saved");
      }
    }
    setSaving(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selected) return;
    const { error: e } = await supabase.from(cfg.table as never).delete().eq("id", selected.id as string);
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
    const { data } = await supabase.from(cfg.table as never).select(cfg.imageField).eq("id", id).single();
    if (data) {
      const img = (data as DeckRow)[cfg.imageField];
      setItems((prev) => prev.map((item) => item.id === id ? { ...item, [cfg.imageField]: img } : item));
      setSelected((prev) => prev ? { ...prev, [cfg.imageField]: img } : null);
    }
  };

  const f = (key: string) => String(form[key] ?? "");
  const setF = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const label = (text: string, node: React.ReactNode) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{text}</label>
      {node}
    </div>
  );

  const renderSpecificFields = () => {
    if (tab === "artifacts") return (
      <>
        {label("Quality",
          <select value={f("quality")} onChange={(e) => setF("quality", e.target.value)} className={INPUT}>
            {ARTIFACT_QUALITIES.map((q) => <option key={q} value={q}>{q || "— none —"}</option>)}
          </select>
        )}
        <div className="grid grid-cols-2 gap-3">
          {label("Description EN", <textarea value={f("description_en")} onChange={(e) => setF("description_en", e.target.value)} rows={3} className={TEXTAREA_PLAIN} />)}
          {label("Description RU", <textarea value={f("description_ru")} onChange={(e) => setF("description_ru", e.target.value)} rows={3} className={TEXTAREA_PLAIN} />)}
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Effect EN</label>
          <GlyphToolbar textareaRef={effEnRef} onChange={(v) => setF("effect_en", v)} />
          <textarea ref={effEnRef} value={f("effect_en")} onChange={(e) => setF("effect_en", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Effect RU</label>
          <GlyphToolbar textareaRef={effRuRef} onChange={(v) => setF("effect_ru", v)} />
          <textarea ref={effRuRef} value={f("effect_ru")} onChange={(e) => setF("effect_ru", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
        </div>
      </>
    );

    if (tab === "spells") return (
      <>
        <div className="grid grid-cols-2 gap-3">
          {label("Level",
            <select value={f("level")} onChange={(e) => setF("level", e.target.value)} className={INPUT}>
              {SPELL_LEVELS.map((l) => <option key={l} value={l}>{l || "— none —"}</option>)}
            </select>
          )}
          {label("School",
            <select value={f("school")} onChange={(e) => setF("school", e.target.value)} className={INPUT}>
              {SPELL_SCHOOLS.map((s) => <option key={s} value={s}>{s || "— none —"}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Effect EN</label>
          <GlyphToolbar textareaRef={effEnRef} onChange={(v) => setF("effect_en", v)} />
          <textarea ref={effEnRef} value={f("effect_en")} onChange={(e) => setF("effect_en", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Effect RU</label>
          <GlyphToolbar textareaRef={effRuRef} onChange={(v) => setF("effect_ru", v)} />
          <textarea ref={effRuRef} value={f("effect_ru")} onChange={(e) => setF("effect_ru", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
        </div>
      </>
    );

    if (tab === "abilities") return (
      <>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Effect EN</label>
          <GlyphToolbar textareaRef={effEnRef} onChange={(v) => setF("effect_en", v)} />
          <textarea ref={effEnRef} value={f("effect_en")} onChange={(e) => setF("effect_en", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Effect RU</label>
          <GlyphToolbar textareaRef={effRuRef} onChange={(v) => setF("effect_ru", v)} />
          <textarea ref={effRuRef} value={f("effect_ru")} onChange={(e) => setF("effect_ru", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Effect Empowered EN</label>
          <GlyphToolbar textareaRef={effEmpEnRef} onChange={(v) => setF("effect_empowered_en", v)} />
          <textarea ref={effEmpEnRef} value={f("effect_empowered_en")} onChange={(e) => setF("effect_empowered_en", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Effect Empowered RU</label>
          <GlyphToolbar textareaRef={effEmpRuRef} onChange={(v) => setF("effect_empowered_ru", v)} />
          <textarea ref={effEmpRuRef} value={f("effect_empowered_ru")} onChange={(e) => setF("effect_empowered_ru", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Effect Expert EN</label>
          <GlyphToolbar textareaRef={effExpEnRef} onChange={(v) => setF("effect_expert_en", v)} />
          <textarea ref={effExpEnRef} value={f("effect_expert_en")} onChange={(e) => setF("effect_expert_en", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Effect Expert RU</label>
          <GlyphToolbar textareaRef={effExpRuRef} onChange={(v) => setF("effect_expert_ru", v)} />
          <textarea ref={effExpRuRef} value={f("effect_expert_ru")} onChange={(e) => setF("effect_expert_ru", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
        </div>
      </>
    );

    if (tab === "attributes") return (
      <>
        <div className="grid grid-cols-2 gap-3">
          {label("Card Type", <input type="text" value={f("card_type")} onChange={(e) => setF("card_type", e.target.value)} className={INPUT} />)}
          {label("Stat Type", <input type="text" value={f("stat_type")} onChange={(e) => setF("stat_type", e.target.value)} className={INPUT} />)}
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Effect EN</label>
          <GlyphToolbar textareaRef={effEnRef} onChange={(v) => setF("effect_en", v)} />
          <textarea ref={effEnRef} value={f("effect_en")} onChange={(e) => setF("effect_en", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Effect RU</label>
          <GlyphToolbar textareaRef={effRuRef} onChange={(v) => setF("effect_ru", v)} />
          <textarea ref={effRuRef} value={f("effect_ru")} onChange={(e) => setF("effect_ru", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Effect Expert EN</label>
          <GlyphToolbar textareaRef={effExpEnRef} onChange={(v) => setF("effect_en_expert", v)} />
          <textarea ref={effExpEnRef} value={f("effect_en_expert")} onChange={(e) => setF("effect_en_expert", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
        </div>
      </>
    );

    // war-machines
    return (
      <>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Ability EN</label>
          <GlyphToolbar textareaRef={effEnRef} onChange={(v) => setF("ability_en", v)} />
          <textarea ref={effEnRef} value={f("ability_en")} onChange={(e) => setF("ability_en", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Ability RU</label>
          <GlyphToolbar textareaRef={effRuRef} onChange={(v) => setF("ability_ru", v)} />
          <textarea ref={effRuRef} value={f("ability_ru")} onChange={(e) => setF("ability_ru", e.target.value)} rows={3} className={`mt-1 ${TEXTAREA}`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {label("Cost (Blacksmith)", <input type="text" value={f("cost_blacksmith")} onChange={(e) => setF("cost_blacksmith", e.target.value)} className={INPUT} />)}
          {label("Cost (Trade Post)", <input type="text" value={f("cost_trade_post")} onChange={(e) => setF("cost_trade_post", e.target.value)} className={INPUT} />)}
        </div>
      </>
    );
  };

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
          <button type="button" onClick={startNew}
            className="px-2 py-1.5 rounded-lg bg-primary text-primary-foreground" title={`New ${cfg.label}`}>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filtered.map((item) => (
            <button key={item.id as string} type="button" onClick={() => selectItem(item)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                selected?.id === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <div className="font-medium truncate">{String(item.name_en ?? "")}</div>
              <div className="opacity-60 text-[10px] truncate">{item.id as string}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 overflow-y-auto p-4">
        {selected || isNew ? (
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {isNew ? `New ${cfg.label.replace(/s$/, "")}` : String(selected?.name_en ?? selected?.id ?? "")}
              </h2>
              <div className="flex gap-2">
                {!isNew && (
                  <button type="button" onClick={() => setDeleteOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs hover:bg-destructive/10">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                )}
                <button type="button" onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Save
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex gap-4">
              <div className="flex-1 space-y-4">
                {/* Common identity */}
                <div className="grid grid-cols-2 gap-3">
                  {isNew && (
                    <div className="col-span-2">
                      {label("ID *",
                        <input type="text" value={newId} onChange={(e) => setNewId(e.target.value)}
                          placeholder="e.g. fireball" className={INPUT} />
                      )}
                    </div>
                  )}
                  {label("Name EN", <input type="text" value={f("name_en")} onChange={(e) => setF("name_en", e.target.value)} className={INPUT} />)}
                  {label("Name RU", <input type="text" value={f("name_ru")} onChange={(e) => setF("name_ru", e.target.value)} className={INPUT} />)}
                  {label("Sort order",
                    <input type="number" value={(form.sort_order as number | null) ?? ""} onChange={(e) => setF("sort_order", e.target.value ? Number(e.target.value) : null)} className={INPUT} />
                  )}
                </div>

                {/* Tab-specific fields */}
                {renderSpecificFields()}

                {/* Notes */}
                {tab !== "artifacts" && (
                  <div className="grid grid-cols-2 gap-3">
                    {label("Notes EN", <textarea value={f("notes_en")} onChange={(e) => setF("notes_en", e.target.value)} rows={3} className={TEXTAREA_PLAIN} />)}
                    {label("Notes RU", <textarea value={f("notes_ru")} onChange={(e) => setF("notes_ru", e.target.value)} rows={3} className={TEXTAREA_PLAIN} />)}
                  </div>
                )}

                {/* AI */}
                {label("AI Context", <textarea value={f("ai_context")} onChange={(e) => setF("ai_context", e.target.value)} rows={3} className={TEXTAREA_PLAIN} />)}
              </div>

              {/* Image */}
              {!isNew && selected && tab !== "attributes" && (
                <div className="shrink-0">
                  <p className="text-xs text-muted-foreground mb-2">Image</p>
                  <ImageUploader
                    table={cfg.table}
                    recordId={selected.id as string}
                    folder={cfg.folder}
                    imageField={cfg.imageField}
                    currentImage={selected[cfg.imageField] as string | null}
                    onUploaded={() => refreshImage(selected.id as string)}
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
