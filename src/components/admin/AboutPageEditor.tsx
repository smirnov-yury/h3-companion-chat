import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Save, Loader2 } from "lucide-react";

const INPUT =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
const TEXTAREA = `${INPUT} resize-y`;

interface ContentRow {
  key: string;
  value_en: string | null;
  value_ru: string | null;
  content_type: string | null;
  updated_at: string | null;
}

interface ContentForm {
  value_en: string;
  value_ru: string;
}

export default function AboutPageEditor() {
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [selected, setSelected] = useState<ContentRow | null>(null);
  const [form, setForm] = useState<ContentForm>({ value_en: "", value_ru: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("app_content")
      .select("key, value_en, value_ru, content_type, updated_at")
      .order("key", { ascending: true })
      .then(({ data }) => setRows((data as ContentRow[]) ?? []));
  }, []);

  const selectRow = (row: ContentRow) => {
    setSelected(row);
    setForm({ value_en: row.value_en ?? "", value_ru: row.value_ru ?? "" });
    setError(null);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    const { error: e } = await supabase
      .from("app_content")
      .update({ value_en: form.value_en || null, value_ru: form.value_ru || null })
      .eq("key", selected.key);
    if (e) {
      setError(e.message);
      toast.error(e.message);
    } else {
      setRows((prev) => prev.map((r) => (r.key === selected.key ? { ...r, ...form } : r)));
      setSelected((prev) => (prev ? { ...prev, ...form } : null));
      toast.success("Saved");
    }
    setSaving(false);
  };

  const isJson = selected?.content_type === "json";
  const isTextarea = selected?.content_type === "textarea" || isJson;

  const label = (text: string, node: React.ReactNode) => (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{text}</div>
      {node}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 h-full">
      {/* Left list */}
      <div className="border border-border rounded-lg bg-card flex flex-col min-h-0">
        <div className="px-3 py-2 border-b border-border">
          <h2 className="text-sm font-semibold">Content keys ({rows.length})</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {rows.map((row) => (
            <button
              key={row.key}
              type="button"
              onClick={() => selectRow(row)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                selected?.key === row.key
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <div className="font-medium truncate">{row.key}</div>
              <div className="opacity-70 text-[10px] mt-0.5">{row.content_type ?? "text"}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="border border-border rounded-lg bg-card p-4 overflow-y-auto">
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">{selected.key}</h2>
                <p className="text-xs text-muted-foreground">Type: {selected.content_type ?? "text"}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>

            {error && <div className="text-xs text-destructive">{error}</div>}

            <div className="space-y-3">
              {label(
                "Value EN",
                isTextarea ? (
                  <textarea
                    value={form.value_en}
                    onChange={(e) => setForm((prev) => ({ ...prev, value_en: e.target.value }))}
                    rows={isJson ? 10 : 5}
                    className={`${TEXTAREA} ${isJson ? "font-mono text-xs" : ""}`}
                  />
                ) : (
                  <input
                    type="text"
                    value={form.value_en}
                    onChange={(e) => setForm((prev) => ({ ...prev, value_en: e.target.value }))}
                    className={INPUT}
                  />
                )
              )}
              {label(
                "Value RU",
                isTextarea ? (
                  <textarea
                    value={form.value_ru}
                    onChange={(e) => setForm((prev) => ({ ...prev, value_ru: e.target.value }))}
                    rows={isJson ? 10 : 5}
                    className={`${TEXTAREA} ${isJson ? "font-mono text-xs" : ""}`}
                  />
                ) : (
                  <input
                    type="text"
                    value={form.value_ru}
                    onChange={(e) => setForm((prev) => ({ ...prev, value_ru: e.target.value }))}
                    className={INPUT}
                  />
                )
              )}
            </div>

            {isJson && (
              <p className="text-xs text-muted-foreground">JSON field — edit as raw JSON text.</p>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Select a content key to edit</div>
        )}
      </div>
    </div>
  );
}
