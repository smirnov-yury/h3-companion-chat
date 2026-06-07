import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, List, Check, ArrowRight, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang, type Lang } from "@/context/LanguageContext";
import { componentMediaUrl } from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import H3MasterSpinner from "@/components/H3MasterSpinner";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { useCardLayoutById } from "@/hooks/useCardLayouts";

// ---------- Types ----------
type LocStr = { ru?: string; en?: string } | undefined;
type LocList = { ru?: string[]; en?: string[] } | undefined;

interface GuideSectionRow {
  id: string;
  slug: string;
  label_en: string;
  label_ru: string;
  icon: string | null;
  sort_order: number;
  is_visible: boolean;
  intro_en: string | null;
  intro_ru: string | null;
}

type PanelKind = "standard" | "anatomy" | "types" | "example";

interface GuidePanelRow {
  id: string;
  section_id: string;
  sort_order: number;
  kind: PanelKind;
  title_en: string | null;
  title_ru: string | null;
  content: any;
}

interface ModalState {
  title: string;
  glyph?: string | null;
  text?: string;
  imagePath?: string | null;
  imageLayout?: string | null;
  imageNote?: string;
  route?: string;
  routeLabel?: string;
}

// ---------- Helpers ----------
const tr = (v: LocStr, lang: Lang): string => {
  if (!v) return "";
  return (lang === "RU" ? v.ru : v.en) ?? v.en ?? v.ru ?? "";
};
const trList = (v: LocList, lang: Lang): string[] => {
  if (!v) return [];
  return (lang === "RU" ? v.ru : v.en) ?? v.en ?? v.ru ?? [];
};

/** Themed inline glyph icon. Routes through renderGlyphs so the icon
 *  inherits the app's dark/light theming and multicolor classes. */
function GlyphIcon({
  glyph,
  size,
  className,
}: {
  glyph?: string | null;
  size?: number;
  className?: string;
}) {
  const { glyphs } = useGlyphs();
  if (!glyph) return null;
  const style = size ? { fontSize: `${size}px`, lineHeight: 1 } : undefined;
  const cls = className
    ? `inline-flex items-center leading-none ${className}`
    : "inline-flex items-center text-[1.15em] leading-none";
  return (
    <span
      style={style}
      className={cls}
      dangerouslySetInnerHTML={{ __html: renderGlyphs(`<${glyph}>`, glyphs) }}
    />
  );
}

function FigurePlaceholder({
  aspect,
  cap,
  page,
  src,
  folder,
  note,
  lang,
}: { aspect: "card" | "board"; cap: string; page?: number; src?: string; folder?: string; note?: string; lang: Lang }) {
  const tagText = src === "st"
    ? `storage · ${folder ?? ""}`
    : `PDF rc4 · p.${page ?? "?"}`;
  const tagClass = src === "st"
    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    : "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  const aspectClass = aspect === "card" ? "aspect-[5/7]" : "aspect-[16/10]";
  return (
    <div className={`relative w-full ${aspectClass} rounded-lg border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center text-center p-4`}>
      <div className="text-xs text-muted-foreground">{cap || (lang === "RU" ? "Изображение скоро" : "Image coming soon")}</div>
      {note && <div className="mt-1 text-[11px] italic text-muted-foreground/80 max-w-[90%]">{note}</div>}
      <div className={`mt-2 text-[10px] px-2 py-0.5 rounded ${tagClass}`}>{tagText}</div>
    </div>
  );
}

function Figure({
  imagePath,
  aspect,
  cap,
  page,
  src,
  folder,
  note,
  lang,
  children,
}: {
  imagePath: string | null | undefined;
  aspect: "card" | "board";
  cap: string;
  page?: number;
  src?: string;
  folder?: string;
  note?: string;
  lang: Lang;
  children?: React.ReactNode;
}) {
  const aspectClass = aspect === "card" ? "aspect-[5/7]" : "aspect-[16/10]";
  if (!imagePath) {
    return (
      <div className="relative">
        <FigurePlaceholder aspect={aspect} cap={cap} page={page} src={src} folder={folder} note={note} lang={lang} />
        {children}
      </div>
    );
  }
  return (
    <div className={`relative w-full ${aspectClass} rounded-lg overflow-hidden bg-muted/30 border border-border`}>
      <img src={componentMediaUrl(imagePath)} alt={cap} className="w-full h-full object-contain" />
      {children}
    </div>
  );
}

/** Render simple bullets supporting inline <b>...</b>. */
function BulletList({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <ul className="space-y-1.5 list-disc list-outside pl-5 text-sm">
      {lines.map((l, i) => (
        <li key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: l }} />
      ))}
    </ul>
  );
}

// ---------- Panel renderers ----------
function StandardPanel({
  content,
  title,
  lang,
  setModal,
}: {
  content: any;
  title: string;
  lang: Lang;
  setModal: (m: ModalState) => void;
  navigate: (to: string) => void;
}) {
  const cap = tr(content.cap, lang);
  const points: any[] = Array.isArray(content.points) ? content.points : [];
  const items: any[] = Array.isArray(content.items) ? content.items : [];
  return (
    <div className="space-y-4">
      <Figure
        imagePath={content.image_path}
        aspect="board"
        cap={cap}
        page={content.page}
        src={content.src}
        folder={content.folder}
        note={tr(content.image_note, lang)}
        lang={lang}
      />
      {title && <h2 className="text-lg font-semibold">{title}</h2>}
      {!!points.length && (
        <ul className="space-y-2">
          {points.map((p, i) => {
            const label = tr(p.label, lang);
            const d = p.detail ?? {};
            return (
              <li key={i}>
                <button
                  type="button"
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-accent text-left transition-colors"
                  onClick={() =>
                    setModal({
                      title: tr(d.title, lang) || label,
                      text: tr(d.text, lang),
                      imagePath: d.image ?? null,
                      imageLayout: d.layout ?? null,
                      imageNote: tr(d.image_note, lang),
                    })
                  }
                >
                  <span className="flex-1 text-sm leading-relaxed">{label}</span>
                  <Info className="w-4 h-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {!!items.length && (
        <div className="flex flex-wrap gap-2">
          {items.map((it, i) => {
            const label = tr(it.label, lang);
            return (
              <button
                key={i}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent text-sm transition-colors"
                onClick={() => {
                  if (it.mode === "open") {
                    setModal({
                      title: label,
                      glyph: it.glyph,
                      text: tr(it.text, lang) || tr(it.cap, lang),
                      imagePath: it.image ?? null,
                      imageLayout: it.layout ?? null,
                      imageNote: tr(it.image_note, lang),
                      route: it.route,
                      routeLabel: tr(it.target, lang),
                    });
                  } else {
                    setModal({
                      title: label,
                      glyph: it.glyph,
                      text: tr(it.text, lang),
                      imagePath: it.image ?? null,
                      imageLayout: it.layout ?? null,
                      imageNote: tr(it.image_note, lang),
                    });
                  }
                }}
              >
                <GlyphIcon glyph={it.glyph} size={18} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AnatomyPanel({
  content,
  title,
  lang,
  hot,
  setHot,
  setModal,
}: {
  content: any;
  title: string;
  lang: Lang;
  hot: number | null;
  setHot: (n: number | null) => void;
  setModal: (m: ModalState) => void;
}) {
  const frame: "card" | "board" = content.frame === "board" ? "board" : "card";
  const lead = tr(content.lead, lang);
  const intro = trList(content.intro, lang);
  const callouts: any[] = Array.isArray(content.callouts) ? content.callouts : [];
  const abilities: any[] = Array.isArray(content.abilities) ? content.abilities : [];
  return (
    <div className="space-y-4">
      {title && <h2 className="text-lg font-semibold">{title}</h2>}
      {lead && <p className="text-sm text-muted-foreground">{lead}</p>}
      {!!intro.length && <BulletList lines={intro} />}
      <div className={frame === "card" ? "max-w-xs mx-auto" : ""}>
        <Figure
          imagePath={content.image_path}
          aspect={frame}
          cap={tr(content.uname, lang) || tr({ en: "Figure", ru: "Рисунок" }, lang)}
          page={content.page}
          src="pdf"
          note={tr(content.image_note, lang)}
          lang={lang}
        >
          {callouts.map((c, i) => {
            if (c.noPin) return null;
            const top = c.top ?? "10%";
            const left = c.left ?? "10%";
            const isHot = hot === c.pin;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Pin ${c.pin}`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  isHot
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/30 scale-125"
                    : "bg-primary/90 text-primary-foreground hover:scale-110"
                }`}
                style={{ top, left }}
                onClick={() => {
                  setHot(c.pin);
                  if (c.text) {
                    setModal({
                      title: tr(c.label, lang),
                      glyph: c.glyph,
                      text: tr(c.text, lang) || tr(c.d, lang),
                      imagePath: c.image ?? null,
                      imageLayout: c.layout ?? null,
                      imageNote: tr(c.image_note, lang),
                    });
                  }
                }}
              >
                {c.pin}
              </button>
            );
          })}
        </Figure>
      </div>
      <ul className="space-y-2">
        {callouts.map((c, i) => {
          const isHot = hot === c.pin;
          return (
            <li key={i}>
              <button
                type="button"
                className={`w-full flex items-start gap-3 p-2.5 rounded-lg border text-left transition-colors ${
                  isHot ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                }`}
                onClick={() => {
                  setHot(c.pin);
                  if (c.text) {
                    setModal({
                      title: tr(c.label, lang),
                      glyph: c.glyph,
                      text: tr(c.text, lang) || tr(c.d, lang),
                      imagePath: c.image ?? null,
                      imageLayout: c.layout ?? null,
                      imageNote: tr(c.image_note, lang),
                    });
                  }
                }}
              >
                {!c.noPin && (
                  <span className={`shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    isHot ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}>
                    {c.pin}
                  </span>
                )}
                <GlyphIcon glyph={c.glyph} size={20} className="shrink-0 mt-0.5" />
                <span className="text-sm leading-relaxed">
                  <b>{tr(c.label, lang)}</b>
                  {tr(c.d, lang) ? <> - {tr(c.d, lang)}</> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {!!abilities.length && (
        <div>
          <h3 className="text-sm font-semibold mb-2">
            {lang === "RU" ? "Типы спецспособностей" : "Ability types"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {abilities.map((a, i) => (
              <button
                key={i}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent text-sm"
                onClick={() => setModal({
                  title: tr(a.label, lang),
                  glyph: a.glyph,
                  text: tr(a.text, lang),
                  imagePath: a.image ?? null,
                  imageLayout: a.layout ?? null,
                  imageNote: tr(a.image_note, lang),
                })}
              >
                <GlyphIcon glyph={a.glyph} size={18} />
                <span>{tr(a.label, lang)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TypesPanel({
  content,
  title,
  lang,
  setModal,
}: {
  content: any;
  title: string;
  lang: Lang;
  setModal: (m: ModalState) => void;
}) {
  const types: any[] = Array.isArray(content.types) ? content.types : [];
  const tiers: any[] = Array.isArray(content.tiers) ? content.tiers : [];
  const note = tr(content.note, lang);
  return (
    <div className="space-y-4">
      {title && <h2 className="text-lg font-semibold">{title}</h2>}
      <ul className="space-y-2">
        {types.map((t, i) => (
          <li key={i}>
            <button
              type="button"
              className="w-full flex items-start gap-3 p-2.5 rounded-lg border border-border hover:bg-accent text-left"
              onClick={() => setModal({
                title: tr(t.label, lang),
                glyph: t.glyph,
                text: tr(t.text, lang),
                imagePath: t.image ?? null,
                imageLayout: t.layout ?? null,
                imageNote: tr(t.image_note, lang),
              })}
            >
              <GlyphIcon glyph={t.glyph} size={22} className="shrink-0 mt-0.5" />
              <span className="text-sm leading-relaxed">
                <b>{tr(t.label, lang)}</b>
                {tr(t.short, lang) ? <> - {tr(t.short, lang)}</> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!!tiers.length && (
        <div>
          <h3 className="text-sm font-semibold mb-2">
            {lang === "RU" ? "Тиры нейтралов" : "Neutral tiers"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {tiers.map((t, i) => (
              <button
                key={i}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent text-sm"
                onClick={() => setModal({
                  title: tr(t.label, lang),
                  glyph: t.glyph,
                  text: tr(t.text, lang),
                  imagePath: t.image ?? null,
                  imageLayout: t.layout ?? null,
                  imageNote: tr(t.image_note, lang),
                })}
              >
                <GlyphIcon glyph={t.glyph} size={18} />
                <span>{tr(t.label, lang)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {note && <p className="text-xs italic text-muted-foreground">{note}</p>}
    </div>
  );
}

function ExamplePanel({
  content,
  title,
  lang,
}: {
  content: any;
  title: string;
  lang: Lang;
}) {
  const intro = tr(content.intro, lang);
  const outro = tr(content.outro, lang);
  const steps: any[] = Array.isArray(content.steps) ? content.steps : [];
  const flip = content.flip ?? {};
  return (
    <div className="space-y-4">
      {title && <h2 className="text-lg font-semibold">{title}</h2>}
      {intro && <p className="text-sm">{intro}</p>}
      <div className="flex items-stretch gap-2">
        <div className="flex-1 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{flip.left ?? ""}</div>
          <div className="text-xs text-muted-foreground mt-1">{tr(flip.leftSub, lang)}</div>
        </div>
        <div className="flex flex-col items-center justify-center px-1 text-muted-foreground">
          <ArrowRight className="w-5 h-5" />
          <div className="text-[10px] mt-1 text-center max-w-[60px] leading-tight">{tr(flip.mid, lang)}</div>
        </div>
        <div className="flex-1 rounded-lg border border-border bg-muted/40 p-3 text-center">
          <div className="text-2xl font-bold">{flip.right ?? ""}</div>
          <div className="text-xs text-muted-foreground mt-1">{tr(flip.rightSub, lang)}</div>
        </div>
      </div>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed">
              <b>{tr(s.t, lang)}</b>
              {tr(s.d, lang) ? <> {tr(s.d, lang)}</> : null}
            </span>
          </li>
        ))}
      </ol>
      {outro && <p className="text-sm text-muted-foreground">{outro}</p>}
      <p className="text-xs italic text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-md p-2">
        {lang === "RU"
          ? "Подробный разбор боя появится в будущем разделе «Бой»."
          : "A full combat walkthrough will live in a future “Combat” section."}
      </p>
    </div>
  );
}

// ---------- Detail-modal image (sized via card_layouts) ----------
function ModalImage({
  imagePath,
  layoutId,
  note,
}: {
  imagePath?: string | null;
  layoutId?: string | null;
  note?: string;
}) {
  const layout = useCardLayoutById(layoutId ?? null);
  if (imagePath) {
    if (!layoutId) {
      return (
        <img
          src={componentMediaUrl(imagePath)}
          alt=""
          className="w-full max-h-48 object-contain rounded-md bg-muted/30 border border-border"
        />
      );
    }
    const ar = (layout.aspectRatio ?? "5/7").replace("/", " / ");
    return (
      <div
        className="rounded-md overflow-hidden bg-muted/30 border border-border w-full"
        style={{ aspectRatio: ar }}
      >
        <img
          src={componentMediaUrl(imagePath)}
          alt=""
          className="w-full h-full"
          style={{ objectFit: layout.objectFit, objectPosition: layout.objectPosition }}
        />
      </div>
    );
  }
  if (note) return <p className="text-xs italic text-muted-foreground">{note}</p>;
  return null;
}

// ---------- Rules-extended detail popup ----------
interface RuleExtRow {
  section_title: string;
  section_title_ru: string | null;
  text_en: string;
  text_ru: string | null;
}

function RuleExtDialog({
  id,
  lang,
  onClose,
}: { id: number | null; lang: Lang; onClose: () => void }) {
  const { glyphs } = useGlyphs();
  const q = useQuery({
    queryKey: ["guide_rule_ext", id],
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rules_extended")
        .select("section_title, section_title_ru, text_en, text_ru")
        .eq("id", id as number)
        .single();
      if (error) throw error;
      return data as RuleExtRow;
    },
  });
  const row = q.data;
  const title = row
    ? (lang === "RU" ? (row.section_title_ru ?? row.section_title) : row.section_title)
    : (lang === "RU" ? "Загрузка..." : "Loading...");
  const body = row ? (lang === "RU" ? (row.text_ru ?? row.text_en) : row.text_en) : "";
  return (
    <Dialog open={id !== null} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="pr-8">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto min-h-0">
          {q.isLoading && (
            <div className="flex justify-center py-8">
              <H3MasterSpinner size={36} variant="draw" className="text-primary" />
            </div>
          )}
          {q.isError && (
            <p className="text-sm text-destructive">
              {lang === "RU" ? "Не удалось загрузить правило." : "Failed to load rule."}
            </p>
          )}
          {row && (
            <div
              className="text-sm leading-relaxed whitespace-pre-line text-foreground"
              dangerouslySetInnerHTML={{ __html: renderGlyphs(body, glyphs) }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Main component ----------
export default function GuideTab() {
  const { lang } = useLang();
  const navigate = useNavigate();

  const [view, setView] = useState<"home" | "toc" | "panel" | "done">("home");
  const [si, setSi] = useState(0);
  const [pi, setPi] = useState(0);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [hot, setHot] = useState<number | null>(null);
  const [ruleExtId, setRuleExtId] = useState<number | null>(null);

  const sectionsQ = useQuery({
    queryKey: ["guide_sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guide_sections")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as GuideSectionRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const panelsQ = useQuery({
    queryKey: ["guide_panels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guide_panels")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as GuidePanelRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const sections = sectionsQ.data ?? [];
  const panelsBySection = useMemo(() => {
    const map = new Map<string, GuidePanelRow[]>();
    for (const p of panelsQ.data ?? []) {
      const arr = map.get(p.section_id) ?? [];
      arr.push(p);
      map.set(p.section_id, arr);
    }
    return map;
  }, [panelsQ.data]);

  const isLoading = sectionsQ.isLoading || panelsQ.isLoading;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <H3MasterSpinner size={48} variant="draw" className="text-primary" />
      </div>
    );
  }

  if (!sections.length) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center text-sm text-muted-foreground">
        {lang === "RU" ? "Пока нет разделов гида." : "No guide sections yet."}
      </div>
    );
  }

  const sectionLabel = (s: GuideSectionRow) => (lang === "RU" ? s.label_ru : s.label_en);
  const panelTitle = (p: GuidePanelRow) =>
    (lang === "RU" ? p.title_ru : p.title_en) ?? p.title_en ?? p.title_ru ?? "";

  const goPanel = (nsi: number, npi: number) => {
    setSi(nsi);
    setPi(npi);
    setHot(null);
    setView("panel");
  };

  const handleNext = () => {
    const curSec = sections[si];
    const curPanels = panelsBySection.get(curSec.id) ?? [];
    if (pi + 1 < curPanels.length) {
      goPanel(si, pi + 1);
      return;
    }
    if (si + 1 < sections.length) {
      goPanel(si + 1, 0);
      return;
    }
    setView("done");
  };

  const handleBack = () => {
    if (pi > 0) { goPanel(si, pi - 1); return; }
    if (si > 0) {
      const prev = panelsBySection.get(sections[si - 1].id) ?? [];
      goPanel(si - 1, Math.max(0, prev.length - 1));
    }
  };

  const isFirstPanel = si === 0 && pi === 0;
  const isLastPanel =
    si === sections.length - 1 &&
    pi === ((panelsBySection.get(sections[si]?.id) ?? []).length - 1);

  const modalOpen = modal !== null || ruleExtId !== null;

  // ---------- Render ----------
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {view === "home" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-6 text-primary-foreground shadow-lg">
              <h1 className="text-2xl font-bold mb-2">
                {lang === "RU" ? "Как играть" : "How to Play"}
              </h1>
              <p className="text-sm opacity-90 mb-5">
                {lang === "RU"
                  ? "Короткий интерактивный гид для новичков. Юниты, бой, города — шаг за шагом."
                  : "A short interactive beginner guide. Units, combat, towns — step by step."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => goPanel(0, 0)}
                >
                  {lang === "RU" ? "Начать обучение" : "Start tutorial"}
                </Button>
                <Button
                  variant="ghost"
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => setView("toc")}
                >
                  {lang === "RU" ? "Открыть оглавление" : "Open contents"}
                </Button>
              </div>
            </div>
            <SectionList
              sections={sections}
              panelsBySection={panelsBySection}
              lang={lang}
              onPick={(idx) => goPanel(idx, 0)}
            />
          </div>
        )}

        {view === "toc" && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">
              {lang === "RU" ? "Оглавление" : "Contents"}
            </h1>
            <SectionList
              sections={sections}
              panelsBySection={panelsBySection}
              lang={lang}
              onPick={(idx) => goPanel(idx, 0)}
            />
          </div>
        )}

        {view === "panel" && sections[si] && (() => {
          const sec = sections[si];
          const panels = panelsBySection.get(sec.id) ?? [];
          const panel = panels[pi];
          if (!panel) {
            return (
              <div className="text-sm text-muted-foreground">
                {lang === "RU" ? "Раздел пуст." : "Section is empty."}
              </div>
            );
          }
          const title = panelTitle(panel);
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setView("toc")}
                >
                  <List className="w-4 h-4" />
                  {lang === "RU" ? "К оглавлению" : "Contents"}
                </button>
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  {lang === "RU" ? "Раздел" : "Section"} {si + 1}/{sections.length}
                  {panels.length > 1 ? ` · ${lang === "RU" ? "шаг" : "step"} ${pi + 1}/${panels.length}` : ""}
                </span>
              </div>
              <div className="text-sm font-medium">{sectionLabel(sec)}</div>
              {panels.length > 1 && (
                <div className="flex gap-1.5">
                  {panels.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i === pi ? "bg-primary" : "bg-muted"}`}
                    />
                  ))}
                </div>
              )}
              {panel.kind === "standard" && (
                <StandardPanel
                  content={panel.content ?? {}}
                  title={title}
                  lang={lang}
                  setModal={setModal}
                  navigate={navigate}
                />
              )}
              {panel.kind === "anatomy" && (
                <AnatomyPanel
                  content={panel.content ?? {}}
                  title={title}
                  lang={lang}
                  hot={hot}
                  setHot={setHot}
                  setModal={setModal}
                />
              )}
              {panel.kind === "types" && (
                <TypesPanel
                  content={panel.content ?? {}}
                  title={title}
                  lang={lang}
                  setModal={setModal}
                />
              )}
              {panel.kind === "example" && (
                <ExamplePanel
                  content={panel.content ?? {}}
                  title={title}
                  lang={lang}
                />
              )}
            </div>
          );
        })()}

        {view === "done" && (
          <div className="text-center space-y-5 py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">
              {lang === "RU" ? "Готово!" : "Done!"}
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {lang === "RU"
                ? "Вы прошли вводный гид. Изучайте остальное в приложении."
                : "You finished the beginner guide. Explore the rest of the app."}
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => setView("toc")}>
                {lang === "RU" ? "К оглавлению" : "Contents"}
              </Button>
              <Button variant="outline" onClick={() => setView("home")}>
                {lang === "RU" ? "На главную" : "Home"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {view === "panel" && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-56 border-t border-border bg-background/95 backdrop-blur p-3 z-30">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleBack}
              disabled={isFirstPanel || modalOpen}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {lang === "RU" ? "Назад" : "Back"}
            </Button>
            <Button
              className="flex-1"
              onClick={handleNext}
              disabled={modalOpen}
            >
              {isLastPanel
                ? (lang === "RU" ? "Завершить" : "Finish")
                : (lang === "RU" ? "Далее" : "Next")}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={modal !== null} onOpenChange={(o) => { if (!o) setModal(null); }}>
        <DialogContent className="max-w-md">
          {modal && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <GlyphIcon glyph={modal.glyph} size={22} />
                  <span>{modal.title}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {modal.text && (
                  <p className="text-sm leading-relaxed whitespace-pre-line">{modal.text}</p>
                )}
                <ModalImage
                  imagePath={modal.imagePath}
                  layoutId={modal.imageLayout}
                  note={modal.imageNote}
                />
                {modal.route && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      const r = modal.route!;
                      setModal(null);
                      navigate(r);
                    }}
                  >
                    {modal.routeLabel || (lang === "RU" ? "Открыть раздел" : "Open section")}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <RuleExtDialog id={ruleExtId} lang={lang} onClose={() => setRuleExtId(null)} />
    </div>
  );
}

function SectionList({
  sections,
  panelsBySection,
  lang,
  onPick,
}: {
  sections: GuideSectionRow[];
  panelsBySection: Map<string, GuidePanelRow[]>;
  lang: Lang;
  onPick: (sectionIndex: number) => void;
}) {
  return (
    <ul className="space-y-2">
      {sections.map((s, idx) => {
        const count = panelsBySection.get(s.id)?.length ?? 0;
        return (
          <li key={s.id}>
            <button
              type="button"
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left"
              onClick={() => onPick(idx)}
            >
              <span className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <span className="flex-1 text-sm font-medium">
                {lang === "RU" ? s.label_ru : s.label_en}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {count} {lang === "RU" ? (count === 1 ? "шаг" : "шага") : (count === 1 ? "step" : "steps")}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
