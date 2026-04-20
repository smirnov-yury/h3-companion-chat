import { useNavigate } from "react-router-dom";
import { useEntityLinks } from "@/hooks/useEntityLinks";
import { entityLinkUrl } from "@/hooks/useEntityLinkHandler";

interface Props {
  entityType: string;
  entityId: string;
  lang: "EN" | "RU";
}

const TYPE_LABELS: Record<string, { en: string; ru: string }> = {
  spell: { en: "Spells", ru: "Заклинания" },
  ability: { en: "Abilities", ru: "Способности" },
  artifact: { en: "Artifacts", ru: "Артефакты" },
  unit: { en: "Units", ru: "Юниты" },
  hero: { en: "Heroes", ru: "Герои" },
  rule: { en: "Rules", ru: "Правила" },
};

export default function SeeAlso({ entityType, entityId, lang }: Props) {
  const navigate = useNavigate();
  const { links } = useEntityLinks(entityType, entityId);
  if (!links.length) return null;

  // Group by to_type
  const groups = new Map<string, typeof links>();
  links.forEach((l) => {
    if (!groups.has(l.to_type)) groups.set(l.to_type, []);
    groups.get(l.to_type)!.push(l);
  });

  return (
    <div className="px-4 pb-4 pt-2 border-t border-border space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">
        {lang === "RU" ? "Смотри также:" : "See also:"}
      </p>
      {Array.from(groups.entries()).map(([type, items]) => {
        const label = TYPE_LABELS[type];
        return (
          <div key={type} className="space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {label ? (lang === "RU" ? label.ru : label.en) : type}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {items.map((l) => {
                const name =
                  (lang === "RU" ? l.name_ru || l.name_en : l.name_en) || l.to_id;
                const url = entityLinkUrl(l.to_type, l.to_id);
                return (
                  <button
                    key={`${l.to_type}-${l.to_id}`}
                    onClick={() => url && navigate(url)}
                    disabled={!url}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-[#E1BB3A] text-[#E1BB3A] bg-[#E1BB3A]/10 hover:bg-[#E1BB3A]/20 transition-colors disabled:opacity-50"
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
