import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, ChevronDown, ChevronRight, Save, Loader2 } from "lucide-react";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

interface FilterGroup {
  id: number;
  label_en: string;
  label_ru: string;
  sort_order: number | null;
}

interface Category {
  id: number;
  category_key: string;
  group_id: number | null;
  label_en: string;
  label_ru: string;
  sort_order: number | null;
}

function SortableCategoryRow({
  cat,
  onEdit,
  onSave,
  onDelete,
}: {
  cat: Category;
  onEdit: (id: number, field: "label_en" | "label_ru" | "category_key", value: string) => void;
  onSave: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: cat.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-2 py-1.5 rounded bg-background border border-border"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <input
        value={cat.category_key}
        onChange={(e) => onEdit(cat.id, "category_key", e.target.value)}
        placeholder="key"
        className="w-32 bg-transparent text-xs font-mono text-muted-foreground outline-none border-b border-transparent focus:border-border px-1"
      />
      <input
        value={cat.label_en}
        onChange={(e) => onEdit(cat.id, "label_en", e.target.value)}
        placeholder="Label EN"
        className="flex-1 bg-transparent text-xs text-foreground outline-none border-b border-transparent focus:border-border px-1"
      />
      <input
        value={cat.label_ru}
        onChange={(e) => onEdit(cat.id, "label_ru", e.target.value)}
        placeholder="Label RU"
        className="flex-1 bg-transparent text-xs text-foreground outline-none border-b border-transparent focus:border-border px-1"
      />
      <button
        type="button"
        onClick={() => onSave(cat.id)}
        className="text-primary hover:text-primary/80"
        title="Save category"
      >
        <Save className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(cat.id)}
        className="text-destructive/60 hover:text-destructive"
        title="Delete category"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function SortableGroupRow({
  group,
  expanded,
  onToggle,
  onEdit,
  onSave,
  onDelete,
  saving,
  categories,
  onAddCategory,
  onEditCategory,
  onSaveCategory,
  onDeleteCategory,
  onReorderCategories,
}: {
  group: FilterGroup;
  expanded: boolean;
  onToggle: () => void;
  onEdit: (field: "label_en" | "label_ru", value: string) => void;
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
  categories: Category[];
  onAddCategory: () => void;
  onEditCategory: (id: number, field: "label_en" | "label_ru" | "category_key", value: string) => void;
  onSaveCategory: (id: number) => void;
  onDeleteCategory: (id: number) => void;
  onReorderCategories: (newOrder: Category[]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: group.id,
  });

  const sensors = useSensors(useSensor(PointerSensor));

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleCatDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = categories.findIndex((c) => c.id === active.id);
    const newIdx = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIdx, newIdx).map((c, i) => ({
      ...c,
      sort_order: i + 1,
    }));
    onReorderCategories(reordered);
  };

  return (
    <div ref={setNodeRef} style={style} className="border border-border rounded-lg bg-card">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <input
          value={group.label_en}
          onChange={(e) => onEdit("label_en", e.target.value)}
          placeholder="Label EN"
          className="flex-1 bg-transparent text-sm text-foreground outline-none border-b border-transparent focus:border-border px-1"
        />
        <input
          value={group.label_ru}
          onChange={(e) => onEdit("label_ru", e.target.value)}
          placeholder="Label RU"
          className="flex-1 bg-transparent text-sm text-foreground outline-none border-b border-transparent focus:border-border px-1"
        />
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="text-primary hover:text-primary/80 disabled:opacity-50"
          title="Save group"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-destructive/60 hover:text-destructive"
          title="Delete group"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-border">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCatDragEnd}>
            <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5 pt-2">
                {categories.map((cat) => (
                  <SortableCategoryRow
                    key={cat.id}
                    cat={cat}
                    onEdit={onEditCategory}
                    onSave={onSaveCategory}
                    onDelete={onDeleteCategory}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <button
            type="button"
            onClick={onAddCategory}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-2"
          >
            <Plus className="w-3.5 h-3.5" /> Add category
          </button>
        </div>
      )}
    </div>
  );
}

export default function FilterGroupsEditor() {
  const [groups, setGroups] = useState<FilterGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [savingGroups, setSavingGroups] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ type: "group" | "category"; id: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    supabase
      .from("rule_filter_groups")
      .select("id, label_en, label_ru, sort_order")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setGroups((data as FilterGroup[]) ?? []));

    supabase
      .from("rule_categories")
      .select("id, category_key, group_id, label_en, label_ru, sort_order")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setCategories((data as Category[]) ?? []));
  }, []);

  const editGroup = (id: number, field: "label_en" | "label_ru", value: string) =>
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));

  const saveGroup = async (id: number) => {
    const g = groups.find((x) => x.id === id);
    if (!g) return;
    setSavingGroups((prev) => new Set(prev).add(id));
    await supabase
      .from("rule_filter_groups")
      .update({ label_en: g.label_en, label_ru: g.label_ru })
      .eq("id", id);
    setSavingGroups((prev) => { const s = new Set(prev); s.delete(id); return s; });
  };

  const addGroup = async () => {
    const maxOrder = groups.reduce((m, g) => Math.max(m, g.sort_order ?? 0), 0);
    const { data } = await supabase
      .from("rule_filter_groups")
      .insert({ label_en: "New Group", label_ru: "Новая группа", sort_order: maxOrder + 1 })
      .select()
      .single();
    if (data) setGroups((prev) => [...prev, data as FilterGroup]);
  };

  const handleGroupDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = groups.findIndex((g) => g.id === active.id);
    const newIdx = groups.findIndex((g) => g.id === over.id);
    const reordered = arrayMove(groups, oldIdx, newIdx).map((g, i) => ({ ...g, sort_order: i + 1 }));
    setGroups(reordered);
    for (const g of reordered) {
      await supabase.from("rule_filter_groups").update({ sort_order: g.sort_order }).eq("id", g.id);
    }
  };

  const editCategory = (id: number, field: "label_en" | "label_ru" | "category_key", value: string) =>
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

  const saveCategory = async (id: number) => {
    const c = categories.find((x) => x.id === id);
    if (!c) return;
    await supabase
      .from("rule_categories")
      .update({ label_en: c.label_en, label_ru: c.label_ru, category_key: c.category_key })
      .eq("id", id);
  };

  const addCategory = async (groupId: number) => {
    const groupCats = categories.filter((c) => c.group_id === groupId);
    const maxOrder = groupCats.reduce((m, c) => Math.max(m, c.sort_order ?? 0), 0);
    const { data } = await supabase
      .from("rule_categories")
      .insert({
        category_key: `new_category_${Date.now()}`,
        group_id: groupId,
        label_en: "New Category",
        label_ru: "Новая категория",
        sort_order: maxOrder + 1,
      })
      .select()
      .single();
    if (data) setCategories((prev) => [...prev, data as Category]);
  };

  const reorderCategories = async (newOrder: Category[]) => {
    setCategories((prev) => {
      const ids = new Set(newOrder.map((c) => c.id));
      return [...prev.filter((c) => !ids.has(c.id)), ...newOrder].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      );
    });
    for (const c of newOrder) {
      await supabase.from("rule_categories").update({ sort_order: c.sort_order }).eq("id", c.id);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    if (deleteTarget.type === "group") {
      await supabase.from("rule_filter_groups").delete().eq("id", deleteTarget.id);
      setGroups((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      setCategories((prev) => prev.filter((c) => c.group_id !== deleteTarget.id));
      if (expandedGroup === deleteTarget.id) setExpandedGroup(null);
    } else {
      await supabase.from("rule_categories").delete().eq("id", deleteTarget.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Filter Groups</h1>
        <button
          type="button"
          onClick={addGroup}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Add Group
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
        <SortableContext items={groups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {groups.map((g) => (
              <SortableGroupRow
                key={g.id}
                group={g}
                expanded={expandedGroup === g.id}
                onToggle={() => setExpandedGroup(expandedGroup === g.id ? null : g.id)}
                onEdit={(field, value) => editGroup(g.id, field, value)}
                onSave={() => saveGroup(g.id)}
                onDelete={() => setDeleteTarget({ type: "group", id: g.id })}
                saving={savingGroups.has(g.id)}
                categories={categories
                  .filter((c) => c.group_id === g.id)
                  .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))}
                onAddCategory={() => addCategory(g.id)}
                onEditCategory={editCategory}
                onSaveCategory={saveCategory}
                onDeleteCategory={(id) => setDeleteTarget({ type: "category", id })}
                onReorderCategories={reorderCategories}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        deleting={deleting}
      />
    </div>
  );
}
