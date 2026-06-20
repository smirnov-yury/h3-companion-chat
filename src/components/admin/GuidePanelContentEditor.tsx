import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, ChevronUp, ChevronDown, Save, Loader2, MapPin } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import { componentMediaUrl } from "@/lib/storage";
import GlyphToolbar from "@/components/admin/GlyphToolbar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  panel: { id: string; kind: string; content: any };
  sectionSlug?: string;
  panelSort?: number;
  onSaved: (content: any) => void;
}

const clone = (o: any) => JSON.parse(JSON.stringify(o ?? {}));
const FIELD = "w-full bg-transparent text-xs text-foreground outline-none border-b border-border focus:border-primary px-1 py-0.5";

function basename(p: string | null | undefined): string | null {
  if (!p) return null;
  const i = p.lastIndexOf("/");
  return i >= 0 ? p.slice(i + 1) : p;
}

export default function GuidePanelContentEditor({ panel, sectionSlug, panelSort, onSaved }: Props) {
  const [content, setContent] = useState<any>(() => clone(panel.content));
  const [lang, setLang] = useState<"en" | "ru">("en");
  const [adv, setAdv] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filenames, setFilenames] = useState<Record<string, string>>({});
  const [sel, setSel] = useState<number | null>(null);
  const [placing, setPlacing] = useState(false);
  const dragRef = useRef<number | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [glyphOpen, setGlyphOpen] = useState(false);
  const [previewVer, setPreviewVer] = useState<number>(() => Date.now());
  const focusRef = useRef<{ el: HTMLInputElement | HTMLTextAreaElement; set: (v: string) => void } | null>(null);
  const glyphTargetRef = { get current() { return focusRef.current?.el ?? null; } } as React.RefObject<HTMLTextAreaElement>;
  const contentRef = useRef<any>(content);
  contentRef.current = content;

  const slotName = (key: string) => `${sectionSlug || panel.id}_p${panelSort ?? 0}_${key}.webp`;

  const update = (fn: (c: any) => void) => setContent((prev: any) => { const next = clone(prev); fn(next); return next; });
  const persist = async (next: any) => {
    setContent(next);
    await supabase.from("guide_panels").update({ content: next }).eq("id", panel.id);
    onSaved(next);
  };

  const walk = (root: any, path: (string | number)[]) => {
    let o = root;
    for (let i = 0; i < path.length - 1; i++) { const k = path[i]; if (o[k] == null) o[k] = typeof path[i + 1] === "number" ? [] : {}; o = o[k]; }
    return o;
  };
  const setLocPath = (path: (string | number)[], val: string) => update((c) => { const o = walk(c, path); const k = path[path.length - 1]; o[k] = o[k] ?? {}; o[k][lang] = val; if (!o[k].en && !o[k].ru) delete o[k]; });
  const setStrPath = (path: (string | number)[], val: string) => update((c) => { const o = walk(c, path); const k = path[path.length - 1]; if (val) o[k] = val; else delete o[k]; });
  const setNumPath = (path: (string | number)[], val: string) => update((c) => { const o = walk(c, path); const k = path[path.length - 1]; if (val === "") delete o[k]; else o[k] = Number(val); });
  const setBoolPath = (path: (string | number)[], val: boolean) => update((c) => { const o = walk(c, path); const k = path[path.length - 1]; if (val) o[k] = true; else delete o[k]; });

  const loc = (obj: any, k: string) => obj?.[k]?.[lang] ?? "";

  const moveItem = (key: string, i: number, dir: number) => update((c) => { const arr = Array.isArray(c[key]) ? c[key] : []; const j = i + dir; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; c[key] = arr; });
  const removeItem = (key: string, i: number) => update((c) => { const arr = [...(c[key] ?? [])]; arr.splice(i, 1); c[key] = arr; });
  const addItem = (key: string, blank: any) => update((c) => { c[key] = [...(c[key] ?? []), blank]; });

  const setImageAt = async (path: (string | number)[], filename: string | null) => {
    const next = clone(contentRef.current);
    const o = walk(next, path); const k = path[path.length - 1];
    if (filename) o[k] = `guide/${filename}`; else delete o[k];
    await persist(next);
  };

  const save = async () => { setSaving(true); await persist(clone(contentRef.current)); setPreviewVer(Date.now()); setSaving(false); };

  const callouts: any[] = Array.isArray(content.callouts) ? content.callouts : [];
  const nextPin = () => callouts.reduce((m: number, c: any) => Math.max(m, typeof c.pin === "number" ? c.pin : 0), 0) + 1;

  const pct = (e: { clientX: number; clientY: number }) => {
    const r = boardRef.current!.getBoundingClientRect();
    return { left: `${Math.max(0, Math.min(100, Math.round((e.clientX - r.left) / r.width * 100)))}%`, top: `${Math.max(0, Math.min(100, Math.round((e.clientY - r.top) / r.height * 100)))}%` };
  };
  const onBoardClick = (e: React.MouseEvent) => {
    if (!placing) return;
    const { left, top } = pct(e);
    const next = clone(contentRef.current);
    next.callouts = Array.isArray(next.callouts) ? next.callouts : [];
    next.callouts.push({ pin: nextPin(), left, top, label: {} });
    setPlacing(false);
    setSel(next.callouts.length - 1);
    persist(next);
  };
  const onBoardMove = (e: React.MouseEvent) => {
    if (dragRef.current === null) return;
    const i = dragRef.current; const { left, top } = pct(e);
    update((c) => { if (c.callouts?.[i]) { c.callouts[i].left = left; c.callouts[i].top = top; } });
  };
  const endDrag = () => { if (dragRef.current !== null) { dragRef.current = null; persist(clone(contentRef.current)); } };
  useEffect(() => {
    const up = () => endDrag();
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const Lfield = (label: string, obj: any, k: string, path: (string | number)[], area?: boolean) => (
    <div>
      <label className="block text-[10px] text-muted-foreground mb-0.5">{label} ({lang.toUpperCase()})</label>
      {area
        ? <textarea value={loc(obj, k)} onFocus={(e) => { focusRef.current = { el: e.currentTarget, set: (v) => setLocPath(path, v) }; }} onChange={(e) => setLocPath(path, e.target.value)} rows={2} className={`${FIELD} resize-y`} />
        : <input value={loc(obj, k)} onFocus={(e) => { focusRef.current = { el: e.currentTarget, set: (v) => setLocPath(path, v) }; }} onChange={(e) => setLocPath(path, e.target.value)} className={FIELD} />}
    </div>
  );
  const imgSlot = (slotKey: string, current: string | null, imgPath: (string | number)[]) => {
    const base = basename(current);
    return (
      <div className="w-32 shrink-0">
        <ImageUploader table="guide_panels" recordId={panel.id} folder="guide" imageField="image_path" currentImage={base} skipDbUpdate hasImageStatus={false} defaultCropPreset="free"
          filename={(filenames[slotKey] && filenames[slotKey].trim()) || base || slotName(slotKey)}
          onUploaded={(fn) => { if (fn) { setImageAt(imgPath, fn); setPreviewVer(Date.now()); } }} onDeleted={() => { setImageAt(imgPath, null); setPreviewVer(Date.now()); }} />
        <input value={filenames[slotKey] ?? base ?? ""} onChange={(e) => setFilenames((p) => ({ ...p, [slotKey]: e.target.value }))} placeholder={slotName(slotKey)} className="w-32 mt-1 bg-transparent text-[10px] font-mono text-muted-foreground outline-none border-b border-border focus:border-primary px-1" />
      </div>
    );
  };
  const itemHeader = (title: string, key: string, i: number, len: number) => (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-muted-foreground">{title}</span>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => moveItem(key, i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30" title="Up"><ChevronUp className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => moveItem(key, i, 1)} disabled={i === len - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30" title="Down"><ChevronDown className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => removeItem(key, i)} className="text-destructive/60 hover:text-destructive" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
  const advGlyph = (obj: any, path: (string | number)[]) => adv ? (<div><label className="block text-[10px] text-muted-foreground mb-0.5">Glyph</label><input value={obj.glyph ?? ""} onChange={(e) => setStrPath(path, e.target.value)} className={`${FIELD} w-40`} /></div>) : null;

  const kind = panel.kind;
  const points: any[] = Array.isArray(content.points) ? content.points : [];
  const items: any[] = Array.isArray(content.items) ? content.items : [];
  const abilities: any[] = Array.isArray(content.abilities) ? content.abilities : [];
  const types: any[] = Array.isArray(content.types) ? content.types : [];
  const tiers: any[] = Array.isArray(content.tiers) ? content.tiers : [];
  const steps: any[] = Array.isArray(content.steps) ? content.steps : [];
  const isFigure = kind === "standard" || kind === "anatomy";

  return (
    <div className="space-y-4 border border-border rounded-md p-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <div className="inline-flex border border-border rounded-md overflow-hidden">
          {(["en", "ru"] as const).map((l) => (<button key={l} type="button" onClick={() => setLang(l)} className={`text-xs px-3 py-1 ${lang === l ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"}`}>{l.toUpperCase()}</button>))}
        </div>
        <div className="flex items-center gap-2">
          <Popover open={glyphOpen} onOpenChange={setGlyphOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="text-[11px] text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1">Glyphs</button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-0">
              <GlyphToolbar textareaRef={glyphTargetRef} onChange={(v) => { focusRef.current?.set(v); setGlyphOpen(false); }} />
            </PopoverContent>
          </Popover>
          <button type="button" onClick={() => setAdv((v) => !v)} className="text-[11px] text-muted-foreground hover:text-foreground">{adv ? "Hide advanced" : "Show advanced"}</button>
          <button type="button" onClick={save} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-50">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save content</button>
        </div>
      </div>

      {isFigure && (
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <div className="text-[11px] font-medium text-muted-foreground">Main image</div>
            {kind === "standard" && Lfield("Caption", content, "cap", ["cap"])}
            {kind === "anatomy" && Lfield("Figure name", content, "uname", ["uname"])}
            {Lfield("Image note", content, "image_note", ["image_note"], true)}
            {adv && (
              <div className="flex gap-3">
                <div><label className="block text-[10px] text-muted-foreground mb-0.5">PDF page</label><input type="number" value={content.page ?? ""} onChange={(e) => setNumPath(["page"], e.target.value)} className={`${FIELD} w-20`} /></div>
              </div>
            )}
          </div>
          {imgSlot("main", content.image_path ?? null, ["image_path"])}
        </div>
      )}

      {kind === "anatomy" && (
        <>
          <div className="space-y-2">
            {Lfield("Lead", content, "lead", ["lead"], true)}
            <div>
              <label className="block text-[10px] text-muted-foreground mb-0.5">Intro bullets ({lang.toUpperCase()}, one per line)</label>
              <textarea rows={3} className={`${FIELD} resize-y`} value={Array.isArray(content.intro?.[lang]) ? content.intro[lang].join("\n") : ""} onChange={(e) => update((c) => { c.intro = c.intro ?? {}; c.intro[lang] = e.target.value.split("\n"); const en = Array.isArray(c.intro.en) && c.intro.en.some((x: string) => x.trim()); const ru = Array.isArray(c.intro.ru) && c.intro.ru.some((x: string) => x.trim()); if (!en && !ru) delete c.intro; })} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">Pins on image</span>
              <button type="button" onClick={() => setPlacing((p) => !p)} className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border ${placing ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}><MapPin className="w-3 h-3" /> {placing ? "Click image to place" : "Add pin"}</button>
            </div>
            {content.image_path ? (
              <div ref={boardRef} onClick={onBoardClick} onPointerMove={onBoardMove} className="relative w-full max-w-md rounded-md border border-border overflow-hidden select-none" style={{ cursor: placing ? "crosshair" : "default" }}>
                <img src={`${componentMediaUrl(content.image_path)}?v=${previewVer}`} alt="" className="w-full block pointer-events-none" />
                {callouts.map((c, i) => c.noPin ? null : (
                  <button key={i} type="button"
                    onPointerDown={(e) => { e.stopPropagation(); setSel(i); dragRef.current = i; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
                    style={{ top: c.top ?? "10%", left: c.left ?? "10%" }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center cursor-grab border border-primary-foreground/30 ${sel === i ? "bg-primary text-primary-foreground ring-4 ring-primary/30 scale-110" : "bg-primary/90 text-primary-foreground"}`}>
                    {c.pin}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-[11px] italic text-muted-foreground border border-dashed border-border rounded-md p-4 text-center">Upload the main image above first, then add pins.</div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Callouts ({callouts.length})</span>
              <button type="button" onClick={() => addItem("callouts", { pin: nextPin(), label: {} })} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"><Plus className="w-3 h-3" /> Add callout</button>
            </div>
            {callouts.map((c0, i) => (
              <div key={i} onClick={() => setSel(i)} className={`border rounded-md p-2.5 space-y-2 bg-background ${sel === i ? "border-primary" : "border-border"}`}>
                {itemHeader(`callout ${i + 1} (pin ${c0.pin ?? "?"})`, "callouts", i, callouts.length)}
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    {Lfield("Label", c0, "label", ["callouts", i, "label"])}
                    {Lfield("Short", c0, "d", ["callouts", i, "d"])}
                    {Lfield("Detail text", c0, "text", ["callouts", i, "text"], true)}
                    {adv && (
                      <div className="grid grid-cols-4 gap-2 items-end">
                        <div><label className="block text-[10px] text-muted-foreground mb-0.5">Pin #</label><input type="number" value={c0.pin ?? ""} onChange={(e) => setNumPath(["callouts", i, "pin"], e.target.value)} className={FIELD} /></div>
                        <div className="flex items-center gap-1 pb-1"><input type="checkbox" checked={!!c0.noPin} onChange={(e) => setBoolPath(["callouts", i, "noPin"], e.target.checked)} /><span className="text-[10px] text-muted-foreground">no pin</span></div>
                        <div><label className="block text-[10px] text-muted-foreground mb-0.5">Top</label><input value={c0.top ?? ""} onChange={(e) => setStrPath(["callouts", i, "top"], e.target.value)} className={FIELD} /></div>
                        <div><label className="block text-[10px] text-muted-foreground mb-0.5">Left</label><input value={c0.left ?? ""} onChange={(e) => setStrPath(["callouts", i, "left"], e.target.value)} className={FIELD} /></div>
                      </div>
                    )}
                    {advGlyph(c0, ["callouts", i, "glyph"])}
                  </div>
                  {imgSlot(`callout${i + 1}`, c0?.image ?? null, ["callouts", i, "image"])}
                </div>
              </div>
            ))}
          </div>

          <Section title={`Abilities (${abilities.length})`} onAdd={() => addItem("abilities", { label: {} })} addLabel="Add ability">
            {abilities.map((a, i) => (
              <div key={i} className="border border-border rounded-md p-2.5 space-y-2 bg-background">
                {itemHeader(`ability ${i + 1}`, "abilities", i, abilities.length)}
                <div className="flex gap-3"><div className="flex-1 space-y-2">{Lfield("Label", a, "label", ["abilities", i, "label"])}{Lfield("Text", a, "text", ["abilities", i, "text"], true)}{advGlyph(a, ["abilities", i, "glyph"])}</div>{imgSlot(`ability${i + 1}`, a?.image ?? null, ["abilities", i, "image"])}</div>
              </div>
            ))}
          </Section>
        </>
      )}

      {kind === "standard" && (
        <>
          <Section title={`Points (${points.length})`} onAdd={() => addItem("points", { label: {}, detail: {} })} addLabel="Add point">
            {points.map((p, i) => (
              <div key={i} className="border border-border rounded-md p-2.5 space-y-2 bg-background">
                {itemHeader(`point ${i + 1}`, "points", i, points.length)}
                <div className="flex gap-3"><div className="flex-1 space-y-2">{Lfield("Label", p, "label", ["points", i, "label"])}{Lfield("Detail title", p.detail ?? {}, "title", ["points", i, "detail", "title"])}{Lfield("Detail text", p.detail ?? {}, "text", ["points", i, "detail", "text"], true)}</div>{imgSlot(`point${i + 1}`, p?.detail?.image ?? null, ["points", i, "detail", "image"])}</div>
              </div>
            ))}
          </Section>
          <Section title={`Items (${items.length})`} onAdd={() => addItem("items", { label: {} })} addLabel="Add item">
            {items.map((it, i) => (
              <div key={i} className="border border-border rounded-md p-2.5 space-y-2 bg-background">
                {itemHeader(`item ${i + 1}`, "items", i, items.length)}
                <div className="flex gap-3"><div className="flex-1 space-y-2">{Lfield("Label", it, "label", ["items", i, "label"])}{Lfield("Text", it, "text", ["items", i, "text"], true)}{advGlyph(it, ["items", i, "glyph"])}{adv && <div><label className="block text-[10px] text-muted-foreground mb-0.5">Link route</label><input value={it.route ?? ""} onChange={(e) => update((c) => { const v = e.target.value; if (v) { c.items[i].route = v; c.items[i].mode = "open"; } else { delete c.items[i].route; delete c.items[i].mode; } })} className={FIELD} /></div>}{adv && Lfield("Link label", it, "target", ["items", i, "target"])}</div>{imgSlot(`item${i + 1}`, it?.image ?? null, ["items", i, "image"])}</div>
              </div>
            ))}
          </Section>
        </>
      )}

      {kind === "types" && (
        <>
          <Section title={`Types (${types.length})`} onAdd={() => addItem("types", { label: {} })} addLabel="Add type">
            {types.map((t, i) => (
              <div key={i} className="border border-border rounded-md p-2.5 space-y-2 bg-background">
                {itemHeader(`type ${i + 1}`, "types", i, types.length)}
                <div className="flex gap-3"><div className="flex-1 space-y-2">{Lfield("Label", t, "label", ["types", i, "label"])}{Lfield("Short", t, "short", ["types", i, "short"])}{Lfield("Detail text", t, "text", ["types", i, "text"], true)}{advGlyph(t, ["types", i, "glyph"])}</div>{imgSlot(`type${i + 1}`, t?.image ?? null, ["types", i, "image"])}</div>
              </div>
            ))}
          </Section>
          <Section title={`Tiers (${tiers.length})`} onAdd={() => addItem("tiers", { label: {} })} addLabel="Add tier">
            {tiers.map((t, i) => (
              <div key={i} className="border border-border rounded-md p-2.5 space-y-2 bg-background">
                {itemHeader(`tier ${i + 1}`, "tiers", i, tiers.length)}
                <div className="flex gap-3"><div className="flex-1 space-y-2">{Lfield("Label", t, "label", ["tiers", i, "label"])}{Lfield("Text", t, "text", ["tiers", i, "text"], true)}{advGlyph(t, ["tiers", i, "glyph"])}</div>{imgSlot(`tier${i + 1}`, t?.image ?? null, ["tiers", i, "image"])}</div>
              </div>
            ))}
          </Section>
          {Lfield("Note", content, "note", ["note"], true)}
        </>
      )}

      {kind === "example" && (
        <>
          {Lfield("Intro", content, "intro", ["intro"], true)}
          {Lfield("Outro", content, "outro", ["outro"], true)}
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-muted-foreground">Flip (before / after)</div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-[10px] text-muted-foreground mb-0.5">Left big</label><input value={content.flip?.left ?? ""} onChange={(e) => setStrPath(["flip", "left"], e.target.value)} className={FIELD} /></div>
              <div><label className="block text-[10px] text-muted-foreground mb-0.5">Right big</label><input value={content.flip?.right ?? ""} onChange={(e) => setStrPath(["flip", "right"], e.target.value)} className={FIELD} /></div>
            </div>
            {Lfield("Left sub", content.flip ?? {}, "leftSub", ["flip", "leftSub"])}
            {Lfield("Middle", content.flip ?? {}, "mid", ["flip", "mid"])}
            {Lfield("Right sub", content.flip ?? {}, "rightSub", ["flip", "rightSub"])}
          </div>
          <Section title={`Steps (${steps.length})`} onAdd={() => addItem("steps", { t: {}, d: {} })} addLabel="Add step">
            {steps.map((s, i) => (
              <div key={i} className="border border-border rounded-md p-2.5 space-y-2 bg-background">
                {itemHeader(`step ${i + 1}`, "steps", i, steps.length)}
                {Lfield("Lead (bold)", s, "t", ["steps", i, "t"])}
                {Lfield("Rest", s, "d", ["steps", i, "d"], true)}
              </div>
            ))}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, onAdd, addLabel, children }: { title: string; onAdd: () => void; addLabel: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{title}</span>
        <button type="button" onClick={onAdd} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"><Plus className="w-3 h-3" /> {addLabel}</button>
      </div>
      {children}
    </div>
  );
}
