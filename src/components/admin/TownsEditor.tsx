import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Save, Loader2, Search } from "lucide-react";
import GlyphToolbar from "@/components/admin/GlyphToolbar";
import ImageUploader from "@/components/admin/ImageUploader";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

const INPUT =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
const TEXTAREA = `${INPUT} resize-y font-mono`;
const TEXTAREA_PLAIN = `${INPUT} resize-y`;

interface Town {
  id: string;
  name_en: string | null;
  name_ru: string | null;
  notes_en: string | null;
  notes_ru: string | null;
  image_empty: string | null;
  image_full: string | null;
  image_back: string | null;
  sort_order: number | null;
  image_status: string | null;
}

interface TownForm {
  name_en: string;
  name_ru: string;
  notes_en: string;
  notes_ru: string;
  sort_order: number | null;
}

interface Building {
  id: string;
  town_id: string;
  name_en: string | null;
  name_ru: string | null;
  cost: string | null;
  effect_en: string | null;
  effect_ru: string | null;
  sort_order: number | null;
}

interface BuildingForm {
  name_en: string;
  name_ru: string;
  cost: string;
  effect_en: string;
  effect_ru: string;
  sort_order: number | null;
}

function emptyBuildingForm(): BuildingForm {
  return { name_en: "", name_ru: "", cost: "", effect_en: "", effect_ru: "", sort_order: null };
}

function buildingToForm(b: Building): BuildingForm {
  return {
    name_en: b.name_en ?? "",
    name_ru: b.name_ru ?? "",
    cost: b.cost ?? "",
    effect_en: b.effect_en ?? "",
    effect_ru: b.effect_ru ?? "",
    sort_order: b.sort_order ?? null,
  };
}

function emptyTownForm(): TownForm {
  return { name_en: "", name_ru: "", notes_en: "", notes_ru: "", sort_order: null };
}

function townToForm(t: Town): TownForm {
  return {
    name_en: t.name_en ?? "",
    name_ru: t.name_ru ?? "",
    notes_en: t.notes_en ?? "",
    notes_ru: t.notes_ru ?? "",
    sort_order: t.sort_order ?? null,
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

function BuildingRow({
  building,
  isNew,
  newId,
  onNewIdChange,
  onSave,
  onDelete,
}: {
  building: BuildingForm;
  isNew: boolean;
  newId: string;
  onNewIdChange: (v: string) => void;
  onSave: (form: BuildingForm, id?: string) => void | Promise<void>;
  onDelete: () => void;
}) {
  const [form, setForm] = useState<BuildingForm>(building);
  const [saving, setSaving] = useState(false);
  const costRef = useRef<HTMLTextAreaElement>(null);
  const effEnRef = useRef<HTMLTextAreaElement>(null);
  const effRuRef = useRef<HTMLTextAreaElement>(null);

  const setF = (k: keyof BuildingForm, v: unknown) =>
    setForm((prev) => ({ ...prev, [k]: v as never }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form, isNew ? newId : undefined);
    setSaving(false);
  };

  return (
    <div className="space-y-3 p-3 rounded-lg border border-border bg-card/30">
      <div className="grid grid-cols-2 gap-3">
        {isNew && (
          <FieldLabel text="Building ID *">
            <input
              type="text"
              value={newId}
              onChange={(e) => onNewIdChange(e.target.value)}
              placeholder="e.g. castle_tavern"
              className={INPUT}
            />
          </FieldLabel>
        )}
        <FieldLabel text="Name EN">
          <input type="text" value={form.name_en} onChange={(e) => setF("name_en", e.target.value)} className={INPUT} />
        </FieldLabel>
        <FieldLabel text="Name RU">
          <input type="text" value={form.name_ru} onChange={(e) => setF("name_ru", e.target.value)} className={INPUT} />
        </FieldLabel>
        <FieldLabel text="Sort Order">
          <input
            type="number"
            value={form.sort_order ?? ""}
            onChange={(e) => setF("sort_order", e.target.value ? Number(e.target.value) : null)}
            className={INPUT}
          />
        </FieldLabel>
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">Cost</label>
        <GlyphToolbar textareaRef={costRef} onChange={(v) => setF("cost", v)} />
        <textarea
          ref={costRef}
          value={form.cost}
          onChange={(e) => setF("cost", e.target.value)}
          rows={2}
          className={`mt-1 ${TEXTAREA}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Effect EN</label>
          <GlyphToolbar textareaRef={effEnRef} onChange={(v) => setF("effect_en", v)} />
          <textarea
            ref={effEnRef}
            value={form.effect_en}
            onChange={(e) => setF("effect_en", e.target.value)}
            rows={3}
            className={`mt-1 ${TEXTAREA}`}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Effect RU</label>
          <GlyphToolbar textareaRef={effRuRef} onChange={(v) => setF("effect_ru", v)} />
          <textarea
            ref={effRuRef}
            value={form.effect_ru}
            onChange={(e) => setF("effect_ru", e.target.value)}
            rows={3}
            className={`mt-1 ${TEXTAREA}`}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs hover:bg-destructive/10"
        >
          <Trash2 className="w-3 h-3" /> Delete
        </button>
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
  );
}

export default function TownsEditor() {
  const [towns, setTowns] = useState<Town[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Town | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [newId, setNewId] = useState("");
  const [form, setForm] = useState<TownForm>(emptyTownForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [newBuilding, setNewBuilding] = useState<BuildingForm | null>(null);
  const [newBuildingId, setNewBuildingId] = useState("");

  useEffect(() => {
    supabase
      .from("towns")
      .select("id, name_en, name_ru, notes_en, notes_ru, image_empty, image_full, image_back, sort_order, image_status")
      .order("sort_order", { ascending: true })
      .then(({ data }) => { setTowns((data as Town[]) ?? []); setLoading(false); });
  }, []);

  const fetchBuildings = async (townId: string) => {
    const { data } = await supabase
      .from("town_buildings")
      .select("id, town_id, name_en, name_ru, cost, effect_en, effect_ru, sort_order")
      .eq("town_id", townId)
      .order("sort_order", { ascending: true });
    setBuildings((data as Building[]) ?? []);
  };

  const selectTown = (town: Town) => {
    setSelected(town);
    setIsNew(false);
    setForm(townToForm(town));
    setError(null);
    setNewBuilding(null);
    fetchBuildings(town.id);
  };

  const startNew = () => {
    setSelected(null);
    setIsNew(true);
    setNewId("");
    setForm(emptyTownForm());
    setError(null);
    setBuildings([]);
    setNewBuilding(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const payload = {
      name_en: form.name_en || null,
      name_ru: form.name_ru || null,
      notes_en: form.notes_en || null,
      notes_ru: form.notes_ru || null,
      sort_order: form.sort_order,
    };
    if (isNew) {
      if (!newId.trim()) {
        setError("ID is required");
        setSaving(false);
        return;
      }
      const { error: e } = await supabase.from("towns").insert({ id: newId.trim(), ...payload } as never);
      if (e) {
        setError(e.message);
        toast.error(e.message);
      } else {
        const created: Town = {
          id: newId.trim(),
          ...payload,
          image_empty: null,
          image_full: null,
          image_back: null,
          image_status: null,
        };
        setTowns((prev) =>
          [...prev, created].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
        );
        setSelected(created);
        setIsNew(false);
        fetchBuildings(newId.trim());
        toast.success("Saved");
      }
    } else if (selected) {
      const { error: e } = await supabase.from("towns").update(payload as never).eq("id", selected.id);
      if (e) {
        setError(e.message);
        toast.error(e.message);
      } else {
        setTowns((prev) =>
          prev
            .map((t) => (t.id === selected.id ? { ...t, ...payload } : t))
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
        );
        setSelected((prev) => (prev ? { ...prev, ...payload } : null));
        toast.success("Saved");
      }
    }
    setSaving(false);
  };

  const handleDeleteTown = async () => {
    if (!selected) return;
    const { error: e } = await supabase.from("towns").delete().eq("id", selected.id);
    if (e) {
      toast.error(e.message);
    } else {
      setTowns((prev) => prev.filter((t) => t.id !== selected.id));
      setSelected(null);
      setIsNew(false);
      setBuildings([]);
      toast.success("Deleted");
    }
    setDeleteOpen(false);
  };

  const refreshImages = async (id: string) => {
    const { data } = await supabase
      .from("towns")
      .select("image_empty, image_full, image_back, image_status")
      .eq("id", id)
      .single();
    if (data) {
      const d = data as {
        image_empty: string | null;
        image_full: string | null;
        image_back: string | null;
        image_status: string | null;
      };
      setTowns((prev) => prev.map((t) => (t.id === id ? { ...t, ...d } : t)));
      setSelected((prev) => (prev ? { ...prev, ...d } : null));
    }
  };

  const handleSaveNewBuilding = async (bForm: BuildingForm, idArg?: string) => {
    if (!selected || !idArg || !idArg.trim()) return;
    const payload = {
      name_en: bForm.name_en || null,
      name_ru: bForm.name_ru || null,
      cost: bForm.cost || null,
      effect_en: bForm.effect_en || null,
      effect_ru: bForm.effect_ru || null,
      sort_order: bForm.sort_order,
    };
    const { error: e } = await supabase.from("town_buildings").insert({
      id: idArg.trim(),
      town_id: selected.id,
      ...payload,
    } as never);
    if (!e) {
      setNewBuilding(null);
      setNewBuildingId("");
      fetchBuildings(selected.id);
    }
  };

  const handleSaveExistingBuilding = async (buildingId: string, bForm: BuildingForm) => {
    const payload = {
      name_en: bForm.name_en || null,
      name_ru: bForm.name_ru || null,
      cost: bForm.cost || null,
      effect_en: bForm.effect_en || null,
      effect_ru: bForm.effect_ru || null,
      sort_order: bForm.sort_order,
    };
    const { error: e } = await supabase.from("town_buildings").update(payload as never).eq("id", buildingId);
    if (!e) {
      setBuildings((prev) => prev.map((b) => (b.id === buildingId ? { ...b, ...payload } : b)));
    }
  };

  const handleDeleteBuilding = async (buildingId: string) => {
    const { error: e } = await supabase.from("town_buildings").delete().eq("id", buildingId);
    if (!e) {
      setBuildings((prev) => prev.filter((b) => b.id !== buildingId));
    }
  };

  const setF = (k: keyof TownForm, v: unknown) =>
    setForm((prev) => ({ ...prev, [k]: v as never }));

  const filtered = towns.filter((t) =>
    (t.name_en ?? "").toLowerCase().includes(search.toLowerCase()),
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
            title="New Town"
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
              {filtered.map((town) => (
                <button
                  key={town.id}
                  type="button"
                  onClick={() => selectTown(town)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                    selected?.id === town.id
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <div className="font-medium truncate">{town.name_en ?? town.id}</div>
                  <div className="opacity-60 text-[10px] truncate">{town.id}</div>
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
                {isNew ? "New Town" : selected?.name_en ?? selected?.id ?? ""}
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

            <div className="space-y-4">
              {isNew && (
                <FieldLabel text="ID *">
                  <input
                    type="text"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="e.g. castle"
                    className={INPUT}
                  />
                </FieldLabel>
              )}
              <div className="grid grid-cols-2 gap-3">
                <FieldLabel text="Name EN">
                  <input
                    type="text"
                    value={form.name_en}
                    onChange={(e) => setF("name_en", e.target.value)}
                    className={INPUT}
                  />
                </FieldLabel>
                <FieldLabel text="Name RU">
                  <input
                    type="text"
                    value={form.name_ru}
                    onChange={(e) => setF("name_ru", e.target.value)}
                    className={INPUT}
                  />
                </FieldLabel>
              </div>
              <FieldLabel text="Sort Order">
                <input
                  type="number"
                  value={form.sort_order ?? ""}
                  onChange={(e) =>
                    setF("sort_order", e.target.value ? Number(e.target.value) : null)
                  }
                  className={`${INPUT} w-32`}
                />
              </FieldLabel>
              <div className="grid grid-cols-2 gap-3">
                <FieldLabel text="Notes EN">
                  <textarea
                    value={form.notes_en}
                    onChange={(e) => setF("notes_en", e.target.value)}
                    rows={3}
                    className={TEXTAREA_PLAIN}
                  />
                </FieldLabel>
                <FieldLabel text="Notes RU">
                  <textarea
                    value={form.notes_ru}
                    onChange={(e) => setF("notes_ru", e.target.value)}
                    rows={3}
                    className={TEXTAREA_PLAIN}
                  />
                </FieldLabel>
              </div>
            </div>

            {!isNew && selected && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-3">Images</p>
                <div className="flex gap-6 flex-wrap">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Empty</p>
                    <ImageUploader
                      table="towns"
                      recordId={selected.id}
                      folder="towns"
                      imageField="image_empty"
                      filename={`towns-${selected.id}-empty.webp`}
                      currentImage={selected.image_empty}
                      onUploaded={() => refreshImages(selected.id)}
                      onDeleted={() => refreshImages(selected.id)}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Full</p>
                    <ImageUploader
                      table="towns"
                      recordId={selected.id}
                      folder="towns"
                      imageField="image_full"
                      filename={`towns-${selected.id}-full.webp`}
                      currentImage={selected.image_full}
                      onUploaded={() => refreshImages(selected.id)}
                      onDeleted={() => refreshImages(selected.id)}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Back</p>
                    <ImageUploader
                      table="towns"
                      recordId={selected.id}
                      folder="towns"
                      imageField="image_back"
                      filename={`towns-${selected.id}-back.webp`}
                      currentImage={selected.image_back}
                      onUploaded={() => refreshImages(selected.id)}
                    />
                  </div>
                </div>
              </div>
            )}

            {!isNew && selected && (
              <div>
                <div className="flex items-center justify-between mb-3 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Buildings ({buildings.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setNewBuilding(emptyBuildingForm());
                      setNewBuildingId("");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
                  >
                    <Plus className="w-3 h-3" /> Add Building
                  </button>
                </div>

                <div className="space-y-3">
                  {newBuilding && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">New Building</p>
                      <BuildingRow
                        building={newBuilding}
                        isNew={true}
                        newId={newBuildingId}
                        onNewIdChange={setNewBuildingId}
                        onSave={(f, id) => handleSaveNewBuilding(f, id)}
                        onDelete={() => setNewBuilding(null)}
                      />
                    </div>
                  )}
                  {buildings.map((b) => (
                    <div key={b.id}>
                      <p className="text-xs text-muted-foreground mb-1">
                        {b.name_en ?? b.id} <span className="opacity-50">({b.id})</span>
                      </p>
                      <BuildingRow
                        building={buildingToForm(b)}
                        isNew={false}
                        newId=""
                        onNewIdChange={() => {}}
                        onSave={(f) => handleSaveExistingBuilding(b.id, f)}
                        onDelete={() => handleDeleteBuilding(b.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Select a town or create new</div>
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteOpen}
        onConfirm={handleDeleteTown}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
