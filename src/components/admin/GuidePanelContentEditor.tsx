import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, ChevronUp, ChevronDown, Save, Loader2 } from "lucide-react";

interface Props {
  panel: { id: string; kind: string; content: any };
  onSaved: (content: any) => void;
}

const clone = (o: any) => JSON.parse(JSON.stringify(o ?? {}));

const FIELD =
  "w-full bg-transparent text-xs text-foreground outline-none border-b border-border focus:border-primary px-1 py-0.5";

function LocRow({
  label,
  obj,
  k,
  onChange,
  area,
}: {
  label: string;
  obj: any;
  k: string;
  onChange: (lang: "en" | "ru", val: string) => void;
  area?: boolean;
}) {
  const en = obj?.[k]?.en ?? "";
  const ru = obj?.[k]?.ru ?? "";
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="block text-[10px] text-muted-foreground mb-0.5">{label} EN</label>
        {area ? (
          <textarea
            value={en}
            onChange={(e) => onChange("en", e.target.value)}
            rows={2}
            className={`${FIELD} resize-y`}
          />
        ) : (
          <input value={en} onChange={(e) => onChange("en", e.target.value)} className={FIELD} />
        )}
      </div>
      <div>
        <label className="block text-[10px] text-muted-foreground mb-0.5">{label} RU</label>
        {area ? (
          <textarea
            value={ru}
            onChange={(e) => onChange("ru", e.target.value)}
            rows={2}
            className={`${FIELD} resize-y`}
          />
        ) : (
          <input value={ru} onChange={(e) => onChange("ru", e.target.value)} className={FIELD} />
        )}
      </div>
    </div>
  );
}

export default function GuidePanelContentEditor({ panel, onSaved }: Props) {
  const [content, setContent] = useState<any>(() => clone(panel.content));
  const [saving, setSaving] = useState(false);

  const update = (fn: (c: any) => void) =>
    setContent((prev: any) => {
      const next = clone(prev);
      fn(next);
      return next;
    });

  const setLoc = (obj: any, key: string, lang: "en" | "ru", val: string) => {
    obj[key] = obj[key] ?? {};
    obj[key][lang] = val;
    if (!obj[key].en && !obj[key].ru) delete obj[key];
  };

  const moveItem = (key: string, i: number, dir: number) =>
    update((c) => {
      const arr = Array.isArray(c[key]) ? c[key] : [];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      c[key] = arr;
    });

  const removeItem = (key: string, i: number) =>
    update((c) => {
      const arr = [...(c[key] ?? [])];
      arr.splice(i, 1);
      c[key] = arr;
    });

  const addItem = (key: string, blank: any) =>
    update((c) => {
      c[key] = [...(c[key] ?? []), blank];
    });

  const save = async () => {
    setSaving(true);
    const clean = clone(content);
    await supabase.from("guide_panels").update({ content: clean }).eq("id", panel.id);
    setSaving(false);
    onSaved(clean);
  };

  if (panel.kind !== "standard") {
    return (
      <p className="text-[11px] italic text-muted-foreground">
        Content form for "{panel.kind}" panels is not built yet — use the image slots below. (Text
        editing for this kind comes in a later update.)
      </p>
    );
  }

  const points: any[] = Array.isArray(content.points) ? content.points : [];
  const items: any[] = Array.isArray(content.items) ? content.items : [];

  return (
    <div className="space-y-4 border border-border rounded-md p-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">Content</span>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          content
        </button>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-medium text-muted-foreground">Figure</div>
        <div>
          <label className="block text-[10px] text-muted-foreground mb-0.5">PDF page</label>
          <input
            type="number"
            value={content.page ?? ""}
            onChange={(e) =>
              update((c) => {
                const v = e.target.value;
                if (v === "") delete c.page;
                else c.page = Number(v);
              })
            }
            className="w-24 bg-transparent text-xs text-foreground outline-none border-b border-border focus:border-primary px-1 py-0.5"
          />
        </div>
        <LocRow
          label="Caption"
          obj={content}
          k="cap"
          onChange={(lang, v) => update((c) => setLoc(c, "cap", lang, v))}
        />
        <LocRow
          label="Image note"
          obj={content}
          k="image_note"
          onChange={(lang, v) => update((c) => setLoc(c, "image_note", lang, v))}
          area
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">Points ({points.length})</span>
          <button
            type="button"
            onClick={() => addItem("points", { label: {}, detail: {} })}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-3 h-3" /> Add point
          </button>
        </div>
        {points.map((p, i) => (
          <div key={i} className="border border-border rounded-md p-2.5 space-y-2 bg-background">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">point {i + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveItem("points", i, -1)}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Move up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem("points", i, 1)}
                  disabled={i === points.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Move down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeItem("points", i)}
                  className="text-destructive/60 hover:text-destructive"
                  title="Delete point"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <LocRow
              label="Label"
              obj={p}
              k="label"
              onChange={(lang, v) => update((c) => setLoc(c.points[i], "label", lang, v))}
            />
            <LocRow
              label="Detail title"
              obj={p.detail ?? {}}
              k="title"
              onChange={(lang, v) =>
                update((c) => {
                  c.points[i].detail = c.points[i].detail ?? {};
                  setLoc(c.points[i].detail, "title", lang, v);
                })
              }
            />
            <LocRow
              label="Detail text"
              obj={p.detail ?? {}}
              k="text"
              area
              onChange={(lang, v) =>
                update((c) => {
                  c.points[i].detail = c.points[i].detail ?? {};
                  setLoc(c.points[i].detail, "text", lang, v);
                })
              }
            />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">Items ({items.length})</span>
          <button
            type="button"
            onClick={() => addItem("items", { label: {} })}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-3 h-3" /> Add item
          </button>
        </div>
        {items.map((it, i) => (
          <div key={i} className="border border-border rounded-md p-2.5 space-y-2 bg-background">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">item {i + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveItem("items", i, -1)}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Move up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem("items", i, 1)}
                  disabled={i === items.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Move down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeItem("items", i)}
                  className="text-destructive/60 hover:text-destructive"
                  title="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <LocRow
              label="Label"
              obj={it}
              k="label"
              onChange={(lang, v) => update((c) => setLoc(c.items[i], "label", lang, v))}
            />
            <LocRow
              label="Text"
              obj={it}
              k="text"
              area
              onChange={(lang, v) => update((c) => setLoc(c.items[i], "text", lang, v))}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-muted-foreground mb-0.5">Glyph</label>
                <input
                  value={it.glyph ?? ""}
                  onChange={(e) =>
                    update((c) => {
                      const v = e.target.value;
                      if (v) c.items[i].glyph = v;
                      else delete c.items[i].glyph;
                    })
                  }
                  className={FIELD}
                />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground mb-0.5">Route (optional)</label>
                <input
                  value={it.route ?? ""}
                  onChange={(e) =>
                    update((c) => {
                      const v = e.target.value;
                      if (v) {
                        c.items[i].route = v;
                        c.items[i].mode = "open";
                      } else {
                        delete c.items[i].route;
                        delete c.items[i].mode;
                      }
                    })
                  }
                  className={FIELD}
                />
              </div>
            </div>
            <LocRow
              label="Route label"
              obj={it}
              k="target"
              onChange={(lang, v) => update((c) => setLoc(c.items[i], "target", lang, v))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
