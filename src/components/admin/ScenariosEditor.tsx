import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Save, Loader2, Search, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";
import ImageUploader from "@/components/admin/ImageUploader";

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

// ── child table types ──────────────────────────────────────────────────────

interface SetupBlock {
  id: number; scenario_id: string; player_count: number | null;
  block_type: string; title_en: string | null; title_ru: string | null;
  content_en: string | null; content_ru: string | null;
  structured_data: unknown; sort_order: number;
}

interface StorySection {
  id: number; scenario_id: string; section_key: string;
  title_en: string; title_ru: string | null;
  trigger_text_en: string | null; trigger_text_ru: string | null;
  content_en: string; content_ru: string | null; sort_order: number;
}

interface MapVariant {
  id: number; scenario_id: string; player_count: number;
  variant_label_en: string | null; variant_label_ru: string | null;
  map_setup_text_en: string | null; map_setup_text_ru: string | null;
  tile_counts: unknown; layout_schema: unknown;
  layout_notes_en: string | null; layout_notes_ru: string | null;
  source_page: number | null; map_image: string | null; sort_order: number;
}

interface TimedEvent {
  id: number; scenario_id: string; player_count: number | null;
  trigger_type: string; trigger_round: number | null;
  trigger_label_en: string | null; trigger_label_ru: string | null;
  condition_en: string | null; condition_ru: string | null;
  effect_en: string; effect_ru: string | null; sort_order: number;
}

interface AISetup {
  id: number; scenario_id: string;
  ai_faction_en: string | null; ai_faction_ru: string | null;
  enemy_heroes_en: unknown; enemy_heroes_ru: unknown;
  enemy_armies_en: unknown; enemy_armies_ru: unknown;
  enemy_decks_en: unknown; enemy_decks_ru: unknown;
  enemy_spell_deck_en: unknown; enemy_spell_deck_ru: unknown;
  special_setup_en: string | null; special_setup_ru: string | null;
  notes_en: string | null; notes_ru: string | null;
}

// ── shared child styles ────────────────────────────────────────────────────

const CI = "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
const CT = `${CI} resize-y`;
const CJ = `${CT} font-mono text-xs`;

function CLabel({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{text}</label>
      {children}
    </div>
  );
}

function jsonStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  return JSON.stringify(v, null, 2);
}

function parseJson(s: string): unknown {
  if (!s.trim()) return null;
  try { return JSON.parse(s); } catch { return s; }
}

// ── Setup Blocks tab ───────────────────────────────────────────────────────

function SetupBlockRow({
  block,
  onSave,
  onDelete,
}: {
  block: SetupBlock;
  onSave: (id: number, payload: Partial<SetupBlock>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...block });
  const [saving, setSaving] = useState(false);

  const setF = (k: keyof SetupBlock, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    await onSave(block.id, {
      player_count: form.player_count,
      block_type: form.block_type,
      title_en: form.title_en || null,
      title_ru: form.title_ru || null,
      content_en: form.content_en || null,
      content_ru: form.content_ru || null,
      structured_data: form.structured_data,
      sort_order: form.sort_order,
    });
    setSaving(false);
    setOpen(false);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex-1 flex items-center gap-2 text-left">
          {open ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
          <span className="text-xs font-medium truncate">{form.block_type || "block"} · {form.title_en || "—"}</span>
          {form.player_count && <span className="text-[10px] text-muted-foreground">({form.player_count}p)</span>}
        </button>
        <button type="button" onClick={() => onDelete(block.id)} className="text-destructive hover:text-destructive/80">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <CLabel text="Block Type">
              <select value={form.block_type} onChange={(e) => setF("block_type", e.target.value)} className={CI}>
                <option value="player_setup">player_setup</option>
                <option value="map_setup_text">map_setup_text</option>
                <option value="starting_resources">starting_resources</option>
                <option value="player_income">player_income</option>
                <option value="starting_buildings">starting_buildings</option>
                <option value="starting_units">starting_units</option>
                <option value="bonus">bonus</option>
                <option value="additional_rules">additional_rules</option>
                <option value="victory_conditions">victory_conditions</option>
                <option value="lose_conditions">lose_conditions</option>
                <option value="round_tracker">round_tracker</option>
                <option value="heroes_placement">heroes_placement</option>
                <option value="special_notes">special_notes</option>
              </select>
            </CLabel>
            <CLabel text="Player Count">
              <input type="number" value={form.player_count ?? ""} onChange={(e) => setF("player_count", e.target.value ? Number(e.target.value) : null)} className={CI} />
            </CLabel>
            <CLabel text="Sort Order">
              <input type="number" value={form.sort_order} onChange={(e) => setF("sort_order", Number(e.target.value))} className={CI} />
            </CLabel>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <CLabel text="Title EN"><input type="text" value={form.title_en ?? ""} onChange={(e) => setF("title_en", e.target.value || null)} className={CI} /></CLabel>
            <CLabel text="Title RU"><input type="text" value={form.title_ru ?? ""} onChange={(e) => setF("title_ru", e.target.value || null)} className={CI} /></CLabel>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <CLabel text="Content EN"><textarea value={form.content_en ?? ""} onChange={(e) => setF("content_en", e.target.value || null)} rows={4} className={CT} /></CLabel>
            <CLabel text="Content RU"><textarea value={form.content_ru ?? ""} onChange={(e) => setF("content_ru", e.target.value || null)} rows={4} className={CT} /></CLabel>
          </div>
          <CLabel text="Structured Data (JSON)">
            <textarea value={jsonStr(form.structured_data)} onChange={(e) => setF("structured_data", parseJson(e.target.value))} rows={3} className={CJ} />
          </CLabel>
          <div className="flex justify-end">
            <button type="button" onClick={save} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SetupBlocksTab({ scenarioId }: { scenarioId: string }) {
  const [rows, setRows] = useState<SetupBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.from("scenario_setup_blocks" as never).select("*").eq("scenario_id", scenarioId).order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) toast.error("Load error: " + error.message);
        setRows((data as SetupBlock[]) ?? []);
        setLoading(false);
      });
  }, [scenarioId]);

  const addRow = async () => {
    const { data, error } = await supabase.from("scenario_setup_blocks" as never)
      .insert({ scenario_id: scenarioId, block_type: "additional_rules", sort_order: (rows.length + 1) * 10 } as never)
      .select().single();
    if (error) toast.error(error.message);
    else if (data) setRows((p) => [...p, data as SetupBlock]);
  };

  const saveRow = async (id: number, payload: Partial<SetupBlock>) => {
    const { error } = await supabase.from("scenario_setup_blocks" as never).update(payload as never).eq("id", id);
    if (!error) { setRows((p) => p.map((r) => r.id === id ? { ...r, ...payload } : r)); toast.success("Saved"); }
    else toast.error(error.message);
  };

  const deleteRow = async (id: number) => {
    const { error } = await supabase.from("scenario_setup_blocks" as never).delete().eq("id", id);
    if (!error) { setRows((p) => p.filter((r) => r.id !== id)); toast.success("Deleted"); }
    else toast.error(error.message);
  };

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button type="button" onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
          <Plus className="w-3 h-3" /> Add Block
        </button>
      </div>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">No setup blocks.</p>}
      {rows.map((r) => <SetupBlockRow key={r.id} block={r} onSave={saveRow} onDelete={deleteRow} />)}
    </div>
  );
}

// ── Story Sections tab ─────────────────────────────────────────────────────

function StorySectionRow({
  section,
  onSave,
  onDelete,
}: {
  section: StorySection;
  onSave: (id: number, payload: Partial<StorySection>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...section });
  const [saving, setSaving] = useState(false);
  const setF = (k: keyof StorySection, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    await onSave(section.id, {
      section_key: form.section_key,
      title_en: form.title_en,
      title_ru: form.title_ru || null,
      trigger_text_en: form.trigger_text_en || null,
      trigger_text_ru: form.trigger_text_ru || null,
      content_en: form.content_en,
      content_ru: form.content_ru || null,
      sort_order: form.sort_order,
    });
    setSaving(false);
    setOpen(false);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex-1 flex items-center gap-2 text-left">
          {open ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
          <span className="text-xs font-medium truncate">{form.section_key} · {form.title_en || "—"}</span>
        </button>
        <button type="button" onClick={() => onDelete(section.id)} className="text-destructive hover:text-destructive/80">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <CLabel text="Section Key"><input type="text" value={form.section_key} onChange={(e) => setF("section_key", e.target.value)} className={CI} /></CLabel>
            <CLabel text="Title EN"><input type="text" value={form.title_en} onChange={(e) => setF("title_en", e.target.value)} className={CI} /></CLabel>
            <CLabel text="Sort Order"><input type="number" value={form.sort_order} onChange={(e) => setF("sort_order", Number(e.target.value))} className={CI} /></CLabel>
          </div>
          <CLabel text="Title RU"><input type="text" value={form.title_ru ?? ""} onChange={(e) => setF("title_ru", e.target.value || null)} className={CI} /></CLabel>
          <div className="grid grid-cols-2 gap-2">
            <CLabel text="Trigger EN"><textarea value={form.trigger_text_en ?? ""} onChange={(e) => setF("trigger_text_en", e.target.value || null)} rows={2} className={CT} /></CLabel>
            <CLabel text="Trigger RU"><textarea value={form.trigger_text_ru ?? ""} onChange={(e) => setF("trigger_text_ru", e.target.value || null)} rows={2} className={CT} /></CLabel>
            <CLabel text="Content EN"><textarea value={form.content_en} onChange={(e) => setF("content_en", e.target.value)} rows={5} className={CT} /></CLabel>
            <CLabel text="Content RU"><textarea value={form.content_ru ?? ""} onChange={(e) => setF("content_ru", e.target.value || null)} rows={5} className={CT} /></CLabel>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={save} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StoryTab({ scenarioId }: { scenarioId: string }) {
  const [rows, setRows] = useState<StorySection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.from("scenario_story_sections" as never).select("*").eq("scenario_id", scenarioId).order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) toast.error("Load error: " + error.message);
        setRows((data as StorySection[]) ?? []);
        setLoading(false);
      });
  }, [scenarioId]);

  const addRow = async () => {
    const { data, error } = await supabase.from("scenario_story_sections" as never)
      .insert({ scenario_id: scenarioId, section_key: "new", title_en: "New Section", content_en: "", sort_order: (rows.length + 1) * 10 } as never)
      .select().single();
    if (error) toast.error(error.message);
    else if (data) setRows((p) => [...p, data as StorySection]);
  };

  const saveRow = async (id: number, payload: Partial<StorySection>) => {
    const { error } = await supabase.from("scenario_story_sections" as never).update(payload as never).eq("id", id);
    if (!error) { setRows((p) => p.map((r) => r.id === id ? { ...r, ...payload } : r)); toast.success("Saved"); }
    else toast.error(error.message);
  };

  const deleteRow = async (id: number) => {
    const { error } = await supabase.from("scenario_story_sections" as never).delete().eq("id", id);
    if (!error) { setRows((p) => p.filter((r) => r.id !== id)); toast.success("Deleted"); }
    else toast.error(error.message);
  };

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button type="button" onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
          <Plus className="w-3 h-3" /> Add Section
        </button>
      </div>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">No story sections.</p>}
      {rows.map((r) => <StorySectionRow key={r.id} section={r} onSave={saveRow} onDelete={deleteRow} />)}
    </div>
  );
}

// ── Map Variants tab ───────────────────────────────────────────────────────

function MapVariantRow({
  variant,
  onSave,
  onDelete,
}: {
  variant: MapVariant;
  onSave: (id: number, payload: Partial<MapVariant>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...variant });
  const [saving, setSaving] = useState(false);
  const setF = (k: keyof MapVariant, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    await onSave(variant.id, {
      player_count: form.player_count,
      variant_label_en: form.variant_label_en || null,
      variant_label_ru: form.variant_label_ru || null,
      map_setup_text_en: form.map_setup_text_en || null,
      map_setup_text_ru: form.map_setup_text_ru || null,
      tile_counts: form.tile_counts,
      layout_schema: form.layout_schema,
      layout_notes_en: form.layout_notes_en || null,
      layout_notes_ru: form.layout_notes_ru || null,
      source_page: form.source_page,
      sort_order: form.sort_order,
      map_image: form.map_image,
    });
    setSaving(false);
    setOpen(false);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex-1 flex items-center gap-2 text-left">
          {open ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
          <span className="text-xs font-medium truncate">{form.player_count}p · {form.variant_label_en || "variant"}</span>
        </button>
        <button type="button" onClick={() => onDelete(variant.id)} className="text-destructive hover:text-destructive/80">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <CLabel text="Player Count"><input type="number" value={form.player_count} onChange={(e) => setF("player_count", Number(e.target.value))} className={CI} /></CLabel>
            <CLabel text="Source Page"><input type="number" value={form.source_page ?? ""} onChange={(e) => setF("source_page", e.target.value ? Number(e.target.value) : null)} className={CI} /></CLabel>
            <CLabel text="Sort Order"><input type="number" value={form.sort_order} onChange={(e) => setF("sort_order", Number(e.target.value))} className={CI} /></CLabel>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <CLabel text="Label EN"><input type="text" value={form.variant_label_en ?? ""} onChange={(e) => setF("variant_label_en", e.target.value || null)} className={CI} /></CLabel>
            <CLabel text="Label RU"><input type="text" value={form.variant_label_ru ?? ""} onChange={(e) => setF("variant_label_ru", e.target.value || null)} className={CI} /></CLabel>
            <CLabel text="Map Setup EN"><textarea value={form.map_setup_text_en ?? ""} onChange={(e) => setF("map_setup_text_en", e.target.value || null)} rows={3} className={CT} /></CLabel>
            <CLabel text="Map Setup RU"><textarea value={form.map_setup_text_ru ?? ""} onChange={(e) => setF("map_setup_text_ru", e.target.value || null)} rows={3} className={CT} /></CLabel>
            <CLabel text="Layout Notes EN"><textarea value={form.layout_notes_en ?? ""} onChange={(e) => setF("layout_notes_en", e.target.value || null)} rows={3} className={CT} /></CLabel>
            <CLabel text="Layout Notes RU"><textarea value={form.layout_notes_ru ?? ""} onChange={(e) => setF("layout_notes_ru", e.target.value || null)} rows={3} className={CT} /></CLabel>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <CLabel text="Tile Counts (JSON)"><textarea value={jsonStr(form.tile_counts)} onChange={(e) => setF("tile_counts", parseJson(e.target.value))} rows={4} className={CJ} /></CLabel>
            <CLabel text="Layout Schema (JSON)"><textarea value={jsonStr(form.layout_schema)} onChange={(e) => setF("layout_schema", parseJson(e.target.value))} rows={4} className={CJ} /></CLabel>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={save} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
            </button>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Map Image</p>
            {form.map_image && (
              <img
                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/component-media/scenario-maps/${form.map_image}`}
                alt="map"
                className="w-full max-h-48 object-contain rounded-lg border border-border mb-2"
              />
            )}
            <ImageUploader
              table="scenario_map_variants"
              recordId={String(variant.id)}
              folder="scenario-maps"
              imageField="map_image"
              currentImage={form.map_image ?? null}
              defaultCropPreset="free"
              hasImageStatus={false}
              onUploaded={() => setF("map_image", `${variant.id}.webp`)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MapVariantsTab({ scenarioId }: { scenarioId: string }) {
  const [rows, setRows] = useState<MapVariant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.from("scenario_map_variants" as never).select("*").eq("scenario_id", scenarioId).order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) toast.error("Load error: " + error.message);
        setRows((data as MapVariant[]) ?? []);
        setLoading(false);
      });
  }, [scenarioId]);

  const addRow = async () => {
    const { data, error } = await supabase.from("scenario_map_variants" as never)
      .insert({ scenario_id: scenarioId, player_count: 2, tile_counts: {}, sort_order: (rows.length + 1) * 10 } as never)
      .select().single();
    if (error) toast.error(error.message);
    else if (data) setRows((p) => [...p, data as MapVariant]);
  };

  const saveRow = async (id: number, payload: Partial<MapVariant>) => {
    const { error } = await supabase.from("scenario_map_variants" as never).update(payload as never).eq("id", id);
    if (!error) { setRows((p) => p.map((r) => r.id === id ? { ...r, ...payload } : r)); toast.success("Saved"); }
    else toast.error(error.message);
  };

  const deleteRow = async (id: number) => {
    const { error } = await supabase.from("scenario_map_variants" as never).delete().eq("id", id);
    if (!error) { setRows((p) => p.filter((r) => r.id !== id)); toast.success("Deleted"); }
    else toast.error(error.message);
  };

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button type="button" onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
          <Plus className="w-3 h-3" /> Add Variant
        </button>
      </div>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">No map variants.</p>}
      {rows.map((r) => <MapVariantRow key={r.id} variant={r} onSave={saveRow} onDelete={deleteRow} />)}
    </div>
  );
}

// ── Timed Events tab ───────────────────────────────────────────────────────

function TimedEventRow({
  event,
  onSave,
  onDelete,
}: {
  event: TimedEvent;
  onSave: (id: number, payload: Partial<TimedEvent>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...event });
  const [saving, setSaving] = useState(false);
  const setF = (k: keyof TimedEvent, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    await onSave(event.id, {
      player_count: form.player_count,
      trigger_type: form.trigger_type,
      trigger_round: form.trigger_round,
      trigger_label_en: form.trigger_label_en || null,
      trigger_label_ru: form.trigger_label_ru || null,
      condition_en: form.condition_en || null,
      condition_ru: form.condition_ru || null,
      effect_en: form.effect_en,
      effect_ru: form.effect_ru || null,
      sort_order: form.sort_order,
    });
    setSaving(false);
    setOpen(false);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex-1 flex items-center gap-2 text-left">
          {open ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
          <span className="text-xs font-medium truncate">
            {form.trigger_type}{form.trigger_round ? ` R${form.trigger_round}` : ""} · {form.effect_en?.slice(0, 50) || "—"}
          </span>
          {form.player_count && <span className="text-[10px] text-muted-foreground">({form.player_count}p)</span>}
        </button>
        <button type="button" onClick={() => onDelete(event.id)} className="text-destructive hover:text-destructive/80">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <CLabel text="Trigger Type">
              <select value={form.trigger_type} onChange={(e) => setF("trigger_type", e.target.value)} className={CI}>
                <option value="round_start">round_start</option>
                <option value="round_end">round_end</option>
                <option value="on_discover_tile">on_discover_tile</option>
                <option value="on_visit_field">on_visit_field</option>
                <option value="on_capture_location">on_capture_location</option>
                <option value="on_complete">on_complete</option>
                <option value="custom">custom</option>
              </select>
            </CLabel>
            <CLabel text="Trigger Round"><input type="number" value={form.trigger_round ?? ""} onChange={(e) => setF("trigger_round", e.target.value ? Number(e.target.value) : null)} className={CI} /></CLabel>
            <CLabel text="Player Count"><input type="number" value={form.player_count ?? ""} onChange={(e) => setF("player_count", e.target.value ? Number(e.target.value) : null)} className={CI} /></CLabel>
            <CLabel text="Sort Order"><input type="number" value={form.sort_order} onChange={(e) => setF("sort_order", Number(e.target.value))} className={CI} /></CLabel>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <CLabel text="Trigger Label EN"><input type="text" value={form.trigger_label_en ?? ""} onChange={(e) => setF("trigger_label_en", e.target.value || null)} className={CI} /></CLabel>
            <CLabel text="Trigger Label RU"><input type="text" value={form.trigger_label_ru ?? ""} onChange={(e) => setF("trigger_label_ru", e.target.value || null)} className={CI} /></CLabel>
            <CLabel text="Condition EN"><textarea value={form.condition_en ?? ""} onChange={(e) => setF("condition_en", e.target.value || null)} rows={2} className={CT} /></CLabel>
            <CLabel text="Condition RU"><textarea value={form.condition_ru ?? ""} onChange={(e) => setF("condition_ru", e.target.value || null)} rows={2} className={CT} /></CLabel>
            <CLabel text="Effect EN"><textarea value={form.effect_en} onChange={(e) => setF("effect_en", e.target.value)} rows={4} className={CT} /></CLabel>
            <CLabel text="Effect RU"><textarea value={form.effect_ru ?? ""} onChange={(e) => setF("effect_ru", e.target.value || null)} rows={4} className={CT} /></CLabel>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={save} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TimedEventsTab({ scenarioId }: { scenarioId: string }) {
  const [rows, setRows] = useState<TimedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.from("scenario_timed_events" as never).select("*").eq("scenario_id", scenarioId).order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) toast.error("Load error: " + error.message);
        setRows((data as TimedEvent[]) ?? []);
        setLoading(false);
      });
  }, [scenarioId]);

  const addRow = async () => {
    const { data, error } = await supabase.from("scenario_timed_events" as never)
      .insert({ scenario_id: scenarioId, trigger_type: "custom", effect_en: "", sort_order: (rows.length + 1) * 10 } as never)
      .select().single();
    if (error) toast.error(error.message);
    else if (data) setRows((p) => [...p, data as TimedEvent]);
  };

  const saveRow = async (id: number, payload: Partial<TimedEvent>) => {
    const { error } = await supabase.from("scenario_timed_events" as never).update(payload as never).eq("id", id);
    if (!error) { setRows((p) => p.map((r) => r.id === id ? { ...r, ...payload } : r)); toast.success("Saved"); }
    else toast.error(error.message);
  };

  const deleteRow = async (id: number) => {
    const { error } = await supabase.from("scenario_timed_events" as never).delete().eq("id", id);
    if (!error) { setRows((p) => p.filter((r) => r.id !== id)); toast.success("Deleted"); }
    else toast.error(error.message);
  };

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button type="button" onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
          <Plus className="w-3 h-3" /> Add Event
        </button>
      </div>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">No timed events.</p>}
      {rows.map((r) => <TimedEventRow key={r.id} event={r} onSave={saveRow} onDelete={deleteRow} />)}
    </div>
  );
}

// ── AI Setup tab ───────────────────────────────────────────────────────────

function AISetupTab({ scenarioId }: { scenarioId: string }) {
  const [record, setRecord] = useState<AISetup | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<AISetup>>({});
  const setF = (k: keyof AISetup, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    setLoading(true);
    supabase.from("scenario_ai_setup" as never).select("*").eq("scenario_id", scenarioId).maybeSingle()
      .then(({ data }) => {
        const rec = data as AISetup | null;
        setRecord(rec);
        setForm(rec ?? {});
        setLoading(false);
      });
  }, [scenarioId]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      scenario_id: scenarioId,
      ai_faction_en: (form.ai_faction_en as string) || null,
      ai_faction_ru: (form.ai_faction_ru as string) || null,
      enemy_heroes_en: form.enemy_heroes_en ?? null,
      enemy_heroes_ru: form.enemy_heroes_ru ?? null,
      enemy_armies_en: form.enemy_armies_en ?? null,
      enemy_armies_ru: form.enemy_armies_ru ?? null,
      enemy_decks_en: form.enemy_decks_en ?? null,
      enemy_decks_ru: form.enemy_decks_ru ?? null,
      enemy_spell_deck_en: form.enemy_spell_deck_en ?? null,
      enemy_spell_deck_ru: form.enemy_spell_deck_ru ?? null,
      special_setup_en: (form.special_setup_en as string) || null,
      special_setup_ru: (form.special_setup_ru as string) || null,
      notes_en: (form.notes_en as string) || null,
      notes_ru: (form.notes_ru as string) || null,
    };
    if (record) {
      const { error } = await supabase.from("scenario_ai_setup" as never).update(payload as never).eq("id", record.id);
      if (!error) { setRecord((p) => p ? { ...p, ...payload } : null); toast.success("Saved"); }
      else toast.error(error.message);
    } else {
      const { data, error } = await supabase.from("scenario_ai_setup" as never).insert(payload as never).select().single();
      if (!error && data) { setRecord(data as AISetup); toast.success("Created"); }
      else if (error) toast.error(error.message);
    }
    setSaving(false);
  };

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <CLabel text="AI Faction EN"><input type="text" value={(form.ai_faction_en as string) ?? ""} onChange={(e) => setF("ai_faction_en", e.target.value || null)} className={CI} /></CLabel>
        <CLabel text="AI Faction RU"><input type="text" value={(form.ai_faction_ru as string) ?? ""} onChange={(e) => setF("ai_faction_ru", e.target.value || null)} className={CI} /></CLabel>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CLabel text="Enemy Heroes EN (JSON)"><textarea value={jsonStr(form.enemy_heroes_en)} onChange={(e) => setF("enemy_heroes_en", parseJson(e.target.value))} rows={4} className={CJ} /></CLabel>
        <CLabel text="Enemy Heroes RU (JSON)"><textarea value={jsonStr(form.enemy_heroes_ru)} onChange={(e) => setF("enemy_heroes_ru", parseJson(e.target.value))} rows={4} className={CJ} /></CLabel>
        <CLabel text="Enemy Armies EN (JSON)"><textarea value={jsonStr(form.enemy_armies_en)} onChange={(e) => setF("enemy_armies_en", parseJson(e.target.value))} rows={4} className={CJ} /></CLabel>
        <CLabel text="Enemy Armies RU (JSON)"><textarea value={jsonStr(form.enemy_armies_ru)} onChange={(e) => setF("enemy_armies_ru", parseJson(e.target.value))} rows={4} className={CJ} /></CLabel>
        <CLabel text="Enemy Decks EN (JSON)"><textarea value={jsonStr(form.enemy_decks_en)} onChange={(e) => setF("enemy_decks_en", parseJson(e.target.value))} rows={3} className={CJ} /></CLabel>
        <CLabel text="Enemy Decks RU (JSON)"><textarea value={jsonStr(form.enemy_decks_ru)} onChange={(e) => setF("enemy_decks_ru", parseJson(e.target.value))} rows={3} className={CJ} /></CLabel>
        <CLabel text="Spell Deck EN (JSON)"><textarea value={jsonStr(form.enemy_spell_deck_en)} onChange={(e) => setF("enemy_spell_deck_en", parseJson(e.target.value))} rows={3} className={CJ} /></CLabel>
        <CLabel text="Spell Deck RU (JSON)"><textarea value={jsonStr(form.enemy_spell_deck_ru)} onChange={(e) => setF("enemy_spell_deck_ru", parseJson(e.target.value))} rows={3} className={CJ} /></CLabel>
        <CLabel text="Special Setup EN"><textarea value={(form.special_setup_en as string) ?? ""} onChange={(e) => setF("special_setup_en", e.target.value || null)} rows={3} className={CT} /></CLabel>
        <CLabel text="Special Setup RU"><textarea value={(form.special_setup_ru as string) ?? ""} onChange={(e) => setF("special_setup_ru", e.target.value || null)} rows={3} className={CT} /></CLabel>
        <CLabel text="Notes EN"><textarea value={(form.notes_en as string) ?? ""} onChange={(e) => setF("notes_en", e.target.value || null)} rows={3} className={CT} /></CLabel>
        <CLabel text="Notes RU"><textarea value={(form.notes_ru as string) ?? ""} onChange={(e) => setF("notes_ru", e.target.value || null)} rows={3} className={CT} /></CLabel>
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {record ? "Save" : "Create"}
        </button>
      </div>
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

                </div>
              )}

              {activeTab === "Setup Blocks" && selected && <SetupBlocksTab scenarioId={selected.id} />}
              {activeTab === "Story" && selected && <StoryTab scenarioId={selected.id} />}
              {activeTab === "Map Variants" && selected && <MapVariantsTab scenarioId={selected.id} />}
              {activeTab === "Timed Events" && selected && <TimedEventsTab scenarioId={selected.id} />}
              {activeTab === "AI Setup" && selected && <AISetupTab scenarioId={selected.id} />}
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
