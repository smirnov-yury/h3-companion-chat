import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { entityLinkUrl } from "@/hooks/useEntityLinkHandler";

interface Props {
  content: string;
  lang: "EN" | "RU";
}

interface Source {
  type: string;
  id: string;
  name: string;
  url: string | null;
}

const TYPE_LABEL_EN: Record<string, string> = {
  rule: "rule",
  rule_ext: "rule",
  unit: "unit",
  hero: "hero",
  spell: "spell",
  ability: "ability",
  artifact: "artifact",
  building: "building",
  town_building: "building",
  field: "map element",
  statistic: "statistic",
  event: "event",
  war_machine: "war machine",
  astrologer: "astrologer",
  ai_card: "AI card",
  map_event: "map event",
  morale: "morale",
  pandora: "Pandora",
  glyph: "icon",
};

const TYPE_LABEL_RU: Record<string, string> = {
  rule: "правило",
  rule_ext: "правило",
  unit: "отряд",
  hero: "герой",
  spell: "заклинание",
  ability: "способность",
  artifact: "артефакт",
  building: "здание",
  town_building: "здание",
  field: "элемент карты",
  statistic: "атрибут",
  event: "событие",
  war_machine: "боевая машина",
  astrologer: "астролог",
  ai_card: "ИИ карта",
  map_event: "событие карты",
  morale: "мораль",
  pandora: "Ящик Пандоры",
  glyph: "иконка",
};

const SOURCE_REGEX = /\[([^\]]+)\]\(([a-z_]+):([^)]+)\)/g;

export default function ChatSources({ content, lang }: Props) {
  const navigate = useNavigate();

  const sources = useMemo(() => {
    if (!content) return [];
    const seen = new Set<string>();
    const result: Source[] = [];
    let match: RegExpExecArray | null;
    SOURCE_REGEX.lastIndex = 0;
    while ((match = SOURCE_REGEX.exec(content)) !== null) {
      const [, name, type, id] = match;
      const key = `${type}:${id}`;
      if (seen.has(key)) continue;
      const url = entityLinkUrl(type, id);
      const labelsMap = lang === "RU" ? TYPE_LABEL_RU : TYPE_LABEL_EN;
      // Skip only if both no URL AND no known label (truly unknown type).
      if (!url && !labelsMap[type]) continue;
      seen.add(key);
      result.push({ type, id, name, url });
    }
    return result;
  }, [content, lang]);

  if (sources.length === 0) return null;

  const labels = lang === "RU" ? TYPE_LABEL_RU : TYPE_LABEL_EN;
  const headingText = lang === "RU" ? "Источники:" : "Sources:";

  return (
    <div className="mt-2 pt-2 border-t border-border/50">
      <div className="flex flex-row flex-wrap items-center gap-1">
        <span className="text-[11px] text-muted-foreground mr-1 shrink-0 font-medium">
          {headingText}
        </span>
        {sources.map((s) => {
          const typeLabel = labels[s.type] ?? s.type;
          return (
            <button
              key={`${s.type}:${s.id}`}
              onClick={() => navigate(s.url)}
              className="text-[11px] px-2 py-0.5 rounded-full border border-primary text-primary bg-primary/10 hover:bg-primary/20 transition-colors font-medium inline-flex items-center gap-1"
            >
              <span className="opacity-70">{typeLabel}:</span>
              <span>{s.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
