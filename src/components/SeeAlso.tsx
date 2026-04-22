import { useNavigate } from "react-router-dom";
import { useEntityLinks } from "@/hooks/useEntityLinks";
import { entityLinkUrl } from "@/hooks/useEntityLinkHandler";

interface Props {
  entityType: string;
  entityId: string;
  lang: "EN" | "RU";
}

const TYPE_LABELS: Record<string, { en: string; ru: string }> = {
  field:         { en: "Map Element", ru: "Элемент карты" },
  event:         { en: "Event",       ru: "Событие" },
  astrologer:    { en: "Astrologers", ru: "Астрологи" },
  war_machine:   { en: "War Machine", ru: "Боевая машина" },
  town_building: { en: "Building",    ru: "Здание" },
};

export default function SeeAlso({ entityType, entityId, lang }: Props) {
  const navigate = useNavigate();
  const { links } = useEntityLinks(entityType, entityId);
  if (!links.length) return null;

  return (
    <div className="flex flex-row flex-wrap items-center gap-1 mt-2">
      <span className="text-[#E1BB3A] text-sm mr-1 shrink-0">→</span>
      {links.map((l) => {
        const baseName =
          (lang === "RU" ? l.name_ru || l.name_en : l.name_en) || l.to_id;
        const labelDef = TYPE_LABELS[l.to_type];
        const name = labelDef
          ? `${labelDef[lang === "RU" ? "ru" : "en"]}: ${baseName}`
          : baseName;
        const url = entityLinkUrl(l.to_type, l.to_id);
        return (
          <button
            key={`${l.to_type}-${l.to_id}`}
            onClick={() => url && navigate(url)}
            disabled={!url}
            className="text-[11px] px-2 py-0.5 rounded-full border border-[#E1BB3A] text-[#E1BB3A] bg-[#E1BB3A]/10 hover:bg-[#E1BB3A]/20 transition-colors disabled:opacity-50"
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
