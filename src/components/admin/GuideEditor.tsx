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
import { GripVertical, Plus, Trash2, ChevronRight, Save, Loader2, Eye, EyeOff, Pencil } from "lucide-react";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";
import GuidePanelContentEditor from "@/components/admin/GuidePanelContentEditor";

interface GuideSection {
  id: string; slug: string; label_en: string; label_ru: string; icon: string | null;
  sort_order: number; is_visible: boolean;
  intro_en: string | null; intro_ru: string | null; category_en: string | null; category_ru: string | null;
}
interface GuidePanel {
  id: string; section_id: string; sort_order: number; kind: string;
  title_en: string | null; title_ru: string | null; content: any;
}
type DeleteTarget = { type: "section" | "panel"; id: string } | null;

const PANEL_KINDS = ["standard", "anatomy", "types", "example"];

function SortableSectionRow({ sec, count, onOpen, onToggleVisible, onDelete, onRename }: {
  sec: GuideSection; count: number; onOpen: () => void; onToggleVisible: () => void; onDelete: () => void; onRename: (newLabel: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [nameVal, setNameVal] = useState(sec.label_en);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sec.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 border border-border rounded-md bg-card px-2 py-2">
      <button type="button" {...attributes} {...listeners} className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing" title="Drag"><GripVertical className="w-4 h-4" /></button>
      <button type="button" onClick={onOpen} className="flex-1 flex items-center gap-3 text-left min-w-0">
        <span className="font-mono text-xs text-muted-foreground w-32 shrink-0 truncate">{sec.slug}</span>
        {renaming ? (
          <input autoFocus value={nameVal} onChange={(e) => setNameVal(e.target.value)} onBlur={() => { onRename(nameVal); setRenaming(false); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onRename(nameVal); setRenaming(false); } if (e.key === "Escape") { setNameVal(sec.label_en); setRenaming(false); } }} onClick={(e) => e.stopPropagation()} className="flex-1 min-w-0 bg-transparent text-sm text-foreground border-b border-primary outline-none px-0" />
        ) : (
          <span className="text-sm text-foreground truncate flex-1">{sec.label_en}</span>
        )}
        <span className="text-[11px] text-muted-foreground shrink-0">{count} panels</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
      <button type="button" onClick={onToggleVisible} className="text-muted-foreground hover:text-foreground" title={sec.is_visible ? "Hide" : "Show"}>
        {sec.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); setNameVal(sec.label_en); setRenaming(true); }} className="text-muted-foreground hover:text-foreground" title="Rename"><Pencil className="w-4 h-4" /></button>
      <button type="button" onClick={onDelete} className="text-destructive/60 hover:text-destructive" title="Delete"><Trash2 className="w-4 h-4" /></button>
    </div>
  );
}

function SortablePanelRow({ panel, onOpen, onDelete }: { panel: GuidePanel; onOpen: () => void; onDelete: () => void; }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: panel.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 border border-border rounded-md bg-card px-2 py-2">
      <button type="button" {...attributes} {...listeners} className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing" title="Drag"><GripVertical className="w-4 h-4" /></button>
      <button type="button" onClick={onOpen} className="flex-1 flex items-center gap-3 text-left min-w-0">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground w-20 shrink-0">{panel.kind}</span>
        <span className="text-sm text-foreground truncate flex-1">{panel.title_en || "(untitled)"}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
      <button type="button" onClick={onDelete} className="text-destructive/60 hover:text-destructive" title="Delete"><Trash2 className="w-4 h-4" /></button>
    </div>
  );
}

export default function GuideEditor() {
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [panels, setPanels] = useState<GuidePanel[]>([]);
  const [view, setView] = useState<"sections" | "panels" | "panel">("sections");
  const [secId, setSecId] = useState<string | null>(null);
  const [panelId, setPanelId] = useState<string | null>(null);
  const [editMeta, setEditMeta] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    const { data: secs } = await supabase.from("guide_sections").select("id,slug,label_en,label_ru,icon,sort_order,is_visible,intro_en,intro_ru,category_en,category_ru").order("sort_order", { ascending: true });
    const { data: pans } = await supabase.from("guide_panels").select("id,section_id,sort_order,kind,title_en,title_ru,content").order("sort_order", { ascending: true });
    setSections((secs as GuideSection[]) ?? []);
    setPanels((pans as GuidePanel[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const invalidateGuide = () => {
    queryClient.invalidateQueries({ queryKey: ["guide_sections"] });
    queryClient.invalidateQueries({ queryKey: ["guide_panels"] });
  };
  const panelsBySection = useMemo(() => {
    const map: Record<string, GuidePanel[]> = {};
    for (const p of panels) (map[p.section_id] ??= []).push(p);
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.sort_order - b.sort_order);
    return map;
  }, [panels]);

  const curSec = sections.find((s) => s.id === secId) ?? null;
  const curPanel = panels.find((p) => p.id === panelId) ?? null;

  const markSaving = (id: string, on: boolean) => setSavingIds((prev) => { const n = new Set(prev); if (on) n.add(id); else n.delete(id); return n; });
  const editSection = (id: string, field: keyof GuideSection, value: any) => setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const saveSection = async (id: string) => {
    const s = sections.find((x) => x.id === id); if (!s) return;
    markSaving(id, true);
    await supabase.from("guide_sections").update({ slug: s.slug, label_en: s.label_en, label_ru: s.label_ru, icon: s.icon, intro_en: s.intro_en, intro_ru: s.intro_ru, category_en: s.category_en, category_ru: s.category_ru }).eq("id", id);
    invalidateGuide(); markSaving(id, false);
  };
  const toggleSectionVisible = async (id: string) => {
    const s = sections.find((x) => x.id === id); if (!s) return;
    const next = !s.is_visible; editSection(id, "is_visible", next);
    await supabase.from("guide_sections").update({ is_visible: next }).eq("id", id); invalidateGuide();
  };
  const addSection = async () => {
    const maxSort = sections.reduce((m, s) => Math.max(m, s.sort_order), 0);
    const id = `guide_sec_${Date.now()}`;
    const row: GuideSection = { id, slug: "new-section", label_en: "New Section", label_ru: "Новый раздел", icon: null, sort_order: maxSort + 10, is_visible: false, intro_en: null, intro_ru: null, category_en: null, category_ru: null };
    const { error } = await supabase.from("guide_sections").insert(row);
    if (!error) { setSections((prev) => [...prev, row]); setSecId(id); setView("panels"); setEditMeta(true); invalidateGuide(); }
  };
  const handleSectionDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e; if (!over || active.id === over.id) return;
    const ordered = [...sections].sort((a, b) => a.sort_order - b.sort_order);
    const reordered = arrayMove(ordered, ordered.findIndex((s) => s.id === active.id), ordered.findIndex((s) => s.id === over.id)).map((s, i) => ({ ...s, sort_order: (i + 1) * 10 }));
    setSections(reordered);
    for (const s of reordered) await supabase.from("guide_sections").update({ sort_order: s.sort_order }).eq("id", s.id);
    invalidateGuide();
  };

  const editPanel = (id: string, field: keyof GuidePanel, value: any) => setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  const savePanel = async (id: string) => {
    const p = panels.find((x) => x.id === id); if (!p) return;
    markSaving(id, true);
    await supabase.from("guide_panels").update({ title_en: p.title_en, title_ru: p.title_ru, kind: p.kind }).eq("id", id);
    invalidateGuide(); markSaving(id, false);
  };
  const addPanel = async (sectionId: string) => {
    const kids = panelsBySection[sectionId] ?? [];
    const maxSort = kids.reduce((m, p) => Math.max(m, p.sort_order), 0);
    const { data, error } = await supabase.from("guide_panels").insert({ section_id: sectionId, sort_order: maxSort + 10, kind: "standard", title_en: "New panel", title_ru: "Новая панель", content: {} }).select().single();
    if (!error && data) { setPanels((prev) => [...prev, data as GuidePanel]); invalidateGuide(); }
  };
  const handlePanelDragEnd = (sectionId: string) => async (e: DragEndEvent) => {
    const { active, over } = e; if (!over || active.id === over.id) return;
    const kids = panelsBySection[sectionId] ?? [];
    const reordered = arrayMove(kids, kids.findIndex((p) => p.id === active.id), kids.findIndex((p) => p.id === over.id)).map((p, i) => ({ ...p, sort_order: (i + 1) * 10 }));
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
      if (secId === deleteTarget.id) { setView("sections"); setSecId(null); }
    } else {
      await supabase.from("guide_panels").delete().eq("id", deleteTarget.id);
      setPanels((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      if (panelId === deleteTarget.id) { setView("panels"); setPanelId(null); }
    }
    setDeleting(false); setDeleteTarget(null); invalidateGuide();
  };

  const fieldCls = "w-full bg-transparent text-xs text-foreground outline-none border-b border-border focus:border-primary px-1 py-0.5";
  const crumb = (parts: { t: string; go?: () => void }[]) => (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="w-3 h-3" />}
          {p.go ? <button type="button" onClick={p.go} className="hover:text-foreground">{p.t}</button> : <span className="text-foreground">{p.t}</span>}
        </span>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {view === "sections" && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Guide</h2>
            <button type="button" onClick={addSection} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs hover:bg-primary/90"><Plus className="w-3.5 h-3.5" /> Add Section</button>
          </div>
          <p className="text-xs text-muted-foreground">Click a section to open its panels. Drag to reorder.</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {sections.map((sec) => (
                  <SortableSectionRow key={sec.id} sec={sec} count={(panelsBySection[sec.id] ?? []).length}
                    onOpen={() => { setSecId(sec.id); setView("panels"); setEditMeta(false); }}
                    onToggleVisible={() => toggleSectionVisible(sec.id)}
                    onDelete={() => setDeleteTarget({ type: "section", id: sec.id })}
                    onRename={(newLabel) => { editSection(sec.id, "label_en", newLabel); saveSection(sec.id); }} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      {view === "panels" && curSec && (
        <>
          {crumb([{ t: "Guide", go: () => { setView("sections"); setSecId(null); } }, { t: curSec.label_en }])}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{curSec.label_en}</h2>
            <button type="button" onClick={() => setEditMeta((v) => !v)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /> {editMeta ? "Hide section fields" : "Edit section fields"}</button>
          </div>

          {editMeta && (
            <div className="border border-border rounded-lg p-3 bg-card space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] text-muted-foreground mb-1">Slug</label><input value={curSec.slug} onChange={(e) => editSection(curSec.id, "slug", e.target.value)} className={`${fieldCls} font-mono`} /></div>
                <div><label className="block text-[11px] text-muted-foreground mb-1">Icon (lucide name)</label><input value={curSec.icon ?? ""} onChange={(e) => editSection(curSec.id, "icon", e.target.value || null)} className={fieldCls} /></div>
                <div><label className="block text-[11px] text-muted-foreground mb-1">Label EN</label><input value={curSec.label_en} onChange={(e) => editSection(curSec.id, "label_en", e.target.value)} className={fieldCls} /></div>
                <div><label className="block text-[11px] text-muted-foreground mb-1">Label RU</label><input value={curSec.label_ru} onChange={(e) => editSection(curSec.id, "label_ru", e.target.value)} className={fieldCls} /></div>
                <div><label className="block text-[11px] text-muted-foreground mb-1">Category EN</label><input value={curSec.category_en ?? ""} onChange={(e) => editSection(curSec.id, "category_en", e.target.value || null)} className={fieldCls} /></div>
                <div><label className="block text-[11px] text-muted-foreground mb-1">Category RU</label><input value={curSec.category_ru ?? ""} onChange={(e) => editSection(curSec.id, "category_ru", e.target.value || null)} className={fieldCls} /></div>
                <div><label className="block text-[11px] text-muted-foreground mb-1">Intro EN</label><textarea value={curSec.intro_en ?? ""} onChange={(e) => editSection(curSec.id, "intro_en", e.target.value || null)} rows={2} className={`${fieldCls} resize-y`} /></div>
                <div><label className="block text-[11px] text-muted-foreground mb-1">Intro RU</label><textarea value={curSec.intro_ru ?? ""} onChange={(e) => editSection(curSec.id, "intro_ru", e.target.value || null)} rows={2} className={`${fieldCls} resize-y`} /></div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => saveSection(curSec.id)} disabled={savingIds.has(curSec.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-50">{savingIds.has(curSec.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save section</button>
              </div>
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePanelDragEnd(curSec.id)}>
            <SortableContext items={(panelsBySection[curSec.id] ?? []).map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {(panelsBySection[curSec.id] ?? []).map((panel) => (
                  <SortablePanelRow key={panel.id} panel={panel}
                    onOpen={() => { setPanelId(panel.id); setView("panel"); }}
                    onDelete={() => setDeleteTarget({ type: "panel", id: panel.id })} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <button type="button" onClick={() => addPanel(curSec.id)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 py-1"><Plus className="w-4 h-4" /> Add panel</button>
        </>
      )}

      {view === "panel" && curSec && curPanel && (
        <>
          {crumb([
            { t: "Guide", go: () => { setView("sections"); setSecId(null); setPanelId(null); } },
            { t: curSec.label_en, go: () => { setView("panels"); setPanelId(null); } },
            { t: curPanel.title_en || "(untitled)" },
          ])}

          <div className="border border-border rounded-lg p-4 bg-card space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <select value={curPanel.kind} onChange={(e) => editPanel(curPanel.id, "kind", e.target.value)} className="bg-transparent text-xs text-foreground border-b border-border focus:border-primary outline-none">
                {PANEL_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <input value={curPanel.title_en ?? ""} onChange={(e) => editPanel(curPanel.id, "title_en", e.target.value || null)} placeholder="Title EN" className="flex-1 min-w-[140px] bg-transparent text-sm text-foreground border-b border-border focus:border-primary outline-none px-1" />
              <input value={curPanel.title_ru ?? ""} onChange={(e) => editPanel(curPanel.id, "title_ru", e.target.value || null)} placeholder="Title RU" className="flex-1 min-w-[140px] bg-transparent text-sm text-muted-foreground border-b border-border focus:border-primary outline-none px-1" />
              <button type="button" onClick={() => savePanel(curPanel.id)} disabled={savingIds.has(curPanel.id)} className="text-primary hover:text-primary/80 disabled:opacity-50" title="Save title & kind">{savingIds.has(curPanel.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}</button>
              <button type="button" onClick={() => setDeleteTarget({ type: "panel", id: curPanel.id })} className="text-destructive/60 hover:text-destructive" title="Delete panel"><Trash2 className="w-4 h-4" /></button>
            </div>

            <GuidePanelContentEditor
              panel={curPanel}
              sectionSlug={curSec.slug}
              panelSort={curPanel.sort_order}
              onSaved={(c) => setPanels((prev) => prev.map((p) => (p.id === curPanel.id ? { ...p, content: c } : p)))}
            />
          </div>
        </>
      )}

      <DeleteConfirmDialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} deleting={deleting} />
    </div>
  );
}
