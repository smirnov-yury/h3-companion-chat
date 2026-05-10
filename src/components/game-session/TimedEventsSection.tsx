import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import type { Payload } from "@/lib/setupResolver";

export default function TimedEventsSection({ events }: { events: Payload["common"]["timed_events"] }) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();

  if (!events || events.length === 0) return null;
  const sorted = [...events].sort((a, b) => (a.round ?? 0) - (b.round ?? 0));

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">
          {lang === "RU" ? "Запланированные события" : "Timed events"}
        </h2>
      </div>
      <div className="rounded-lg border bg-card divide-y">
        {sorted.map((e, i) => {
          const label = (lang === "RU" ? e.label_ru : e.label_en) || "";
          const condition = (lang === "RU" ? e.condition_ru : e.condition_en) || "";
          const effect = (lang === "RU" ? e.effect_ru : e.effect_en) || "";
          return (
            <div key={i} className="flex items-start gap-3 p-3">
              <Badge variant="default" className="shrink-0 mt-0.5">
                {lang === "RU" ? `Раунд ${e.round ?? "?"}` : `Round ${e.round ?? "?"}`}
              </Badge>
              <div className="flex-1 min-w-0 space-y-1">
                {label && <div className="text-sm font-semibold">{label}</div>}
                {condition && (
                  <div
                    className="text-xs text-muted-foreground whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: renderGlyphs(condition, glyphs) }}
                  />
                )}
                {effect && (
                  <div
                    className="text-sm whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: renderGlyphs(effect, glyphs) }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
