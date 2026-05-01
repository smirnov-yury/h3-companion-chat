import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Save, Loader2, Search } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

interface Hero {
  id: string;
  name_en: string;
  name_ru: string | null;
  sort_order: number | null;
  town: string | null;
  class_en: string | null;
  class_ru: string | null;
  attack: number | null;
  defense: number | null;
  knowledge: number | null;
  power: number | null;
  specialty_en: string | null;
  specialty_ru: string | null;
  biography_en: string | null;
  biography_ru: string | null;
  notes_en: string | null;
  notes_ru: string | null;
  ai_context: string | null;
  ability_id: string | null;
  specialty_levels: unknown;
  image: string | null;
  image_status: string;
}

const EMPTY_FORM = {
  name_en: "",
  name_ru: "",
  sort_order: 0 as number | null,
  town: "",
  class_en: "",
  class_ru: "",
  attack: null as number | null,
  defense: null as number | null,
  knowledge: null as number | null,
  power: null as number | null,
  specialty_en: "",
  specialty_ru: "",
  biography_en: "",
  biography_ru: "",
  notes_en: "",
  notes_ru: "",
  ai_context: "",
  ability_id: "",
  specialty_levels_json: "",
};

const TOWNS = ["", "Castle", "Conflux", "Cove", "Dungeon", "Fortress", "Inferno", "Necropolis", "Neutral", "Rampart", "Stronghold", "Tower"];

const INPUT =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
const TEXTAREA = `${INPUT} resize-y`;

export default function HeroesEditor() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [abilities, setAbilities] = useState<{ id: string; name_en: string }[]>([]);
  const [search, setSearch] = useState("");
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [newId, setNewId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("heroes")
      .select(
        "id, name_en, name_ru, sort_order, town, class_en, class_ru, attack, defense, knowledge, power, specialty_en, specialty_ru, biography_en, biography_ru, notes_en, notes_ru, ai_context, ability_id, specialty_levels, image, image_status",
      )
      .order("sort_order", { ascending: true })
      .then(({ data }) => { setHeroes((data as Hero[]) ?? []); setLoading(false); });
  }, []);

  useEffect(() => {
    supabase
      .from("abilities")
      .select("id, name_en")
      .order("sort_order", { ascending: true })
      .then(({ data }) =>
        setAbilities((data as { id: string; name_en: string }[]) ?? []),
      );
  }, []);

  const filtered = heroes.filter((h) =>
    h.name_en.toLowerCase().includes(search.toLowerCase()),
  );

  const selectHero = (hero: Hero) => {
    setSelectedHero(hero);
    setIsNew(false);
    setError(null);
    setForm({
      name_en: hero.name_en ?? "",
      name_ru: hero.name_ru ?? "",
      sort_order: hero.sort_order,
      town: hero.town ?? "",
      class_en: hero.class_en ?? "",
      class_ru: hero.class_ru ?? "",
      attack: hero.attack,
      defense: hero.defense,
      knowledge: hero.knowledge,
      power: hero.power,
      specialty_en: hero.specialty_en ?? "",
      specialty_ru: hero.specialty_ru ?? "",
      biography_en: hero.biography_en ?? "",
      biography_ru: hero.biography_ru ?? "",
      notes_en: hero.notes_en ?? "",
      notes_ru: hero.notes_ru ?? "",
      ai_context: hero.ai_context ?? "",
      ability_id: hero.ability_id ?? "",
      specialty_levels_json: hero.specialty_levels
        ? JSON.stringify(hero.specialty_levels, null, 2)
        : "",
    });
  };

  const startNew = () => {
    setSelectedHero(null);
    setIsNew(true);
    setNewId("");
    setForm(EMPTY_FORM);
    setError(null);
  };

  const buildPayload = () => {
    let specialty_levels: unknown = null;
    if (form.specialty_levels_json.trim()) {
      try {
        specialty_levels = JSON.parse(form.specialty_levels_json);
      } catch {
        /* keep null */
      }
    }
    return {
      name_en: form.name_en,
      name_ru: form.name_ru || null,
      sort_order: form.sort_order,
      town: form.town || null,
      class_en: form.class_en || null,
      class_ru: form.class_ru || null,
      attack: form.attack,
      defense: form.defense,
      knowledge: form.knowledge,
      power: form.power,
      specialty_en: form.specialty_en || null,
      specialty_ru: form.specialty_ru || null,
      biography_en: form.biography_en || null,
      biography_ru: form.biography_ru || null,
      notes_en: form.notes_en || null,
      notes_ru: form.notes_ru || null,
      ai_context: form.ai_context || null,
      ability_id: form.ability_id || null,
      specialty_levels: specialty_levels as never,
    };
  };

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
        .from("heroes")
        .insert({ id: newId.trim(), ...payload });
      if (e) {
        setError(e.message);
        toast.error(e.message);
      } else {
        const created: Hero = {
          id: newId.trim(),
          ...payload,
          image: null,
          image_status: "pending",
        } as unknown as Hero;
        setHeroes((prev) =>
          [...prev, created].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
          ),
        );
        setSelectedHero(created);
        setIsNew(false);
        toast.success("Saved");
      }
    } else if (selectedHero) {
      const { error: e } = await supabase
        .from("heroes")
        .update(payload)
        .eq("id", selectedHero.id);
      if (e) {
        setError(e.message);
        toast.error(e.message);
      } else {
        setHeroes((prev) =>
          prev
            .map((h) =>
              h.id === selectedHero.id ? ({ ...h, ...payload } as Hero) : h,
            )
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
        );
        setSelectedHero((prev) =>
          prev ? ({ ...prev, ...payload } as Hero) : null,
        );
        toast.success("Saved");
      }
    }
    setSaving(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedHero) return;
    const { error: e } = await supabase
      .from("heroes")
      .delete()
      .eq("id", selectedHero.id);
    if (e) {
      toast.error(e.message);
    } else {
      setHeroes((prev) => prev.filter((h) => h.id !== selectedHero.id));
      setSelectedHero(null);
      setIsNew(false);
      setForm(EMPTY_FORM);
      toast.success("Deleted");
    }
    setDeleteOpen(false);
  };

  const refreshImage = async (id: string) => {
    const { data } = await supabase
      .from("heroes")
      .select("image")
      .eq("id", id)
      .single();
    if (data) {
      const img = (data as { image: string | null }).image;
      setHeroes((prev) =>
        prev.map((h) => (h.id === id ? { ...h, image: img } : h)),
      );
      setSelectedHero((prev) => (prev ? { ...prev, image: img } : null));
    }
  };

  const n = (v: number | null) => (v ?? "") as number | "";
  const setN = (val: string): number | null => (val === "" ? null : Number(val));

  const field = (label: string, node: React.ReactNode) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      {node}
    </div>
  );

  return (
    <div className="flex gap-4 h-full">
      {/* Left list */}
      <div className="w-64 shrink-0 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-border bg-input text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={startNew}
            className="p-1.5 rounded-lg border border-border hover:bg-accent text-foreground"
            title="New hero"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {filtered.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => selectHero(h)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                    selectedHero?.id === h.id
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <p className="font-medium">{h.name_en}</p>
                  <p className="text-[10px] opacity-70">{h.town ?? ""}</p>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 min-w-0">
        {selectedHero || isNew ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {isNew ? "New Hero" : selectedHero?.name_en}
              </h2>
              <div className="flex items-center gap-2">
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
              <div className="flex-1 min-w-0 space-y-4">
                {/* Identity */}
                <div className="grid grid-cols-2 gap-3">
                  {isNew &&
                    field(
                      "ID *",
                      <input
                        value={newId}
                        onChange={(e) => setNewId(e.target.value)}
                        placeholder="e.g. orrin"
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
                    "Town",
                    <select
                      value={form.town ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, town: e.target.value }))
                      }
                      className={INPUT}
                    >
                      {TOWNS.map((t) => (
                        <option key={t} value={t}>
                          {t || "— none —"}
                        </option>
                      ))}
                    </select>,
                  )}
                  {field(
                    "Class EN",
                    <input
                      value={form.class_en ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, class_en: e.target.value }))
                      }
                      className={INPUT}
                    />,
                  )}
                  {field(
                    "Class RU",
                    <input
                      value={form.class_ru ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, class_ru: e.target.value }))
                      }
                      className={INPUT}
                    />,
                  )}
                  {field(
                    "Ability ID",
                    <select
                      value={form.ability_id ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, ability_id: e.target.value }))
                      }
                      className={INPUT}
                    >
                      <option value="">— none —</option>
                      {abilities.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name_en} ({a.id})
                        </option>
                      ))}
                    </select>,
                  )}
                </div>

                {/* Stats */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Stats</p>
                  <div className="grid grid-cols-4 gap-3">
                    {(["attack", "defense", "knowledge", "power"] as const).map(
                      (stat) => (
                        <div key={stat} className="flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground capitalize">
                            {stat}
                          </label>
                          <input
                            type="number"
                            value={n(form[stat])}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                [stat]: setN(e.target.value),
                              }))
                            }
                            className={INPUT}
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Specialty */}
                <div className="grid grid-cols-2 gap-3">
                  {field(
                    "Specialty EN",
                    <input
                      value={form.specialty_en ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          specialty_en: e.target.value,
                        }))
                      }
                      className={INPUT}
                    />,
                  )}
                  {field(
                    "Specialty RU",
                    <input
                      value={form.specialty_ru ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          specialty_ru: e.target.value,
                        }))
                      }
                      className={INPUT}
                    />,
                  )}
                </div>

                {/* Specialty levels */}
                {field(
                  "Specialty Levels (JSON)",
                  <textarea
                    value={form.specialty_levels_json}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        specialty_levels_json: e.target.value,
                      }))
                    }
                    rows={4}
                    className={`font-mono text-xs ${TEXTAREA}`}
                    placeholder='{"1": "...", "2": "..."}'
                  />,
                )}

                {/* Biography */}
                <div className="grid grid-cols-2 gap-3">
                  {field(
                    "Biography EN",
                    <textarea
                      value={form.biography_en ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          biography_en: e.target.value,
                        }))
                      }
                      rows={4}
                      className={TEXTAREA}
                    />,
                  )}
                  {field(
                    "Biography RU",
                    <textarea
                      value={form.biography_ru ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          biography_ru: e.target.value,
                        }))
                      }
                      rows={4}
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
              {!isNew && selectedHero && (
                <div className="shrink-0">
                  <p className="text-xs text-muted-foreground mb-2">Image</p>
                  <ImageUploader
                    table="heroes"
                    recordId={selectedHero.id}
                    folder="heroes"
                    imageField="image"
                    currentImage={selectedHero.image}
                    onUploaded={() => refreshImage(selectedHero.id)}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Select a hero or create new
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
