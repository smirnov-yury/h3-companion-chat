import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Save, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

const INPUT =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
const TEXTAREA = `${INPUT} resize-y`;
const CHECKBOX_ROW = "flex items-center gap-2 text-sm text-foreground";

const MODES = ["clash", "cooperative", "alliance", "campaign", "solo"];
const TABS = ["Overview", "Setup Blocks", "Story", "Map Variants", "Timed Events", "AI Setup"] as const;
type Tab = typeof TABS[number];

interface Book {
  id: string;
  title_en: string;
  release_order: number;
}

interface Scenario {
  id: string;
  book_id: string;
  slug: string;
  mode: string;
  campaign_group_en: string | null;
  campaign_group_ru: string | null;
  scenario_number: number | null;
  title_en: string;
  title_ru: string | null;
  summary_en: string | null;
  summary_ru: string | null;
  min_players: number | null;
  max_players: number | null;
  supported_player_counts: number[] | null;
  scenario_length_text_en: string | null;
  scenario_length_text_ru: string | null;
  rounds_min: number | null;
  rounds_max: number | null;
  difficulty_text_en: string | null;
  difficulty_text_ru: string | null;
  difficulty_options: unknown;
  has_map_variants: boolean;
  has_story: boolean;
  has_ai_setup: boolean;
  sort_order: number;
}

type ScenarioForm = Omit<Scenario, "id">;

function emptyForm(books: Book[]): ScenarioForm {
  return {
    book_id: books[0]?.id ?? "",
    slug: "",
    mode: "clash",
    campaign_group_en: null,
    campaign_group_ru: null,
    scenario_number: null,
    title_en: "",
    title_ru: null,
    summary_en: null,
    summary_ru: null,
    min_players: null,
    max_players: null,
    supported_player_counts: null,
    scenario_length_text_en: null,
    scenario_length_text_ru: null,
    rounds_min: null,
    rounds_max: null,
    difficulty_text_en: null,
    difficulty_text_ru: null,
    difficulty_options: null,
    has_map_variants: false,
    has_story: false,
    has_ai_setup: false,
    sort_order: 10,
  };
}

function rowToForm(s: Scenario): ScenarioForm {
  const { id: _id, ...rest } = s;
  return rest;
}

function formToPayload(form: ScenarioForm): Record<string, unknown> {
  return {
    ...form,
    slug: form.slug || null,
    title_en: form.title_en || null,
    campaign_group_en: form.campaign_group_en || null,
    campaign_group_ru: form.campaign_group_ru || null,
    title_ru: form.title_ru || null,
    summary_en: form.summary_en || null,
    summary_ru: form.summary_ru || null,
    scenario_length_text_en: form.scenario_length_text_en || null,
    scenario_length_text_ru: form.scenario_length_text_ru || null,
    difficulty_text_en: form.difficulty_text_en || null,
    difficulty_text_ru: form.difficulty_text_ru || null,
  };
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{text}</div>
      {children}
    </div>
  );
}

export default function ScenariosEditor() {
  const [books, setBooks] = useState<Book[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [bookFilter, setBookFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [newId, setNewId] = useState("");
  const [form, setForm] = useState<ScenarioForm>(() => emptyForm([]));
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  useEffect(() => {
    supabase
      .from("scenario_books")
      .select("id, title_en, release_order")
      .order("release_order", { ascending: true })
      .then(({ data }) => setBooks((data as Book[]) ?? []));

    supabase
      .from("scenarios")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setScenarios((data as unknown as Scenario[]) ?? []));
  }, []);

  const filtered = scenarios.filter((s) => {
    const matchBook = bookFilter ? s.book_id === bookFilter : true;
    const matchSearch = search
      ? s.title_en.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchBook && matchSearch;
  });

  const selectScenario = (s: Scenario) => {
    setSelected(s);
    setIsNew(false);
    setForm(rowToForm(s));
    setActiveTab("Overview");
  };

  const startNew = () => {
    setSelected(null);
    setIsNew(true);
    setNewId("");
    setForm(emptyForm(books));
    setActiveTab("Overview");
  };

  const setF = (key: keyof ScenarioForm, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }) as ScenarioForm);

  const handleSave = async () => {
    setSaving(true);
    const payload = formToPayload(form);
    if (isNew) {
      if (!newId.trim() || !form.title_en) {
        toast.error("ID and Title EN are required");
        setSaving(false);
        return;
      }
      const { error: e } = await supabase
        .from("scenarios")
        .insert({ id: newId.trim(), ...payload } as never);
      if (e) {
        toast.error(e.message);
      } else {
        const created = { id: newId.trim(), ...payload } as unknown as Scenario;
        setScenarios((prev) =>
          [...prev, created].sort((a, b) => a.sort_order - b.sort_order)
        );
        setSelected(created);
        setIsNew(false);
        toast.success("Saved");
      }
    } else if (selected) {
      const { error: e } = await supabase
        .from("scenarios")
        .update(payload as never)
        .eq("id", selected.id);
      if (e) {
        toast.error(e.message);
      } else {
        setScenarios((prev) =>
          prev
            .map((s) => (s.id === selected.id ? ({ ...s, ...payload } as Scenario) : s))
            .sort((a, b) => a.sort_order - b.sort_order)
        );
        setSelected((prev) => (prev ? ({ ...prev, ...payload } as Scenario) : null));
        toast.success("Saved");
      }
    }
    setSaving(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selected) return;
    const { error: e } = await supabase
      .from("scenarios")
      .delete()
      .eq("id", selected.id);
    if (e) {
      toast.error(e.message);
    } else {
      setScenarios((prev) => prev.filter((s) => s.id !== selected.id));
      setSelected(null);
      setIsNew(false);
      toast.success("Deleted");
    }
    setDeleteOpen(false);
  };

  const str = (v: unknown) => ((v as string) ?? "");
  const num = (v: unknown) => (((v as number | null) ?? "") as number | "");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-full">
      {/* Left list */}
      <div className="border border-border rounded-lg bg-card flex flex-col min-h-0">
        <div className="p-2 space-y-2 border-b border-border">
          <select
            value={bookFilter}
            onChange={(e) => setBookFilter(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-2 py-1.5 text-xs text-foreground outline-none"
          >
            <option value="">— all books —</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.title_en}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-border bg-input text-foreground outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button
              type="button"
              onClick={startNew}
              className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
              title="New scenario"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectScenario(s)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                selected?.id === s.id
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <div className="font-medium truncate">{s.title_en}</div>
              <div className="opacity-70 text-[10px] mt-0.5 truncate">{s.mode} · {s.id}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="border border-border rounded-lg bg-card flex flex-col min-h-0">
        {selected || isNew ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
              <h2 className="text-base font-semibold truncate">
                {isNew ? "New Scenario" : (selected?.title_en ?? selected?.id ?? "")}
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
                {activeTab === "Overview" && (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                )}
              </div>
            </div>

            {/* Sub-tabs */}
            {!isNew && (
              <div className="flex items-center gap-1 px-2 border-b border-border overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === "Overview" && (
                <div className="space-y-4">
                  {isNew && (
                    <Label text="ID *">
                      <input
                        type="text"
                        value={newId}
                        onChange={(e) => setNewId(e.target.value)}
                        placeholder="e.g. base-monks-retreat"
                        className={INPUT}
                      />
                    </Label>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Label text="Title EN *">
                      <input type="text" value={str(form.title_en)} onChange={(e) => setF("title_en", e.target.value)} className={INPUT} />
                    </Label>
                    <Label text="Title RU">
                      <input type="text" value={str(form.title_ru)} onChange={(e) => setF("title_ru", e.target.value || null)} className={INPUT} />
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Label text="Book">
                      <select value={form.book_id} onChange={(e) => setF("book_id", e.target.value)} className={INPUT}>
                        {books.map((b) => (
                          <option key={b.id} value={b.id}>{b.title_en}</option>
                        ))}
                      </select>
                    </Label>
                    <Label text="Mode">
                      <select value={form.mode} onChange={(e) => setF("mode", e.target.value)} className={INPUT}>
                        {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </Label>
                    <Label text="Slug">
                      <input type="text" value={str(form.slug)} onChange={(e) => setF("slug", e.target.value || null)} className={INPUT} />
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Label text="Campaign Group EN">
                      <input type="text" value={str(form.campaign_group_en)} onChange={(e) => setF("campaign_group_en", e.target.value || null)} className={INPUT} />
                    </Label>
                    <Label text="Campaign Group RU">
                      <input type="text" value={str(form.campaign_group_ru)} onChange={(e) => setF("campaign_group_ru", e.target.value || null)} className={INPUT} />
                    </Label>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Label text="Scenario #">
                      <input type="number" value={num(form.scenario_number)} onChange={(e) => setF("scenario_number", e.target.value ? Number(e.target.value) : null)} className={INPUT} />
                    </Label>
                    <Label text="Min Players">
                      <input type="number" value={num(form.min_players)} onChange={(e) => setF("min_players", e.target.value ? Number(e.target.value) : null)} className={INPUT} />
                    </Label>
                    <Label text="Max Players">
                      <input type="number" value={num(form.max_players)} onChange={(e) => setF("max_players", e.target.value ? Number(e.target.value) : null)} className={INPUT} />
                    </Label>
                    <Label text="Sort Order">
                      <input type="number" value={num(form.sort_order)} onChange={(e) => setF("sort_order", e.target.value ? Number(e.target.value) : 10)} className={INPUT} />
                    </Label>
                  </div>

                  <Label text="Supported Player Counts (comma-separated)">
                    <input
                      type="text"
                      value={form.supported_player_counts ? form.supported_player_counts.join(",") : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setF(
                          "supported_player_counts",
                          val
                            ? val.split(",").map((v) => parseInt(v.trim())).filter((n) => !isNaN(n))
                            : null
                        );
                      }}
                      className={INPUT}
                      placeholder="e.g. 2,3,4"
                    />
                  </Label>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Label text="Length Text EN">
                      <input type="text" value={str(form.scenario_length_text_en)} onChange={(e) => setF("scenario_length_text_en", e.target.value || null)} className={INPUT} />
                    </Label>
                    <Label text="Length Text RU">
                      <input type="text" value={str(form.scenario_length_text_ru)} onChange={(e) => setF("scenario_length_text_ru", e.target.value || null)} className={INPUT} />
                    </Label>
                    <Label text="Rounds Min">
                      <input type="number" value={num(form.rounds_min)} onChange={(e) => setF("rounds_min", e.target.value ? Number(e.target.value) : null)} className={INPUT} />
                    </Label>
                    <Label text="Rounds Max">
                      <input type="number" value={num(form.rounds_max)} onChange={(e) => setF("rounds_max", e.target.value ? Number(e.target.value) : null)} className={INPUT} />
                    </Label>
                    <Label text="Difficulty EN">
                      <input type="text" value={str(form.difficulty_text_en)} onChange={(e) => setF("difficulty_text_en", e.target.value || null)} className={INPUT} />
                    </Label>
                    <Label text="Difficulty RU">
                      <input type="text" value={str(form.difficulty_text_ru)} onChange={(e) => setF("difficulty_text_ru", e.target.value || null)} className={INPUT} />
                    </Label>
                  </div>

                  <Label text="Summary EN">
                    <textarea value={str(form.summary_en)} onChange={(e) => setF("summary_en", e.target.value || null)} rows={3} className={TEXTAREA} />
                  </Label>
                  <Label text="Summary RU">
                    <textarea value={str(form.summary_ru)} onChange={(e) => setF("summary_ru", e.target.value || null)} rows={3} className={TEXTAREA} />
                  </Label>

                  <Label text="Difficulty Options (JSON)">
                    <textarea
                      value={form.difficulty_options ? JSON.stringify(form.difficulty_options, null, 2) : ""}
                      onChange={(e) => {
                        try {
                          setF("difficulty_options", e.target.value ? JSON.parse(e.target.value) : null);
                        } catch {
                          /* invalid json */
                        }
                      }}
                      rows={4}
                      className={`${TEXTAREA} font-mono text-xs`}
                    />
                  </Label>

                  <div className="flex flex-wrap gap-6 pt-1">
                    <label className={CHECKBOX_ROW}>
                      <input type="checkbox" checked={form.has_map_variants} onChange={(e) => setF("has_map_variants", e.target.checked)} className="rounded border-border" />
                      Has Map Variants
                    </label>
                    <label className={CHECKBOX_ROW}>
                      <input type="checkbox" checked={form.has_story} onChange={(e) => setF("has_story", e.target.checked)} className="rounded border-border" />
                      Has Story
                    </label>
                    <label className={CHECKBOX_ROW}>
                      <input type="checkbox" checked={form.has_ai_setup} onChange={(e) => setF("has_ai_setup", e.target.checked)} className="rounded border-border" />
                      Has AI Setup
                    </label>
                  </div>
                </div>
              )}

              {activeTab !== "Overview" && (
                <div className="text-sm text-muted-foreground">
                  {activeTab} — coming soon
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-8">
            Select a scenario or create new
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
