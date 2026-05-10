import { useState } from "react";
import { ChevronDown, Crown, XCircle, Scroll } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import type { Payload } from "@/lib/setupResolver";

interface SubsectionProps {
  title: string;
  content: string;
  icon: typeof Crown;
  defaultOpen?: boolean;
}

function Subsection({ title, content, icon: Icon, defaultOpen = false }: SubsectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { glyphs } = useGlyphs();
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border bg-card">
      <CollapsibleTrigger className="w-full flex items-center justify-between p-4">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <div
          className="text-sm leading-relaxed whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: renderGlyphs(content, glyphs) }}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function CommonRulesSection({ common }: { common: Payload["common"] }) {
  const { lang } = useLang();
  const victory = (lang === "RU" ? common.victory_ru : common.victory_en) || "";
  const lose = (lang === "RU" ? common.lose_ru : common.lose_en) || "";
  const additional = (lang === "RU" ? common.additional_rules_ru : common.additional_rules_en) || "";

  if (!victory && !lose && !additional) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">
        {lang === "RU" ? "Общие правила" : "Common rules"}
      </h2>
      {victory && (
        <Subsection
          title={lang === "RU" ? "Условия победы" : "Victory"}
          content={victory}
          icon={Crown}
          defaultOpen
        />
      )}
      {lose && (
        <Subsection
          title={lang === "RU" ? "Условия поражения" : "Defeat"}
          content={lose}
          icon={XCircle}
          defaultOpen
        />
      )}
      {additional && (
        <Subsection
          title={lang === "RU" ? "Особые правила" : "Special rules"}
          content={additional}
          icon={Scroll}
        />
      )}
    </section>
  );
}
