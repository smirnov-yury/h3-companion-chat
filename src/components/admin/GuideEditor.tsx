import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";

interface GuideSection {
  id: string;
  slug: string;
  label_en: string;
  label_ru: string;
  sort_order: number;
  is_visible: boolean;
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

const ARRAY_KEYS = ["points", "items", "callouts", "abilities", "types", "tiers"];

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

export default function GuideEditor() {
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [panels, setPanels] = useState<GuidePanel[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filenames, setFilenames] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const load = async () => {
    const { data: secs } = await supabase
      .from("guide_sections")
      .select("id,slug,label_en,label_ru,sort_order,is_visible")
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Guide</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Expand a section to manage its panel images. Each panel shows every image slot it has — the main figure plus any per-item images.
        </p>
      </div>

      <div className="space-y-2">
        {sections.map((sec) => {
          const kids = panelsBySection[sec.id] ?? [];
          const isOpen = expanded === sec.id;
          return (
            <div key={sec.id} className="border border-border rounded-lg bg-card">
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : sec.id)}
                  className="text-muted-foreground hover:text-foreground"
                  title={isOpen ? "Collapse" : "Expand"}
                >
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <span className="text-xs font-mono text-muted-foreground">{sec.slug}</span>
                <span className="text-sm font-medium text-foreground">{sec.label_en}</span>
                <span className="text-xs text-muted-foreground ml-auto">{kids.length} panels</span>
                {sec.is_visible ? (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              {isOpen && (
                <div className="border-t border-border p-4 space-y-4">
                  {kids.map((panel) => {
                    const slots = slotsForPanel(panel);
                    return (
                      <div key={panel.id} className="border border-border rounded-lg p-4 space-y-3 bg-background">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            {panel.kind}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {panel.title_en || "(untitled)"}
                          </span>
                          {panel.title_ru && (
                            <span className="text-xs text-muted-foreground">{panel.title_ru}</span>
                          )}
                        </div>

                        {slots.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No image slots in this panel.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {slots.map((slot) => {
                              const fkey = `${panel.id}::${slot.id}`;
                              const current = basename(slot.current);
                              const fallback = `${panel.id}_${slot.id.replace(/\./g, "_")}.webp`;
                              const filenameInput = filenames[fkey] ?? current ?? fallback;
                              return (
                                <div key={slot.id} className="border border-border rounded-lg p-3 space-y-2 bg-card">
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-foreground">{slot.label}</p>
                                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                      Filename (saved under guide/)
                                    </label>
                                    <input
                                      type="text"
                                      value={filenameInput}
                                      onChange={(e) =>
                                        setFilenames((prev) => ({ ...prev, [fkey]: e.target.value }))
                                      }
                                      placeholder={fallback}
                                      className="w-full bg-transparent text-xs font-mono text-foreground outline-none border-b border-border focus:border-primary px-1 py-0.5"
                                    />
                                    <p className="text-[10px] font-mono text-muted-foreground">
                                      {slot.current ?? "no image"}
                                    </p>
                                  </div>

                                  <ImageUploader
                                    table="guide_panels"
                                    recordId={panel.id}
                                    folder="guide"
                                    imageField="content"
                                    currentImage={current}
                                    filename={filenameInput}
                                    skipDbUpdate
                                    hasImageStatus={false}
                                    onUploaded={(fn) => {
                                      if (fn) setSlotImage(panel, slot, fn);
                                    }}
                                    onDeleted={() => setSlotImage(panel, slot, null)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
