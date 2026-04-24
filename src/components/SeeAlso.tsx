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
      <span className="text-primary text-sm mr-1 shrink-0 font-semibold">→</span>
      {links.map((l) => {
        const baseName =
...
            onClick={() => url && navigate(url)}
            disabled={!url}
            className="text-[11px] px-2 py-0.5 rounded-full border border-primary text-primary bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-50 font-medium"
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
