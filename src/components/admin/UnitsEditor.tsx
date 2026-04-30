import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Save, Loader2, Search } from "lucide-react";
import GlyphToolbar from "@/components/admin/GlyphToolbar";
import ImageUploader from "@/components/admin/ImageUploader";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

interface Unit {
  id: string;
  name_en: string;
  name_ru: string | null;
  sort_order: number | null;
  tier: string | null;
  town: string | null;
  type: string | null;
  number: string | null;
  slug: string | null;
  attack: number | null;
  defense: number | null;
  health_points: number | null;
  initiative: number | null;
  cost: string | null;
  abilities_en: string | null;
  abilities_ru: string | null;
  errata_en: string | null;
  errata_ru: string | null;
  notes_en: string | null;
  notes_ru: string | null;
  ai_context: string | null;
  image: string | null;
  image_status: string;
}

const EMPTY_FORM = {
  name_en: "",
  name_ru: "",
  sort_order: 0 as number | null,
  tier: "",
  town: "",
  type: "",
  number: "",
  slug: "",
  attack: null as number | null,
  defense: null as number | null,
  health_points: null as number | null,
  initiative: null as number | null,
  cost: "",
  abilities_en: "",
  abilities_ru: "",
  errata_en: "",
  errata_ru: "",
  notes_en: "",
  notes_ru: "",
  ai_context: "",
};

const TIERS = ["", "bronze", "silver", "azure", "golden"];

const INPUT =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
const TEXTAREA = `${INPUT} font-mono resize-y`;

export default function UnitsEditor() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [newId, setNewId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abEnRef = useRef<HTMLTextAreaElement>(null);
  const abRuRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase
      .from("unit_stats")
      .select(
        "id, name_en, name_ru, sort_order, tier, town, type, number, slug, attack, defense, health_points, initiative, cost, abilities_en, abilities_ru, errata_en, errata_ru, notes_en, notes_ru, ai_context, image, image_status",
      )
      .order("sort_order", { ascending: true })
      .then(({ data }) => setUnits((data as Unit[]) ?? []));
  }, []);

  const filtered = units.filter((u) =>
    u.name_en.toLowerCase().includes(search.toLowerCase()),
  );

  const selectUnit = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsNew(false);
    setError(null);
    setForm({
      name_en: unit.name_en ?? "",
      name_ru: unit.name_ru ?? "",
      sort_order: unit.sort_order,
      tier: unit.tier ?? "",
      town: unit.town ?? "",
      type: unit.type ?? "",
      number: unit.number ?? "",
      slug: unit.slug ?? "",
      attack: unit.attack,
      defense: unit.defense,
      health_points: unit.health_points,
      initiative: unit.initiative,
      cost: unit.cost ?? "",
      abilities_en: unit.abilities_en ?? "",
      abilities_ru: unit.abilities_ru ?? "",
      errata_en: unit.errata_en ?? "",
      errata_ru: unit.errata_ru ?? "",
      notes_en: unit.notes_en ?? "",
      notes_ru: unit.notes_ru ?? "",
      ai_context: unit.ai_context ?? "",
    });
  };

  const startNew = () => {
    setSelectedUnit(null);
    setIsNew(true);
    setNewId("");
    setForm(EMPTY_FORM);
    setError(null);
  };

  const buildPayload = () => ({
    name_en: form.name_en,
    name_ru: form.name_ru || null,
    sort_order: form.sort_order,
    tier: form.tier || null,
    town: form.town || null,
    type: form.type || null,
    number: form.number || null,
    slug: form.slug || null,
    attack: form.attack,
    defense: form.defense,
    health_points: form.health_points,
    initiative: form.initiative,
    cost: form.cost || null,
    abilities_en: form.abilities_en || null,
    abilities_ru: form.abilities_ru || null,
    errata_en: form.errata_en || null,
    errata_ru: form.errata_ru || null,
    notes_en: form.notes_en || null,
    notes_ru: form.notes_ru || null,
    ai_context: form.ai_context || null,
  });

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const payload = buildPayload();
    if (isNew) {
      if (!newId.trim()) {
        setError("ID is required");
        setSaving(false);
        return;
      }
      const { error: e } = await supabase
        .from("unit_stats")
        .insert({ id: newId.trim(), ...payload });
      if (e) {
        setError(e.message);
      } else {
        const created: Unit = {
          id: newId.trim(),
          ...payload,
          image: null,
          image_status: "pending",
        } as Unit;
        setUnits((prev) =>
          [...prev, created].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
          ),
        );
        setSelectedUnit(created);
        setIsNew(false);
      }
    } else if (selectedUnit) {
      const { error: e } = await supabase
        .from("unit_stats")
        .update(payload)
        .eq("id", selectedUnit.id);
      if (e) {
        setError(e.message);
      } else {
        setUnits((prev) =>
          prev
            .map((u) => (u.id === selectedUnit.id ? { ...u, ...payload } : u))
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
        );
        setSelectedUnit((prev) => (prev ? { ...prev, ...payload } : null));
      }
    }
    setSaving(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUnit) return;
    const { error: e } = await supabase
      .from("unit_stats")
      .delete()
      .eq("id", selectedUnit.id);
    if (!e) {
      setUnits((prev) => prev.filter((u) => u.id !== selectedUnit.id));
      setSelectedUnit(null);
      setIsNew(false);
      setForm(EMPTY_FORM);
    }
    setDeleteOpen(false);
  };

  const refreshImage = async (id: string) => {
    const { data } = await supabase
      .from("unit_stats")
      .select("image")
      .eq("id", id)
      .single();
    if (data) {
      const img = (data as { image: string | null }).image;
      setUnits((prev) =>
        prev.map((u) => (u.id === id ? { ...u, image: img } : u)),
      );
      setSelectedUnit((prev) => (prev ? { ...prev, image: img } : null));
    }
  };

  const n = (v: number | null) => (v ?? "") as number | string;
  const setN = (val: string): number | null =>
    val === "" ? null : Number(val);

  const field = (label: string, node: React.ReactNode) => (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      {node}
    </div>
  );

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Left list */}
      <div className="w-64 shrink-0 flex flex-col gap-2 border border-border rounded-lg bg-card p-2">
        <div className="flex gap-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search units..."
              className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-border bg-input text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={startNew}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            title="New unit"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {filtered.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => selectUnit(u)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                selectedUnit?.id === u.id
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <div className="font-medium truncate">{u.name_en}</div>
              <div className="text-[10px] opacity-70 truncate">
                {[u.tier, u.town].filter(Boolean).join(" · ")}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 border border-border rounded-lg bg-card p-4 overflow-y-auto">
        {selectedUnit || isNew ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {isNew ? "New Unit" : selectedUnit?.name_en}
              </h2>
              <div className="flex gap-2">
                {!isNew && (
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex gap-4">
              <div className="flex-1 space-y-4">
                {/* Identity */}
                <div className="grid grid-cols-3 gap-3">
                  {isNew &&
                    field(
                      "ID *",
                      <input
                        value={newId}
                        onChange={(e) => setNewId(e.target.value)}
                        placeholder="e.g. angel"
                        className={INPUT}
                      />,
                    )}
                  {field(
                    "Name EN",
                    <input
                      value={form.name_en}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name_en: e.target.value }))
                      }
                      className={INPUT}
                    />,
                  )}
                  {field(
                    "Name RU",
                    <input
                      value={form.name_ru ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name_ru: e.target.value }))
                      }
                      className={INPUT}
                    />,
                  )}
                  {field(
                    "Sort order",
                    <input
                      type="number"
                      value={n(form.sort_order)}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          sort_order: setN(e.target.value),
                        }))
                      }
                      className={INPUT}
                    />,
                  )}
                  {field(
                    "Tier",
                    <select
                      value={form.tier ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, tier: e.target.value }))
                      }
                      className={INPUT}
                    >
                      {TIERS.map((t) => (
                        <option key={t} value={t}>
                          {t || "— none —"}
                        </option>
                      ))}
                    </select>,
                  )}
                  {field(
                    "Town",
                    <input
                      value={form.town ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, town: e.target.value }))
                      }
                      className={INPUT}
                    />,
                  )}
                  {field(
                    "Type",
                    <input
                      value={form.type ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, type: e.target.value }))
                      }
                      className={INPUT}
                    />,
                  )}
                  {field(
                    "Number",
                    <input
                      value={form.number ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, number: e.target.value }))
                      }
                      className={INPUT}
                    />,
                  )}
                  {field(
                    "Slug",
                    <input
                      value={form.slug ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, slug: e.target.value }))
                      }
                      className={INPUT}
                    />,
                  )}
                </div>

                {/* Combat stats */}
                <div className="space-y-2">
                  <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
                    Combat Stats
                  </h3>
                  <div className="grid grid-cols-5 gap-3">
                    {field(
                      "Attack",
                      <input
                        type="number"
                        value={n(form.attack)}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            attack: setN(e.target.value),
                          }))
                        }
                        className={INPUT}
                      />,
                    )}
                    {field(
                      "Defense",
                      <input
                        type="number"
                        value={n(form.defense)}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            defense: setN(e.target.value),
                          }))
                        }
                        className={INPUT}
                      />,
                    )}
                    {field(
                      "Health Points",
                      <input
                        type="number"
                        value={n(form.health_points)}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            health_points: setN(e.target.value),
                          }))
                        }
                        className={INPUT}
                      />,
                    )}
                    {field(
                      "Initiative",
                      <input
                        type="number"
                        value={n(form.initiative)}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            initiative: setN(e.target.value),
                          }))
                        }
                        className={INPUT}
                      />,
                    )}
                    {field(
                      "Cost",
                      <input
                        value={form.cost ?? ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, cost: e.target.value }))
                        }
                        className={INPUT}
                      />,
                    )}
                  </div>
                </div>

                {/* Abilities */}
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Abilities EN
                  </label>
                  <GlyphToolbar
                    textareaRef={abEnRef}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, abilities_en: v }))
                    }
                  />
                  <textarea
                    ref={abEnRef}
                    value={form.abilities_en ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, abilities_en: e.target.value }))
                    }
                    rows={3}
                    className={`mt-1 ${TEXTAREA}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Abilities RU
                  </label>
                  <GlyphToolbar
                    textareaRef={abRuRef}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, abilities_ru: v }))
                    }
                  />
                  <textarea
                    ref={abRuRef}
                    value={form.abilities_ru ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, abilities_ru: e.target.value }))
                    }
                    rows={3}
                    className={`mt-1 ${TEXTAREA}`}
                  />
                </div>

                {/* Errata */}
                <div className="grid grid-cols-2 gap-3">
                  {field(
                    "Errata EN",
                    <textarea
                      value={form.errata_en ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, errata_en: e.target.value }))
                      }
                      rows={3}
                      className={TEXTAREA}
                    />,
                  )}
                  {field(
                    "Errata RU",
                    <textarea
                      value={form.errata_ru ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, errata_ru: e.target.value }))
                      }
                      rows={3}
                      className={TEXTAREA}
                    />,
                  )}
                </div>

                {/* Notes */}
                <div className="grid grid-cols-2 gap-3">
                  {field(
                    "Notes EN",
                    <textarea
                      value={form.notes_en ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, notes_en: e.target.value }))
                      }
                      rows={3}
                      className={TEXTAREA}
                    />,
                  )}
                  {field(
                    "Notes RU",
                    <textarea
                      value={form.notes_ru ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, notes_ru: e.target.value }))
                      }
                      rows={3}
                      className={TEXTAREA}
                    />,
                  )}
                </div>

                {/* AI */}
                {field(
                  "AI Context",
                  <textarea
                    value={form.ai_context ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ai_context: e.target.value }))
                    }
                    rows={3}
                    className={TEXTAREA}
                  />,
                )}
              </div>

              {/* Image */}
              {!isNew && selectedUnit && (
                <div className="shrink-0">
                  <p className="text-xs text-muted-foreground mb-2">Image</p>
                  <ImageUploader
                    table="unit_stats"
                    recordId={selectedUnit.id}
                    folder="units"
                    imageField="image"
                    currentImage={selectedUnit.image}
                    onUploaded={() => refreshImage(selectedUnit.id)}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Select a unit or create new
          </div>
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
