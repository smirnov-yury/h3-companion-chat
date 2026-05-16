import { useState } from "react";
import { ChevronDown, BookOpen } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import type { Payload } from "@/lib/setupResolver";

interface StoryItemProps {
  title: string;
  trigger: string;
  content: string;
}

function StoryItem({ title, trigger, content }: StoryItemProps) {
  const [open, setOpen] = useState(false);
  const { glyphs } = useGlyphs();
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border bg-card">
      <CollapsibleTrigger className="w-full flex items-center justify-between p-4">
        <span className="flex items-center gap-2 text-sm font-semibold text-left">
          <BookOpen className="w-4 h-4 text-primary shrink-0" />
          {title}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 space-y-2">
        {trigger && (
          <p
            className="text-xs italic text-muted-foreground whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: renderGlyphs(trigger, glyphs) }}
          />
        )}
        {content && (
          <div
            className="text-sm leading-relaxed whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: renderGlyphs(content, glyphs) }}
          />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function StorySection({ sections }: { sections: Payload["story_sections"] }) {
  const { lang } = useLang();
  if (!sections || sections.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{lang === "RU" ? "Сюжет" : "Story"}</h2>
      <div className="space-y-2">
        {sections.map((s) => {
          const title = (lang === "RU" ? s.title_ru : s.title_en) || s.section_key;
          const trigger = (lang === "RU" ? s.trigger_text_ru : s.trigger_text_en) || "";
          const content = (lang === "RU" ? s.content_ru : s.content_en) || "";
          return <StoryItem key={s.section_key} title={title} trigger={trigger} content={content} />;
        })}
      </div>
    </section>
  );
}
