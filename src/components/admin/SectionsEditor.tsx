import { useEffect, useRef, useState } from "react";
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
  GripVertical, Plus, Trash2, ChevronDown, ChevronRight, Save, Loader2,
  Eye, EyeOff, ArrowLeftToLine, ArrowRightToLine,
  BookOpen, Map, MapPin, CalendarDays, Layers, Swords, User, Castle,
  MessageCircle, Wand2, Sparkles, Shield, Scroll, Gem, Crown, Flag, Hammer,
  Coins, Compass, Circle, type LucideIcon,
} from "lucide-react";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

interface Section {
  id: string;
  parent_id: string | null;
  slug: string;
  label_en: string;
  label_ru: string;
  icon: string | null;
  sort_order: number;
  is_visible: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen, Map, MapPin, CalendarDays, Layers, Swords, User, Castle,
  MessageCircle, Wand2, Sparkles, Shield, Scroll, Gem, Crown, Flag, Hammer,
  Coins, Compass, Circle,
};
const ICON_OPTIONS = Object.keys(ICON_MAP);

function renderIcon(name: string | null, className = "w-4 h-4") {
  const Cmp = (name && ICON_MAP[name]) || Circle;
  return <Cmp className={className} />;
}

function SortableChildRow({
  sec, onEdit, onSave, onToggleVisible, onPromote, onDelete, saving,
}: {
  sec: Section;
  onEdit: (id: string, field: "label_en" | "label_ru" | "slug", value: string) => void;
  onSave: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onPromote: (id: string) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: sec.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md bg-card border border-border ${sec.is_visible ? "" : "opacity-50"}`}
    >
      <button type="button" {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground" title="Drag to reorder">
        <GripVertical className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => onPromote(sec.id)} title="Promote to top level" className="text-muted-foreground hover:text-foreground">
        <ArrowLeftToLine className="w-4 h-4" />
      </button>
      <input
        value={sec.slug}
        onChange={(e) => onEdit(sec.id, "slug", e.target.value)}
        placeholder="slug"
        className="w-28 bg-transparent text-xs font-mono text-muted-foreground outline-none border-b border-transparent focus:border-border px-1"
      />
      <input
        value={sec.label_en}
        onChange={(e) => onEdit(sec.id, "label_en", e.target.value)}
        placeholder="Label EN"
        className="flex-1 bg-transparent text-xs text-foreground outline-none border-b border-transparent focus:border-border px-1"
      />
      <input
        value={sec.label_ru}
        onChange={(e) => onEdit(sec.id, "label_ru", e.target.value)}
        placeholder="Label RU"
        className="flex-1 bg-transparent text-xs text-foreground outline-none border-b border-transparent focus:border-border px-1"
      />
      <button type="button" onClick={() => onToggleVisible(sec.id)} title={sec.is_visible ? "Hide" : "Show"} className="text-muted-foreground hover:text-foreground">
        {sec.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
      <button type="button" onClick={() => onSave(sec.id)} className="text-primary hover:text-primary/80" title="Save">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      </button>
      <button type="button" onClick={() => onDelete(sec.id)} className="text-destructive/60 hover:text-destructive" title="Delete">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function SortableTopRow({
  sec, expanded, onToggleExpand, onEdit, onSave, onToggleVisible, onDemote, onDelete, saving,
  children, canDemote, onAddChild, onChildDragEnd, childIds,
}: {
  sec: Section;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: (id: string, field: "label_en" | "label_ru" | "slug" | "icon", value: string) => void;
  onSave: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onDemote: (id: string) => void;
  onDelete: (id: string) => void;
  saving: boolean;
  children: React.ReactNode;
  canDemote: boolean;
  onAddChild: () => void;
  onChildDragEnd: (e: DragEndEvent) => void;
  childIds: string[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: sec.id });
  const childSensors = useSensors(useSensor(PointerSensor));
  const style = { transform: CSS.Transform.toString(transform), transition };
  const hasChildren = childIds.length > 0;
  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      <div className={`flex items-center gap-2 px-2 py-2 rounded-md bg-card border border-border ${sec.is_visible ? "" : "opacity-50"}`}>
        <button type="button" {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground" title="Drag to reorder">
          <GripVertical className="w-4 h-4" />
        </button>
        <button type="button" onClick={onToggleExpand} className="text-muted-foreground hover:text-foreground" title={expanded ? "Collapse" : "Expand"}>
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={() => onDemote(sec.id)}
          disabled={!canDemote}
          title={canDemote ? "Demote to child of section above" : "Cannot demote (no section above, or this section has children)"}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ArrowRightToLine className="w-4 h-4" />
        </button>
        {renderIcon(sec.icon)}
        <select
          value={sec.icon ?? "Circle"}
          onChange={(e) => onEdit(sec.id, "icon", e.target.value)}
          className="bg-transparent text-xs text-muted-foreground outline-none border-b border-transparent focus:border-border"
        >
          {ICON_OPTIONS.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <input
          value={sec.slug}
          onChange={(e) => onEdit(sec.id, "slug", e.target.value)}
          placeholder="slug"
          className="w-24 bg-transparent text-xs font-mono text-muted-foreground outline-none border-b border-transparent focus:border-border px-1"
        />
        <input
          value={sec.label_en}
          onChange={(e) => onEdit(sec.id, "label_en", e.target.value)}
          placeholder="Label EN"
          className="flex-1 bg-transparent text-sm text-foreground outline-none border-b border-transparent focus:border-border px-1"
        />
        <input
          value={sec.label_ru}
          onChange={(e) => onEdit(sec.id, "label_ru", e.target.value)}
          placeholder="Label RU"
          className="flex-1 bg-transparent text-sm text-foreground outline-none border-b border-transparent focus:border-border px-1"
        />
        <button type="button" onClick={() => onToggleVisible(sec.id)} title={sec.is_visible ? "Hide" : "Show"} className="text-muted-foreground hover:text-foreground">
          {sec.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button type="button" onClick={() => onSave(sec.id)} disabled={saving} className="text-primary hover:text-primary/80 disabled:opacity-50" title="Save">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </button>
        <button type="button" onClick={() => onDelete(sec.id)} className="text-destructive/60 hover:text-destructive" title="Delete (cascades children)">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="ml-8 space-y-1">
          <DndContext sensors={childSensors} collisionDetection={closestCenter} onDragEnd={onChildDragEnd}>
            <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">{children}</div>
            </SortableContext>
          </DndContext>
          <button
            type="button"
            onClick={onAddChild}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add subsection
          </button>
        </div>
      )}
    </div>
  );
}

export default function SectionsEditor() {
  const [sections, setSections] = useState<Section[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));
  const queryClient = useQueryClient();
  const originalSlugs = useRef<Record<string, string>>({});

  const invalidateNav = () => {
    queryClient.invalidateQueries({ queryKey: ["nav_sections"] });
    queryClient.invalidateQueries({ queryKey: ["section_routing"] });
  };

  const load = async () => {
    const { data } = await supabase
      .from("sections")
      .select("id,parent_id,slug,label_en,label_ru,icon,sort_order,is_visible")
      .order("sort_order", { ascending: true });
    const rows = (data as Section[]) ?? [];
    setSections(rows);
    originalSlugs.current = Object.fromEntries(rows.map((r) => [r.id, r.slug]));
  };
  useEffect(() => { load(); }, []);

  const tops = sections.filter((s) => s.parent_id === null).sort((a, b) => a.sort_order - b.sort_order);
  const childrenOf = (pid: string) => sections.filter((s) => s.parent_id === pid).sort((a, b) => a.sort_order - b.sort_order);

  const edit = (id: string, field: "label_en" | "label_ru" | "slug" | "icon", value: string) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const save = async (id: string) => {
    const s = sections.find((x) => x.id === id);
    if (!s) return;
    setSavingIds((p) => new Set(p).add(id));
    await supabase.from("sections").update({
      label_en: s.label_en, label_ru: s.label_ru, slug: s.slug, icon: s.icon,
    }).eq("id", id);
    setSavingIds((p) => { const n = new Set(p); n.delete(id); return n; });
  };

  const toggleVisible = async (id: string) => {
    const s = sections.find((x) => x.id === id);
    if (!s) return;
    const next = !s.is_visible;
    setSections((prev) => prev.map((x) => (x.id === id ? { ...x, is_visible: next } : x)));
    await supabase.from("sections").update({ is_visible: next }).eq("id", id);
  };

  const persistOrder = async (rows: Section[]) => {
    for (const r of rows) await supabase.from("sections").update({ sort_order: r.sort_order }).eq("id", r.id);
  };

  const handleTopDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = tops.findIndex((s) => s.id === active.id);
    const newIdx = tops.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(tops, oldIdx, newIdx).map((s, i) => ({ ...s, sort_order: (i + 1) * 10 }));
    setSections((prev) => prev.map((s) => reordered.find((r) => r.id === s.id) ?? s));
    await persistOrder(reordered);
  };

  const handleChildDragEnd = (pid: string) => async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const kids = childrenOf(pid);
    const oldIdx = kids.findIndex((s) => s.id === active.id);
    const newIdx = kids.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(kids, oldIdx, newIdx).map((s, i) => ({ ...s, sort_order: (i + 1) * 10 }));
    setSections((prev) => prev.map((s) => reordered.find((r) => r.id === s.id) ?? s));
    await persistOrder(reordered);
  };

  const promote = async (id: string) => {
    const maxTop = tops.reduce((m, s) => Math.max(m, s.sort_order), 0);
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, parent_id: null, sort_order: maxTop + 10 } : s)));
    await supabase.from("sections").update({ parent_id: null, sort_order: maxTop + 10 }).eq("id", id);
  };

  const demote = async (id: string) => {
    const idx = tops.findIndex((s) => s.id === id);
    if (idx <= 0) return;
    if (childrenOf(id).length > 0) return;
    const newParent = tops[idx - 1];
    const maxChild = childrenOf(newParent.id).reduce((m, s) => Math.max(m, s.sort_order), 0);
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, parent_id: newParent.id, sort_order: maxChild + 10 } : s)));
    await supabase.from("sections").update({ parent_id: newParent.id, sort_order: maxChild + 10 }).eq("id", id);
  };

  const addTop = async () => {
    const maxTop = tops.reduce((m, s) => Math.max(m, s.sort_order), 0);
    const id = `section_${Date.now()}`;
    const row: Section = { id, parent_id: null, slug: "new-section", label_en: "New Section", label_ru: "Новый раздел", icon: "Circle", sort_order: maxTop + 10, is_visible: true };
    const { error } = await supabase.from("sections").insert(row);
    if (!error) setSections((prev) => [...prev, row]);
  };

  const addChild = async (pid: string) => {
    const maxChild = childrenOf(pid).reduce((m, s) => Math.max(m, s.sort_order), 0);
    const id = `${pid}_child_${Date.now()}`;
    const row: Section = { id, parent_id: pid, slug: "new-subsection", label_en: "New Subsection", label_ru: "Новый подраздел", icon: null, sort_order: maxChild + 10, is_visible: true };
    const { error } = await supabase.from("sections").insert(row);
    if (!error) setSections((prev) => [...prev, row]);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("sections").delete().eq("id", deleteTarget);
    setSections((prev) => prev.filter((s) => s.id !== deleteTarget && s.parent_id !== deleteTarget));
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Navigation</h1>
          <p className="text-sm text-muted-foreground">Drag to reorder. Arrows promote/demote between the two levels. Hide instead of delete to keep content reachable.</p>
        </div>
        <button
          type="button"
          onClick={addTop}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Add Section
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTopDragEnd}>
        <SortableContext items={tops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tops.map((s, i) => {
              const kids = childrenOf(s.id);
              return (
                <SortableTopRow
                  key={s.id}
                  sec={s}
                  expanded={expanded === s.id}
                  onToggleExpand={() => setExpanded(expanded === s.id ? null : s.id)}
                  onEdit={edit}
                  onSave={save}
                  onToggleVisible={toggleVisible}
                  onDemote={demote}
                  onDelete={(id) => setDeleteTarget(id)}
                  saving={savingIds.has(s.id)}
                  canDemote={i > 0 && kids.length === 0}
                  onAddChild={() => addChild(s.id)}
                  onChildDragEnd={handleChildDragEnd(s.id)}
                  childIds={kids.map((k) => k.id)}
                >
                  {kids.map((k) => (
                    <SortableChildRow
                      key={k.id}
                      sec={k}
                      onEdit={edit}
                      onSave={save}
                      onToggleVisible={toggleVisible}
                      onPromote={promote}
                      onDelete={(id) => setDeleteTarget(id)}
                      saving={savingIds.has(k.id)}
                    />
                  ))}
                </SortableTopRow>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
