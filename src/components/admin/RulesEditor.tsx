import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Save, Loader2, ChevronRight, ChevronDown } from "lucide-react";
import GlyphToolbar from "@/components/admin/GlyphToolbar";
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

interface Rule {
  id: string;
  category: string | null;
  title_en: string | null;
  title_ru: string | null;
  text_en: string | null;
  text_ru: string | null;
  sort_order: number | null;
  ai_context: string | null;
}

const EMPTY_RULE: Omit<Rule, "id"> = {
  category: null,
  title_en: "",
  title_ru: "",
  text_en: "",
  text_ru: "",
  sort_order: 0,
  ai_context: "",
};

function generateId(category: string) {
  return `${category}_${Date.now()}`;
}

export default function RulesEditor() {
  const [groups, setGroups] = useState<FilterGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [form, setForm] = useState<Omit<Rule, "id">>(EMPTY_RULE);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textEnRef = useRef<HTMLTextAreaElement>(null);
  const textRuRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (!selectedCategory) {
      setRules([]);
      return;
    }
    supabase
      .from("rules")
      .select("id, category, title_en, title_ru, text_en, text_ru, sort_order, ai_context")
      .eq("category", selectedCategory)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setRules((data as Rule[]) ?? []));
  }, [selectedCategory]);

  const selectRule = (rule: Rule) => {
    setSelectedRule(rule);
    setIsNew(false);
    setForm({
      category: rule.category,
      title_en: rule.title_en ?? "",
      title_ru: rule.title_ru ?? "",
      text_en: rule.text_en ?? "",
      text_ru: rule.text_ru ?? "",
      sort_order: rule.sort_order,
      ai_context: rule.ai_context ?? "",
    });
    setError(null);
  };

  const startNew = () => {
    setSelectedRule(null);
    setIsNew(true);
    setForm({ ...EMPTY_RULE, category: selectedCategory });
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    if (isNew) {
      const id = generateId(form.category ?? "rule");
      const { error: e } = await supabase.from("rules").insert({ id, ...form });
      if (e) {
        setError(e.message);
        toast.error(e.message);
      } else {
        const newRule: Rule = { id, ...form };
        setRules((prev) =>
          [...prev, newRule].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
        );
        setSelectedRule(newRule);
        setIsNew(false);
        toast.success("Saved");
      }
    } else if (selectedRule) {
      const { error: e } = await supabase
        .from("rules")
        .update(form)
        .eq("id", selectedRule.id);
      if (e) {
        setError(e.message);
        toast.error(e.message);
      } else {
        setRules((prev) =>
          prev
            .map((r) => (r.id === selectedRule.id ? { ...r, ...form } : r))
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
        );
        setSelectedRule({ ...selectedRule, ...form });
        toast.success("Saved");
      }
    }
    setSaving(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRule) return;
    const { error: e } = await supabase.from("rules").delete().eq("id", selectedRule.id);
    if (e) {
      toast.error(e.message);
    } else {
      setRules((prev) => prev.filter((r) => r.id !== selectedRule.id));
      setSelectedRule(null);
      setForm(EMPTY_RULE);
      toast.success("Deleted");
    }
    setDeleteOpen(false);
  };

  const groupCats = categories.filter((c) => c.group_id === selectedGroup);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_260px_1fr] gap-4 h-[calc(100vh-8rem)]">
      {/* Left sidebar: groups + categories */}
      <div className="border border-border rounded-lg bg-card overflow-y-auto p-2 space-y-1">
        {groups.map((g) => {
          const open = selectedGroup === g.id;
          return (
            <div key={g.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedGroup(open ? null : g.id);
                  setSelectedCategory(null);
                  setSelectedRule(null);
                }}
                className={`flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  open
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <span>{g.label_en}</span>
                {open ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
              {open &&
                groupCats.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(c.category_key);
                      setSelectedRule(null);
                    }}
                    className={`w-full text-left pl-6 pr-3 py-1 rounded-lg text-xs transition-colors ${
                      selectedCategory === c.category_key
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {c.label_en}
                  </button>
                ))}
            </div>
          );
        })}
      </div>

      {/* Middle: rules list */}
      <div className="border border-border rounded-lg bg-card overflow-y-auto p-2 space-y-1">
        {selectedCategory ? (
          <>
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs text-muted-foreground">{rules.length} rules</span>
              <button
                type="button"
                onClick={startNew}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs hover:bg-primary/90"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            {rules.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => selectRule(r)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  selectedRule?.id === r.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                <div className="font-medium truncate">{r.title_en || r.id}</div>
                {r.sort_order != null && (
                  <div className="text-[10px] opacity-70">#{r.sort_order}</div>
                )}
              </button>
            ))}
          </>
        ) : (
          <p className="text-sm text-muted-foreground p-2">Select a category</p>
        )}
      </div>

      {/* Right: form */}
      <div className="border border-border rounded-lg bg-card overflow-y-auto p-4 space-y-4">
        {selectedRule || isNew ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {isNew ? "New Rule" : selectedRule?.id}
              </h3>
              <div className="flex items-center gap-2">
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  Save
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Category</label>
                <select
                  value={form.category ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value || null }))
                  }
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— none —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.category_key}>
                      {c.label_en} ({c.category_key})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Sort order</label>
                <input
                  type="number"
                  value={form.sort_order ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sort_order: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Title EN</label>
                <input
                  type="text"
                  value={form.title_en ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Title RU</label>
                <input
                  type="text"
                  value={form.title_ru ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, title_ru: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Text EN</label>
              <GlyphToolbar
                textareaRef={textEnRef}
                onChange={(v) => setForm((f) => ({ ...f, text_en: v }))}
              />
              <textarea
                ref={textEnRef}
                value={form.text_en ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, text_en: e.target.value }))}
                rows={6}
                className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring font-mono resize-y"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Text RU</label>
              <GlyphToolbar
                textareaRef={textRuRef}
                onChange={(v) => setForm((f) => ({ ...f, text_ru: v }))}
              />
              <textarea
                ref={textRuRef}
                value={form.text_ru ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, text_ru: e.target.value }))}
                rows={6}
                className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring font-mono resize-y"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">AI Context</label>
              <textarea
                value={form.ai_context ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, ai_context: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring resize-y"
              />
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {selectedCategory ? "Select a rule or create new" : "Select a category from the left"}
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
