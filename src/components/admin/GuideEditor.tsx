import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Plus, Trash2, ChevronDown, ChevronRight, Save, Loader2, Eye, EyeOff,
} from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";
import GuidePanelContentEditor from "@/components/admin/GuidePanelContentEditor";

interface GuideSection {
  id: string;
  slug: string;
  label_en: string;
  label_ru: string;
  icon: string | null;
  sort_order: number;
  is_visible: boolean;
  intro_en: string | null;
  intro_ru: string | null;
  category_en: string | null;
  category_ru: string | null;
}

interface GuidePanel {
  id: string;
  section_id: string;
  sort_order: number;
  kind: string;
  title_en: string | null;
  title_ru: string | null;
  content: any;
}

interface Slot {
  id: string;
  label: string;
  kind: "main" | "array";
  arr?: string;
  idx?: number;
  nested?: string | null;
  current: string | null;
}

type DeleteTarget = { type: "section" | "panel"; id: string } | null;

const ARRAY_KEYS = ["points", "items", "callouts", "abilities", "types", "tiers"];
const PANEL_KINDS = ["standard", "anatomy", "types", "example"];

function basename(path: string | null | undefined): string | null {
  if (!path) return null;
  const i = path.lastIndexOf("/");
  return i >= 0 ? path.slice(i + 1) : path;
}

function slotsForPanel(panel: GuidePanel): Slot[] {
  const c = panel.content ?? {};
  const slots: Slot[] = [];
  if (panel.kind === "standard" || panel.kind === "anatomy") {
    slots.push({ id: "main", label: "Main image", kind: "main", current: c.image_path ?? null });
  }
  for (const key of ARRAY_KEYS) {
    const arr = Array.isArray(c[key]) ? c[key] : [];
    arr.forEach((el: any, idx: number) => {
      const nested = key === "points" ? "detail" : null;
      const current = nested ? (el?.detail?.image ?? null) : (el?.image ?? null);
      const elLabel = el?.label?.en ?? el?.title?.en ?? el?.name?.en ?? "";
      slots.push({
        id: `${key}.${idx}`,
        label: `${key}[${idx}]${elLabel ? " — " + elLabel : ""}`,
        kind: "array",
        arr: key,
        idx,
        nested,
        current,
      });
    });
  }
  return slots;
}

function SortablePanelCard({
  panel, children,
}: { panel: GuidePanel; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: panel.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="border border-border rounded-lg p-4 bg-background">
      <div className="flex gap-3 items-start">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing mt-1"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

function SortableSectionRow({
  sec, children,
}: { sec: GuideSection; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sec.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="border border-border rounded-lg bg-card">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export default function GuideEditor() {
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [panels, setPanels] = useState<GuidePanel[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filenames, setFilenames] = useState<Record<string, string>>({});
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    const { data: secs } = await supabase
      .from("guide_sections")
      .select("id,slug,label_en,label_ru,icon,sort_order,is_visible,intro_en,intro_ru,category_en,category_ru")
      .order("sort_order", { ascending: true });
    const { data: pans } = await supabase
      .from("guide_panels")
      .select("id,section_id,sort_order,kind,title_en,title_ru,content")
      .order("sort_order", { ascending: true });
    setSections((secs as GuideSection[]) ?? []);
    setPanels((pans as GuidePanel[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const invalidateGuide = () => {
    queryClient.invalidateQueries({ queryKey: ["guide_sections"] });
    queryClient.invalidateQueries({ queryKey: ["guide_panels"] });
  };

  const panelsBySection = useMemo(() => {
    const map: Record<string, GuidePanel[]> = {};
    for (const p of panels) {
      (map[p.section_id] ??= []).push(p);
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.sort_order - b.sort_order);
    return map;
  }, [panels]);

  const markSaving = (id: string, on: boolean) =>
    setSavingIds((prev) => {
      const n = new Set(prev);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });

  const editSection = (id: string, field: keyof GuideSection, value: any) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const saveSection = async (id: string) => {
    const s = sections.find((x) => x.id === id);
    if (!s) return;
    markSaving(id, true);
    await supabase.from("guide_sections").update({
      slug: s.slug,
      label_en: s.label_en,
      label_ru: s.label_ru,
      icon: s.icon,
      intro_en: s.intro_en,
      intro_ru: s.intro_ru,
      category_en: s.category_en,
      category_ru: s.category_ru,
    }).eq("id", id);
    invalidateGuide();
    markSaving(id, false);
  };

  const toggleSectionVisible = async (id: string) => {
    const s = sections.find((x) => x.id === id);
    if (!s) return;
    const next = !s.is_visible;
    editSection(id, "is_visible", next);
    await supabase.from("guide_sections").update({ is_visible: next }).eq("id", id);
    invalidateGuide();
  };

  const addSection = async () => {
    const maxSort = sections.reduce((m, s) => Math.max(m, s.sort_order), 0);
    const id = `guide_sec_${Date.now()}`;
    const row: GuideSection = {
      id, slug: "new-section", label_en: "New Section", label_ru: "Новый раздел",
      icon: null, sort_order: maxSort + 10, is_visible: false,
      intro_en: null, intro_ru: null, category_en: null, category_ru: null,
    };
    const { error } = await supabase.from("guide_sections").insert(row);
    if (!error) {
      setSections((prev) => [...prev, row]);
      setExpanded(id);
      invalidateGuide();
    }
  };

  const handleSectionDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ordered = [...sections].sort((a, b) => a.sort_order - b.sort_order);
    const oldIdx = ordered.findIndex((s) => s.id === active.id);
    const newIdx = ordered.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(ordered, oldIdx, newIdx).map((s, i) => ({ ...s, sort_order: (i + 1) * 10 }));
    setSections(reordered);
    for (const s of reordered) await supabase.from("guide_sections").update({ sort_order: s.sort_order }).eq("id", s.id);
    invalidateGuide();
  };

  const editPanel = (id: string, field: keyof GuidePanel, value: any) =>
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  const savePanel = async (id: string) => {
    const p = panels.find((x) => x.id === id);
    if (!p) return;
    markSaving(id, true);
    await supabase.from("guide_panels").update({
      title_en: p.title_en, title_ru: p.title_ru, kind: p.kind,
    }).eq("id", id);
    invalidateGuide();
    markSaving(id, false);
  };

  const addPanel = async (sectionId: string) => {
    const kids = panelsBySection[sectionId] ?? [];
    const maxSort = kids.reduce((m, p) => Math.max(m, p.sort_order), 0);
    const insert = { section_id: sectionId, sort_order: maxSort + 10, kind: "standard", title_en: "New panel", title_ru: "Новая панель", content: {} };
    const { data, error } = await supabase.from("guide_panels").insert(insert).select().single();
    if (!error && data) {
      setPanels((prev) => [...prev, data as GuidePanel]);
      invalidateGuide();
    }
  };

  const handlePanelDragEnd = (sectionId: string) => async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const kids = panelsBySection[sectionId] ?? [];
    const oldIdx = kids.findIndex((p) => p.id === active.id);
    const newIdx = kids.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(kids, oldIdx, newIdx).map((p, i) => ({ ...p, sort_order: (i + 1) * 10 }));
    setPanels((prev) => prev.map((p) => reordered.find((r) => r.id === p.id) ?? p));
    for (const p of reordered) await supabase.from("guide_panels").update({ sort_order: p.sort_order }).eq("id", p.id);
    invalidateGuide();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    if (deleteTarget.type === "section") {
      await supabase.from("guide_panels").delete().eq("section_id", deleteTarget.id);
      await supabase.from("guide_sections").delete().eq("id", deleteTarget.id);
      setPanels((prev) => prev.filter((p) => p.section_id !== deleteTarget.id));
      setSections((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    } else {
      await supabase.from("guide_panels").delete().eq("id", deleteTarget.id);
      setPanels((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    }
    setDeleting(false);
    setDeleteTarget(null);
    invalidateGuide();
  };

  const setSlotImage = async (panel: GuidePanel, slot: Slot, filename: string | null) => {
    const next = JSON.parse(JSON.stringify(panel.content ?? {}));
    const val = filename ? `guide/${filename}` : null;
    if (slot.kind === "main") {
      if (val) next.image_path = val;
      else delete next.image_path;
    } else {
      const arr = Array.isArray(next[slot.arr!]) ? next[slot.arr!] : [];
      const el = arr[slot.idx!] ?? {};
      if (slot.nested) {
        el[slot.nested] = el[slot.nested] ?? {};
        if (val) el[slot.nested].image = val;
        else delete el[slot.nested].image;
      } else {
        if (val) el.image = val;
        else delete el.image;
      }
      arr[slot.idx!] = el;
      next[slot.arr!] = arr;
    }
    setPanels((prev) => prev.map((p) => (p.id === panel.id ? { ...p, content: next } : p)));
    await supabase.from("guide_panels").update({ content: next }).eq("id", panel.id);
    invalidateGuide();
  };

  const fieldCls = "w-full bg-transparent text-xs text-foreground outline-none border-b border-border focus:border-primary px-1 py-0.5";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Guide</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drag to reorder. Edit section and panel fields, add or delete, and manage every image slot. Content fields (points, items, etc.) come next.
          </p>
        </div>
        <button type="button" onClick={addSection} className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Section
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map((sec) => {
              const kids = panelsBySection[sec.id] ?? [];
              const isOpen = expanded === sec.id;
              return (
                <SortableSectionRow key={sec.id} sec={sec}>
                  <button type="button" onClick={() => setExpanded(isOpen ? null : sec.id)} className="text-muted-foreground hover:text-foreground" title={isOpen ? "Collapse" : "Expand"}>
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <span className="text-xs font-mono text-muted-foreground">{sec.slug}</span>
                  <span className="text-sm font-medium text-foreground">{sec.label_en}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{kids.length} panels</span>
                  <button type="button" onClick={() => toggleSectionVisible(sec.id)} className="text-muted-foreground hover:text-foreground" title={sec.is_visible ? "Hide" : "Show"}>
                    {sec.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button type="button" onClick={() => setDeleteTarget({ type: "section", id: sec.id })} className="text-destructive/60 hover:text-destructive" title="Delete section (and its panels)">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </SortableSectionRow>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {sections.map((sec) => {
        if (expanded !== sec.id) return null;
        const kids = panelsBySection[sec.id] ?? [];
        return (
          <div key={`expanded-${sec.id}`} className="border border-border rounded-lg p-4 space-y-4 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Slug</label>
                <input value={sec.slug} onChange={(e) => editSection(sec.id, "slug", e.target.value)} className={`${fieldCls} font-mono`} />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Icon (lucide name)</label>
                <input value={sec.icon ?? ""} onChange={(e) => editSection(sec.id, "icon", e.target.value || null)} className={fieldCls} />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Label EN</label>
                <input value={sec.label_en} onChange={(e) => editSection(sec.id, "label_en", e.target.value)} className={fieldCls} />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Label RU</label>
                <input value={sec.label_ru} onChange={(e) => editSection(sec.id, "label_ru", e.target.value)} className={fieldCls} />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Category EN</label>
                <input value={sec.category_en ?? ""} onChange={(e) => editSection(sec.id, "category_en", e.target.value || null)} className={fieldCls} />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Category RU</label>
                <input value={sec.category_ru ?? ""} onChange={(e) => editSection(sec.id, "category_ru", e.target.value || null)} className={fieldCls} />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Intro EN</label>
                <textarea value={sec.intro_en ?? ""} onChange={(e) => editSection(sec.id, "intro_en", e.target.value || null)} rows={2} className={`${fieldCls} resize-y`} />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Intro RU</label>
                <textarea value={sec.intro_ru ?? ""} onChange={(e) => editSection(sec.id, "intro_ru", e.target.value || null)} rows={2} className={`${fieldCls} resize-y`} />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => saveSection(sec.id)} disabled={savingIds.has(sec.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-50">
                {savingIds.has(sec.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save section
              </button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePanelDragEnd(sec.id)}>
              <SortableContext items={kids.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {kids.map((panel) => {
                    const slots = slotsForPanel(panel);
                    return (
                      <SortablePanelCard key={panel.id} panel={panel}>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <select value={panel.kind} onChange={(e) => editPanel(panel.id, "kind", e.target.value)} className="bg-transparent text-xs text-foreground border-b border-border focus:border-primary outline-none">
                              {PANEL_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                            </select>
                            <input value={panel.title_en ?? ""} onChange={(e) => editPanel(panel.id, "title_en", e.target.value || null)} placeholder="Title EN" className="flex-1 min-w-[140px] bg-transparent text-sm text-foreground border-b border-border focus:border-primary outline-none px-1" />
                            <input value={panel.title_ru ?? ""} onChange={(e) => editPanel(panel.id, "title_ru", e.target.value || null)} placeholder="Title RU" className="flex-1 min-w-[140px] bg-transparent text-sm text-muted-foreground border-b border-border focus:border-primary outline-none px-1" />
                            <button type="button" onClick={() => savePanel(panel.id)} disabled={savingIds.has(panel.id)} className="text-primary hover:text-primary/80 disabled:opacity-50" title="Save panel">
                              {savingIds.has(panel.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            </button>
                            <button type="button" onClick={() => setDeleteTarget({ type: "panel", id: panel.id })} className="text-destructive/60 hover:text-destructive" title="Delete panel">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <GuidePanelContentEditor
                            panel={panel}
                            onSaved={(c) => setPanels((prev) => prev.map((p) => (p.id === panel.id ? { ...p, content: c } : p)))}
                          />

                          {slots.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No image slots in this panel.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {slots.map((slot) => {
                                const fkey = `${panel.id}::${slot.id}`;
                                const current = basename(slot.current);
                                const fallback = `${panel.id}_${slot.id.replace(/\./g, "_")}.webp`;
                                return (
                                  <div
                                    key={slot.id}
                                    onClick={() => setActiveSlot(fkey)}
                                    className={`flex gap-4 items-start border-t border-border pt-3 first:border-t-0 first:pt-0 rounded-md cursor-pointer ${activeSlot === fkey ? "ring-1 ring-primary/60 bg-primary/5" : ""}`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs text-foreground truncate">{slot.label}</div>
                                      <label className="block text-[11px] text-muted-foreground mt-1 mb-1">Filename (saved under guide/)</label>
                                      <input
                                        value={filenames[fkey] ?? current ?? ""}
                                        onChange={(e) => setFilenames((prev) => ({ ...prev, [fkey]: e.target.value }))}
                                        placeholder={fallback}
                                        className="w-64 bg-transparent text-xs font-mono text-foreground outline-none border-b border-border focus:border-primary px-1 py-0.5"
                                      />
                                      <div className="text-[11px] text-muted-foreground mt-1 font-mono">{slot.current ?? "no image"}</div>
                                      {activeSlot === fkey && (
                                        <div className="text-[11px] text-primary mt-1">Press Ctrl+V to paste an image into this slot</div>
                                      )}
                                    </div>
                                    <ImageUploader
                                      table="guide_panels"
                                      recordId={panel.id}
                                      folder="guide"
                                      imageField="image_path"
                                      currentImage={current}
                                      skipDbUpdate
                                      hasImageStatus={false}
                                      defaultCropPreset="free"
                                      enablePaste={activeSlot === fkey}
                                      filename={(filenames[fkey] && filenames[fkey].trim()) || current || fallback}
                                      onUploaded={(fn) => { if (fn) setSlotImage(panel, slot, fn); }}
                                      onDeleted={() => setSlotImage(panel, slot, null)}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </SortablePanelCard>
                    );
                  })}
                  <button type="button" onClick={() => addPanel(sec.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1">
                    <Plus className="w-3.5 h-3.5" /> Add panel
                  </button>
                </div>
              </SortableContext>
            </DndContext>
          </div>
        );
      })}

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
