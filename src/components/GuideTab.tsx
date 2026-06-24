import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ChevronDown, List, Check, ArrowRight, Info, Search, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang, type Lang } from "@/context/LanguageContext";
import { componentMediaUrl } from "@/lib/storage";
import { Dialog } from "@/components/ui/dialog";
import { CardDialogContent } from "@/components/ui/card-dialog";
import { Button } from "@/components/ui/button";
import H3MasterSpinner from "@/components/H3MasterSpinner";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { useEntityLinkHandler } from "@/hooks/useEntityLinkHandler";
import { useCardLayoutById } from "@/hooks/useCardLayouts";
import SEOMeta from "@/components/SEOMeta";
import { resolveBranding } from "@/config/branding";

const GUIDE_BASE = "/how-to-play";


const toPascal = (s: string) =>
  s.split(/[-_ ]/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");
function SectionIcon({ name, className }: { name: string | null; className?: string }) {
  const Comp = (name && (LucideIcons as any)[toPascal(name)]) || (LucideIcons as any).BookOpen;
  return <Comp className={className} />;
}

/** Russian plural selector. forms = [one, few, many], e.g. ["шаг","шага","шагов"].
 *  1 шаг · 2 шага · 5 шагов · 21 шаг · 11 шагов. */
function pluralRu(n: number, forms: [string, string, string]): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

/** Strip guide rich-markup for plain-text contexts (search snippets/subtitles):
 *  [label](type:id) → label, drop <glyph>/<...> tokens and ** bold markers,
 *  collapse whitespace. */
function stripMarkup(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


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
  category_en: string | null;
  category_ru: string | null;
}

type PanelKind = "standard" | "anatomy" | "types" | "example";

const withVer = (url: string, v?: string | null) => (v ? `${url}?v=${encodeURIComponent(v)}` : url);

interface GuidePanelRow {
  id: string;
  section_id: string;
  sort_order: number;
  kind: PanelKind;
  title_en: string | null;
  title_ru: string | null;
  content: any;
  updated_at: string;
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

// Rebuild the popup state for a given modal key (e.g. "pt.2", "co.0") against a
// panel's content. Mirrors the openModal payloads built inside the panel
// components so arrow-navigation lands on the same content as a direct tap.
// Returns null when there is no openable item at that key.
function buildGuideModalState(content: any, key: string, lang: Lang): ModalState | null {
  const dot = key.indexOf(".");
  if (dot < 0) return null;
  const prefix = key.slice(0, dot);
  const idx = parseInt(key.slice(dot + 1), 10);
  if (!Number.isFinite(idx) || idx < 0) return null;

  if (prefix === "pt") {
    const p = (content.points ?? [])[idx];
    if (!p) return null;
    const d = p.detail ?? {};
    return {
      title: tr(d.title, lang) || tr(p.label, lang),
      text: tr(d.text, lang),
      imagePath: d.image ?? null,
      imageLayout: d.layout ?? null,
      imageNote: tr(d.image_note, lang),
    };
  }
  if (prefix === "it") {
    const it = (content.items ?? [])[idx];
    if (!it) return null;
    if (it.mode === "open") {
      return {
        title: tr(it.label, lang),
        glyph: it.glyph,
        text: tr(it.text, lang) || tr(it.cap, lang),
        imagePath: it.image ?? null,
        imageLayout: it.layout ?? null,
        imageNote: tr(it.image_note, lang),
        route: it.route,
        routeLabel: tr(it.target, lang),
      };
    }
    return {
      title: tr(it.label, lang),
      glyph: it.glyph,
      text: tr(it.text, lang),
      imagePath: it.image ?? null,
      imageLayout: it.layout ?? null,
      imageNote: tr(it.image_note, lang),
    };
  }
  if (prefix === "co") {
    const c = (content.callouts ?? [])[idx];
    if (!c || !c.text) return null;
    return {
      title: tr(c.label, lang),
      glyph: c.glyph,
      text: tr(c.text, lang) || tr(c.d, lang),
      imagePath: c.image ?? null,
      imageLayout: c.layout ?? null,
      imageNote: tr(c.image_note, lang),
    };
  }
  if (prefix === "ab" || prefix === "ty" || prefix === "ti") {
    const arr = prefix === "ab" ? content.abilities : prefix === "ty" ? content.types : content.tiers;
    const t = (arr ?? [])[idx];
    if (!t) return null;
    return {
      title: tr(t.label, lang),
      glyph: t.glyph,
      text: tr(t.text, lang),
      imagePath: t.image ?? null,
      imageLayout: t.layout ?? null,
      imageNote: tr(t.image_note, lang),
    };
  }
  return null;
}

const GUIDE_LIST_BY_PREFIX: Record<string, string> = {
  pt: "points", it: "items", co: "callouts", ab: "abilities", ty: "types", ti: "tiers",
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
  const aspectClass = "aspect-[16/10]";
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
  updatedAt,
  natural,
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
  updatedAt?: string | null;
  natural?: boolean;
  children?: React.ReactNode;
}) {
  const aspectClass = "aspect-[16/10]";
  if (!imagePath) {
    return (
      <div className="relative">
        <FigurePlaceholder aspect={aspect} cap={cap} page={page} src={src} folder={folder} note={note} lang={lang} />
        {children}
      </div>
    );
  }
  // `natural` = full-bleed hero: drop the fixed 16:10 box and render the image at
  // its own aspect ratio, full width — no letterbox bars, no crop. Do NOT pass
  // `natural` for panels with positioned callout pins (anatomy): their pins are
  // calibrated to the fixed 16:10 box.
  return (
    <div className={`relative w-full ${natural ? "" : aspectClass} rounded-lg overflow-hidden bg-muted/30 border border-border`}>
      <img
        src={withVer(componentMediaUrl(imagePath), updatedAt)}
        alt={cap}
        className={natural ? "block w-full h-auto" : "w-full h-full object-contain"}
      />
      {children}
    </div>
  );
}

/** Render simple bullets with glyph tokens and clickable entity links. */
function BulletList({ lines }: { lines: string[] }) {
  const { glyphs } = useGlyphs();
  const handleEntityClick = useEntityLinkHandler();
  if (!lines.length) return null;
  return (
    <ul className="space-y-1.5 list-disc list-outside pl-5 text-sm">
      {lines.map((l, i) => (
        <li
          key={i}
          className="leading-relaxed"
          onClick={handleEntityClick}
          dangerouslySetInnerHTML={{ __html: renderGlyphs(l, glyphs) }}
        />
      ))}
    </ul>
  );
}

/** Inline rich text: renders <glyph> tokens, [Display](type:id) entity links,
 *  and **bold**, and wires entity-link clicks. Use for any inline guide text
 *  that may contain links or glyph tokens (labels, short descriptions, intro/outro).
 *  When placed inside a clickable button, an entity-link click navigates and stops
 *  propagation, so the surrounding button's onClick does not also fire. */
function RichInline({ text, className }: { text?: string | null; className?: string }) {
  const { glyphs } = useGlyphs();
  const handleEntityClick = useEntityLinkHandler();
  if (!text) return null;
  return (
    <span
      className={className}
      onClick={handleEntityClick}
      dangerouslySetInnerHTML={{ __html: renderGlyphs(text, glyphs) }}
    />
  );
}

// ---------- Panel renderers ----------
function StandardPanel({
  content,
  title,
  lang,
  openModal,
  updatedAt,
}: {
  content: any;
  title: string;
  lang: Lang;
  openModal: (key: string, m: ModalState) => void;
  navigate: (to: string) => void;
  updatedAt?: string | null;
}) {
  const cap = tr(content.cap, lang);
  const points: any[] = Array.isArray(content.points) ? content.points : [];
  const items: any[] = Array.isArray(content.items) ? content.items : [];
  return (
    <div className="space-y-4">
      <Figure
        imagePath={content.image_path}
        aspect="board"
        natural
        cap={cap}
        page={content.page}
        src={content.src}
        folder={content.folder}
        note={tr(content.image_note, lang)}
        lang={lang}
        updatedAt={updatedAt}
      />
      {!!points.length && (
        <ul className="space-y-2">
          {points.map((p, i) => {
            const label = tr(p.label, lang);
            const d = p.detail ?? {};
            return (
              <li key={i}>
                <button
                  type="button"
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted text-left transition-colors"
                  onClick={() =>
                    openModal(`pt.${i}`, {
                      title: tr(d.title, lang) || label,
                      text: tr(d.text, lang),
                      imagePath: d.image ?? null,
                      imageLayout: d.layout ?? null,
                      imageNote: tr(d.image_note, lang),
                    })
                  }
                >
                  <RichInline text={label} className="flex-1 text-sm leading-relaxed" />
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted text-sm transition-colors"
                onClick={() => {
                  if (it.mode === "open") {
                    openModal(`it.${i}`, {
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
                    openModal(`it.${i}`, {
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
                <RichInline text={label} />
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
  openModal,
  updatedAt,
}: {
  content: any;
  title: string;
  lang: Lang;
  hot: number | null;
  setHot: (n: number | null) => void;
  openModal: (key: string, m: ModalState) => void;
  updatedAt?: string | null;
}) {
  const frame: "card" | "board" = content.frame === "board" ? "board" : "card";
  const lead = tr(content.lead, lang);
  const intro = trList(content.intro, lang);
  const callouts: any[] = Array.isArray(content.callouts) ? content.callouts : [];
  const abilities: any[] = Array.isArray(content.abilities) ? content.abilities : [];
  return (
    <div className="space-y-4">
      {lead && <p className="text-sm text-muted-foreground"><RichInline text={lead} /></p>}
      {!!intro.length && <BulletList lines={intro} />}
      <div>
        <Figure
          imagePath={content.image_path}
          aspect={frame}
          cap={tr(content.uname, lang) || tr({ en: "Figure", ru: "Рисунок" }, lang)}
          page={content.page}
          src="pdf"
          note={tr(content.image_note, lang)}
          lang={lang}
          updatedAt={updatedAt}
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
                    openModal(`co.${i}`, {
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
                  isHot ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                }`}
                onClick={() => {
                  setHot(c.pin);
                  if (c.text) {
                    openModal(`co.${i}`, {
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
                  <b><RichInline text={tr(c.label, lang)} /></b>
                  {tr(c.d, lang) ? <> - <RichInline text={tr(c.d, lang)} /></> : null}
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted text-sm"
                onClick={() => openModal(`ab.${i}`, {
                  title: tr(a.label, lang),
                  glyph: a.glyph,
                  text: tr(a.text, lang),
                  imagePath: a.image ?? null,
                  imageLayout: a.layout ?? null,
                  imageNote: tr(a.image_note, lang),
                })}
              >
                <GlyphIcon glyph={a.glyph} size={18} />
                <RichInline text={tr(a.label, lang)} />
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
  openModal,
}: {
  content: any;
  title: string;
  lang: Lang;
  openModal: (key: string, m: ModalState) => void;
}) {
  const types: any[] = Array.isArray(content.types) ? content.types : [];
  const tiers: any[] = Array.isArray(content.tiers) ? content.tiers : [];
  const note = tr(content.note, lang);
  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {types.map((t, i) => (
          <li key={i}>
            <button
              type="button"
              className="w-full flex items-start gap-3 p-2.5 rounded-lg border border-border hover:bg-muted text-left"
              onClick={() => openModal(`ty.${i}`, {
                title: tr(t.label, lang),
                glyph: t.glyph,
                text: tr(t.text, lang),
                imagePath: t.image ?? null,
                imageLayout: t.layout ?? null,
                imageNote: tr(t.image_note, lang),
              })}
            >
              <GlyphIcon glyph={t.glyph} size={22} className="shrink-0 mt-0.5" />
              <span className="flex-1 text-sm leading-relaxed">
                <b><RichInline text={tr(t.label, lang)} /></b>
                {tr(t.short, lang) ? <> - <RichInline text={tr(t.short, lang)} /></> : null}
              </span>
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted text-sm"
                onClick={() => openModal(`ti.${i}`, {
                  title: tr(t.label, lang),
                  glyph: t.glyph,
                  text: tr(t.text, lang),
                  imagePath: t.image ?? null,
                  imageLayout: t.layout ?? null,
                  imageNote: tr(t.image_note, lang),
                })}
              >
                <GlyphIcon glyph={t.glyph} size={18} />
                <RichInline text={tr(t.label, lang)} />
              </button>
            ))}
          </div>
        </div>
      )}
      {note && <p className="text-xs italic text-muted-foreground"><RichInline text={note} /></p>}
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
      
      {intro && <p className="text-sm"><RichInline text={intro} /></p>}
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
              <b><RichInline text={tr(s.t, lang)} /></b>
              {tr(s.d, lang) ? <> <RichInline text={tr(s.d, lang)} /></> : null}
            </span>
          </li>
        ))}
      </ol>
      {outro && <p className="text-sm text-muted-foreground"><RichInline text={outro} /></p>}
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
  updatedAt,
  bleed,
}: {
  imagePath?: string | null;
  layoutId?: string | null;
  note?: string;
  updatedAt?: string | null;
  bleed?: boolean;
}) {
  const layout = useCardLayoutById(layoutId ?? null);
  void layout;
  if (imagePath) {
    return (
      <div
        className={
          bleed
            ? "overflow-hidden bg-muted/30 w-full"
            : "rounded-md overflow-hidden bg-muted/30 border border-border w-full"
        }
        style={{ aspectRatio: "16 / 10" }}
      >
        <img
          src={withVer(componentMediaUrl(imagePath), updatedAt)}
          alt=""
          className={bleed ? "w-full h-full object-cover" : "w-full h-full object-contain"}
        />
      </div>
    );
  }
  if (note) return <p className="text-xs italic text-muted-foreground">{note}</p>;
  return null;
}


// ---------- Main component ----------
export default function GuideTab() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const routeParams = useParams<{ "*"?: string }>();
  const sectionSlugFromUrl = (routeParams["*"] ?? "").split("/").filter(Boolean)[0] ?? "";
  const { glyphs } = useGlyphs();

  const [view, setView] = useState<"home" | "toc" | "panel" | "done">("home");
  const [si, setSi] = useState(0);
  const [pi, setPi] = useState(0);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [hot, setHot] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const handleEntityClick = useEntityLinkHandler();
  const didInitRef = useRef(false);

  
  

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

  // ---------- URL ⇄ state sync ----------
  // URL is the source of truth for the active section + panel.
  //   /how-to-play                  → home view (no section selected)
  //   /how-to-play/<sectionSlug>    → panel view, step 1
  //   /how-to-play/<sectionSlug>#pN → panel view, step N (1-based)
  useEffect(() => {
    if (!sections.length) return;
    if (sectionSlugFromUrl) {
      const idx = sections.findIndex((s) => s.slug === sectionSlugFromUrl);
      if (idx < 0) {
        navigate(GUIDE_BASE, { replace: true });
        return;
      }
      const panels = panelsBySection.get(sections[idx].id) ?? [];
      const m = location.hash.match(/^#p(\d+)/);
      const requested = m ? parseInt(m[1], 10) - 1 : 0;
      const stepIdx = Math.max(0, Math.min(requested, Math.max(panels.length - 1, 0)));
      setSi(idx);
      setPi(stepIdx);
      setHot(null);
      setView((v) => (v === "done" ? v : "panel"));
      try {
        localStorage.setItem(
          "h3guide_pos",
          JSON.stringify({ sectionId: sections[idx].id, step: stepIdx }),
        );
      } catch {}
      didInitRef.current = true;
      return;
    }
    // No section slug in URL → always land on the guide home. Contents and the
    // "Continue where you left off" button both live there. The previous silent
    // localStorage auto-redirect into the middle of the guide is removed: a
    // first-time visitor who taps "How to Play" must see the start, not the last
    // saved position. The saved position is still offered via the Continue button.
    didInitRef.current = true;
    setView((v) => (v === "panel" ? "home" : v));

  }, [sectionSlugFromUrl, location.hash, sections, panelsBySection, navigate]);

  // Re-derive the popup from the active history entry (Back/Forward + remount).
  useEffect(() => {
    const hasD = new URLSearchParams(location.search).has("d");
    const stashed = (location.state as { guideModal?: ModalState } | null)?.guideModal ?? null;
    setModal(hasD ? stashed : null);
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps


  const savedPos = useMemo(() => {
    try {
      const raw = localStorage.getItem("h3guide_pos");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.sectionId !== "string" || typeof parsed.step !== "number") return null;
      const secIdx = sections.findIndex((s) => s.id === parsed.sectionId);
      if (secIdx < 0) return null;
      const secPanels = panelsBySection.get(sections[secIdx].id) ?? [];
      const clampedStep = Math.max(0, Math.min(parsed.step, secPanels.length - 1));
      return { sectionIndex: secIdx, step: clampedStep };
    } catch {
      return null;
    }
  }, [sections, panelsBySection]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return null;
    const results: { sectionIndex: number; stepIndex: number; sectionLbl: string; subtitle: string; snippet: string }[] = [];
    sections.forEach((s, sIdx) => {
      const panels = panelsBySection.get(s.id) ?? [];
      const sectionLbl = lang === "RU" ? s.label_ru : s.label_en;
      panels.forEach((p, pIdx) => {
        const title = (lang === "RU" ? p.title_ru : p.title_en) ?? p.title_en ?? p.title_ru ?? "";
        const sep = title.indexOf("·");
        const subtitle = stripMarkup((sep >= 0 ? title.slice(sep + 1) : title).trim());
        const c = p.content ?? {};
        const fields: string[] = [sectionLbl, title];
        if (p.kind === "standard") {
          fields.push(tr(c.cap, lang));
          for (const pt of c.points ?? []) {
            fields.push(tr(pt?.label, lang));
            if (pt?.detail) fields.push(tr(pt.detail.text, lang));
          }
        } else if (p.kind === "types") {
          for (const t of c.types ?? []) {
            fields.push(tr(t?.label, lang), tr(t?.short, lang), tr(t?.text, lang));
          }
          for (const ti of c.tiers ?? []) {
            fields.push(tr(ti?.label, lang), tr(ti?.text, lang));
          }
          fields.push(tr(c.note, lang));
        } else if (p.kind === "anatomy") {
          fields.push(tr(c.lead, lang));
          for (const cl of c.callouts ?? []) {
            fields.push(tr(cl?.label, lang), tr(cl?.text, lang));
          }
        } else if (p.kind === "example") {
          fields.push(tr(c.intro, lang), tr(c.outro, lang));
          for (const st of c.steps ?? []) {
            fields.push(tr(st?.t, lang), tr(st?.d, lang));
          }
        }
        const cleanFields = fields.filter(Boolean);
        let snippet = "";
        let matched = false;
        for (const f of cleanFields) {
          const plain = stripMarkup(f);
          const fi = plain.toLowerCase().indexOf(q);
          if (fi >= 0) {
            matched = true;
            const start = Math.max(0, fi - 40);
            const end = Math.min(plain.length, fi + q.length + 80);
            snippet = (start > 0 ? "…" : "") + plain.slice(start, end) + (end < plain.length ? "…" : "");
            break;
          }

        }
        if (matched) {
          results.push({ sectionIndex: sIdx, stepIndex: pIdx, sectionLbl, subtitle, snippet });
        }
      });
    });
    return results;
  }, [query, sections, panelsBySection, lang]);

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
  const panelSubtitle = (p: GuidePanelRow) => {
    const t = panelTitle(p);
    const i = t.indexOf("·");
    return (i >= 0 ? t.slice(i + 1) : t).trim();
  };

  const goPanel = (nsi: number, npi: number) => {
    const sec = sections[nsi];
    if (!sec) return;
    // Replace history when navigating within the same section; push when crossing sections
    // so browser Back returns to the previous section rather than every step.
    const replace = view === "panel" && nsi === si;
    navigate(`${GUIDE_BASE}/${sec.slug}#p${npi + 1}`, { replace });
    // State will be synced by the URL effect; also write fallback localStorage immediately.
    try {
      localStorage.setItem("h3guide_pos", JSON.stringify({ sectionId: sec.id, step: npi }));
    } catch {}
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

  // B1: detail popup is a history entry. Opening pushes ?d=<key> + stashes state.
  const openModal = (key: string, m: ModalState) => {
    setModal(m);
    const sec = sections[si];
    if (!sec) return;
    navigate(
      { pathname: `${GUIDE_BASE}/${sec.slug}`, search: `?d=${encodeURIComponent(key)}`, hash: `#p${pi + 1}` },
      { state: { guideModal: m } },
    );
  };

  // Sibling navigation between popup items REPLACES the ?d entry so the X/Back
  // closes the popup in one step (history stays [panel, current-popup]).
  const replaceModal = (key: string, m: ModalState) => {
    setModal(m);
    const sec = sections[si];
    if (!sec) return;
    navigate(
      { pathname: `${GUIDE_BASE}/${sec.slug}`, search: `?d=${encodeURIComponent(key)}`, hash: `#p${pi + 1}` },
      { replace: true, state: { guideModal: m } },
    );
  };

  const closeModal = () => {
    const hasD = new URLSearchParams(location.search).has("d");
    if (hasD) {
      navigate(-1);
    } else {
      setModal(null);
    }
  };


  const isFirstPanel = si === 0 && pi === 0;
  const curPanelsForNav = panelsBySection.get(sections[si]?.id) ?? [];
  const isLastPanel =
    si === sections.length - 1 &&
    pi === (curPanelsForNav.length - 1);
  const isLastOfSection = pi === curPanelsForNav.length - 1 && !isLastPanel;

  // Next target label
  let nextTargetLabel = "";
  let nextCrossesSection = false;
  if (pi + 1 < curPanelsForNav.length) {
    nextTargetLabel = panelSubtitle(curPanelsForNav[pi + 1]);
  } else if (si + 1 < sections.length) {
    nextCrossesSection = true;
    nextTargetLabel = sectionLabel(sections[si + 1]);
  }

  // Prev target label
  let prevTargetLabel = "";
  let prevCrossesSection = false;
  if (pi > 0) {
    prevTargetLabel = panelSubtitle(curPanelsForNav[pi - 1]);
  } else if (si > 0) {
    prevCrossesSection = true;
    const prevPanels = panelsBySection.get(sections[si - 1].id) ?? [];
    const lastPrev = prevPanels[prevPanels.length - 1];
    prevTargetLabel = lastPrev ? panelSubtitle(lastPrev) : sectionLabel(sections[si - 1]);
  }

  const modalOpen = modal !== null;

  // Prev/next navigation between openable items of the CURRENT panel's popup list.
  const curPanelForModal = (panelsBySection.get(sections[si]?.id) ?? [])[pi];
  const activeModalKey = new URLSearchParams(location.search).get("d");
  let onPrevModal: (() => void) | undefined;
  let onNextModal: (() => void) | undefined;
  if (modalOpen && activeModalKey && curPanelForModal) {
    const content = curPanelForModal.content ?? {};
    const dot = activeModalKey.indexOf(".");
    const prefix = dot >= 0 ? activeModalKey.slice(0, dot) : "";
    const idx = dot >= 0 ? parseInt(activeModalKey.slice(dot + 1), 10) : NaN;
    const listName = GUIDE_LIST_BY_PREFIX[prefix];
    if (listName && Number.isFinite(idx)) {
      const arrLen = (content[listName] ?? []).length;
      for (let j = idx - 1; j >= 0; j--) {
        const key = `${prefix}.${j}`;
        const st = buildGuideModalState(content, key, lang);
        if (st) { onPrevModal = () => replaceModal(key, st); break; }
      }
      for (let j = idx + 1; j < arrLen; j++) {
        const key = `${prefix}.${j}`;
        const st = buildGuideModalState(content, key, lang);
        if (st) { onNextModal = () => replaceModal(key, st); break; }
      }
    }
  }

  // Per-section SEO: when a section is active, override the guide tab's defaults.
  const activeSecForSeo = view === "panel" ? sections[si] : null;
  const appName = resolveBranding("app_name");
  let seoTitle: string | undefined;
  let seoDescription: string | undefined;
  let seoCanonical: string | undefined = GUIDE_BASE;
  if (activeSecForSeo) {
    const lbl = sectionLabel(activeSecForSeo);
    seoTitle = `${lbl} · ${appName}`;
    const intro = (lang === "RU" ? activeSecForSeo.intro_ru : activeSecForSeo.intro_en) ?? "";
    const trimmed = intro.trim().replace(/\s+/g, " ");
    if (trimmed) {
      seoDescription = trimmed.length > 155 ? trimmed.slice(0, 152).trimEnd() + "…" : trimmed;
    }
    seoCanonical = `${GUIDE_BASE}/${activeSecForSeo.slug}`;
  }

  // ---------- Render ----------
  return (
    <div className="flex-1 overflow-y-auto">
      <SEOMeta
        routeKey="guide"
        title={seoTitle}
        description={seoDescription}
        canonicalPath={seoCanonical}
      />
      <div className="max-w-2xl mx-auto px-4 py-6 pb-32">

        {view === "home" && (
          <div className="space-y-6">
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-primary mb-2">
                {lang === "RU" ? "Как играть" : "How to Play"}
              </h1>
              <p className="text-sm text-muted-foreground mb-5">
                {lang === "RU"
                  ? "Короткий интерактивный гид для новичков. Юниты, бой, города — шаг за шагом."
                  : "A short interactive beginner guide. Units, combat, towns — step by step."}
              </p>
              <div className="flex flex-wrap gap-2">
                {savedPos && (
                  <Button
                    variant="secondary"
                    onClick={() => goPanel(savedPos.sectionIndex, savedPos.step)}
                  >
                    <span className="flex flex-col items-start">
                      <span>{lang === "RU" ? "Продолжить" : "Continue"}</span>
                      <span className="text-[11px] opacity-80 font-normal">
                        {sectionLabel(sections[savedPos.sectionIndex])}
                        {(panelsBySection.get(sections[savedPos.sectionIndex].id)?.length ?? 0) > 1
                          ? ` · ${lang === "RU" ? "шаг" : "step"} ${savedPos.step + 1}`
                          : ""}
                      </span>
                    </span>
                  </Button>
                )}
                <Button
                  onClick={() => goPanel(0, 0)}
                >
                  {lang === "RU" ? "Начать обучение" : "Start tutorial"}
                </Button>
                <Button
                  variant="outline"
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
              onPickStep={(sidx, pidx) => goPanel(sidx, pidx)}
            />
          </div>
        )}

        {view === "toc" && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">
              {lang === "RU" ? "Оглавление" : "Contents"}
            </h1>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={lang === "RU" ? "Поиск по гиду…" : "Search the guide…"}
                aria-label={lang === "RU" ? "Поиск по гиду" : "Search the guide"}
                className="w-full h-10 pl-9 pr-9 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground"
                  aria-label={lang === "RU" ? "Очистить" : "Clear"}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchResults ? (
              searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  {lang === "RU" ? "Ничего не найдено" : "No results"}
                </p>
              ) : (
                <ul className="space-y-1">
                  {searchResults.map((r, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className="w-full p-3 rounded-lg border border-border bg-card hover:bg-muted text-left transition-colors"
                        onClick={() => { goPanel(r.sectionIndex, r.stepIndex); setQuery(""); }}
                      >
                        <div className="text-xs text-muted-foreground">
                          {r.sectionLbl}{r.subtitle && r.subtitle !== r.sectionLbl ? ` · ${r.subtitle}` : ""}
                        </div>
                        {r.snippet && (
                          <div className="text-sm mt-1 leading-snug">{r.snippet}</div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <SectionList
                sections={sections}
                panelsBySection={panelsBySection}
                lang={lang}
                onPick={(idx) => goPanel(idx, 0)}
                onPickStep={(sidx, pidx) => goPanel(sidx, pidx)}
              />
            )}
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
          const sepIndex = title.indexOf("·");
          const subtitle = sepIndex >= 0 ? title.slice(sepIndex + 1).trim() : title.trim();
          const combinedHeading = subtitle
            ? `${sectionLabel(sec)} · ${subtitle}`
            : sectionLabel(sec);
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
              <h2 className="text-lg font-semibold leading-snug">{combinedHeading}</h2>
              {panels.length > 1 && (
                <div className="flex gap-1.5">
                  {panels.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goPanel(si, i)}
                      aria-label={lang === "RU" ? `Шаг ${i + 1}` : `Step ${i + 1}`}
                      aria-current={i === pi ? "step" : undefined}
                      className={`h-1.5 flex-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        i === pi ? "bg-primary" : "bg-muted hover:bg-primary/60"
                      }`}
                    />
                  ))}
                </div>
              )}
              {isLastOfSection && (
                <div className="text-xs text-primary/80">
                  {lang === "RU" ? "Конец раздела — далее следующий" : "End of section — next one follows"}
                </div>
              )}
              {panel.kind === "standard" && (
                <StandardPanel
                  content={panel.content ?? {}}
                  title={title}
                  lang={lang}
                  openModal={openModal}
                  navigate={navigate}
                  updatedAt={panel.updated_at}
                />
              )}
              {panel.kind === "anatomy" && (
                <AnatomyPanel
                  content={panel.content ?? {}}
                  title={title}
                  lang={lang}
                  hot={hot}
                  setHot={setHot}
                  openModal={openModal}
                  updatedAt={panel.updated_at}
                />
              )}
              {panel.kind === "types" && (
                <TypesPanel
                  content={panel.content ?? {}}
                  title={title}
                  lang={lang}
                  openModal={openModal}
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
          <div className="max-w-2xl mx-auto flex items-stretch gap-2">
            <Button
              variant="outline"
              className="flex-1 h-auto py-2 flex-col items-start text-left"
              onClick={handleBack}
              disabled={isFirstPanel || modalOpen}
            >
              <span className="inline-flex items-center text-sm font-medium">
                <ChevronLeft className="w-4 h-4 mr-1" />
                {lang === "RU" ? "Назад" : "Back"}
              </span>
              {prevTargetLabel && (
                <span className="text-xs opacity-80 truncate max-w-full font-normal pl-5">
                  {prevCrossesSection
                    ? `${lang === "RU" ? "Раздел" : "Section"}: ${prevTargetLabel}`
                    : prevTargetLabel}
                </span>
              )}
            </Button>
            <Button
              className="flex-1 h-auto py-2 flex-col items-end text-right"
              onClick={handleNext}
              disabled={modalOpen}
            >
              <span className="inline-flex items-center text-sm font-medium">
                {isLastPanel
                  ? (lang === "RU" ? "Завершить" : "Finish")
                  : (lang === "RU" ? "Далее" : "Next")}
                <ChevronRight className="w-4 h-4 ml-1" />
              </span>
              {!isLastPanel && nextTargetLabel && (
                <span className="text-xs opacity-80 truncate max-w-full font-normal pr-5">
                  {nextCrossesSection
                    ? `${lang === "RU" ? "Раздел" : "Section"}: ${nextTargetLabel}`
                    : nextTargetLabel}
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={modal !== null} onOpenChange={(o) => { if (!o) closeModal(); }}>
        <CardDialogContent onPrev={onPrevModal} onNext={onNextModal} className="sm:max-w-2xl">
          {modal && (
            <div className="flex flex-col h-full">
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                {modal.imagePath && (
                  <ModalImage
                    imagePath={modal.imagePath}
                    layoutId={modal.imageLayout}
                    note={modal.imageNote}
                    updatedAt={curPanelForModal?.updated_at}
                    bleed
                  />
                )}
                <div className={modal.imagePath ? "px-14 pt-4 pb-12" : "px-14 pt-12 pb-12"}>
                  {!modal.imagePath && modal.imageNote && (
                    <p className="text-xs italic text-muted-foreground mb-3">{modal.imageNote}</p>
                  )}
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <GlyphIcon glyph={modal.glyph} size={22} />
                    <span>{modal.title}</span>
                  </h3>
                  {modal.text && (
                    <div
                      className="text-sm leading-relaxed whitespace-pre-line"
                      onClick={handleEntityClick}
                      dangerouslySetInnerHTML={{ __html: renderGlyphs(modal.text, glyphs) }}
                    />
                  )}
                  {modal.route && (
                    <Button
                      className="w-full mt-4"
                      onClick={() => navigate(modal.route!)}
                    >
                      {modal.routeLabel || (lang === "RU" ? "Открыть раздел" : "Open section")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardDialogContent>
      </Dialog>
    </div>
  );
}

function SectionList({
  sections,
  panelsBySection,
  lang,
  onPick,
  onPickStep,
}: {
  sections: GuideSectionRow[];
  panelsBySection: Map<string, GuidePanelRow[]>;
  lang: Lang;
  onPick: (sectionIndex: number) => void;
  onPickStep: (sectionIndex: number, stepIndex: number) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const panelSubtitle = (p: GuidePanelRow) => {
    const t = (lang === "RU" ? p.title_ru : p.title_en) ?? p.title_en ?? p.title_ru ?? "";
    const i = t.indexOf("·");
    return (i >= 0 ? t.slice(i + 1) : t).trim();
  };
  let prevCategory: string | null | undefined = undefined;
  return (
    <ul className="space-y-1">
      {sections.map((s, idx) => {
        const panels = panelsBySection.get(s.id) ?? [];
        const count = panels.length;
        const category = lang === "RU" ? s.category_ru : s.category_en;
        const showHeader = category !== prevCategory;
        prevCategory = category;
        const expanded = expandedId === s.id;
        const multi = count > 1;
        return (
          <li key={s.id}>
            {showHeader && category && (
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-4 mb-1 first:mt-0">
                {category}
              </div>
            )}
            <button
              type="button"
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left"
              onClick={() => {
                if (multi) {
                  setExpandedId(expanded ? null : s.id);
                } else {
                  onPick(idx);
                }
              }}
            >
              <span className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <SectionIcon name={s.icon} className="w-4 h-4" />
              </span>
              <span className="flex-1 text-sm font-medium">
                {lang === "RU" ? s.label_ru : s.label_en}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {count} {lang === "RU" ? pluralRu(count, ["шаг", "шага", "шагов"]) : (count === 1 ? "step" : "steps")}
              </span>
              {multi && (
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              )}
            </button>
            {multi && expanded && (
              <ul className="mt-1 mb-2 ml-4 pl-4 border-l border-border space-y-1">
                <li>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted text-left"
                    onClick={() => onPick(idx)}
                  >
                    {lang === "RU" ? "Открыть раздел" : "Open section"}
                  </button>
                </li>
                {panels.map((p, pidx) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted text-left"
                      onClick={() => onPickStep(idx, pidx)}
                    >
                      <span className="shrink-0 w-5 h-5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center">
                        {pidx + 1}
                      </span>
                      <span className="flex-1 leading-snug">{panelSubtitle(p)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
