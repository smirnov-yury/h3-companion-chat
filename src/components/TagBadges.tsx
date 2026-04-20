import { useNavigate } from "react-router-dom";
import { useEntityTags } from "@/hooks/useEntityTags";

interface Props {
  entityType: string;
  entityId: string;
  lang: "EN" | "RU";
}

function badgeClass(category: string): string {
  switch (category) {
    case "faction":
      return "border border-[#E1BB3A] text-[#E1BB3A] bg-[#E1BB3A]/10";
    case "tier-bronze":
      return "text-white bg-[#A24F18]";
    case "tier-silver":
      return "text-black bg-[#DADADA]";
    case "tier-golden":
      return "text-black bg-[#E1BB3A]";
    case "school-fire":
      return "text-white bg-red-600";
    case "school-water":
      return "text-white bg-blue-600";
    case "school-earth":
      return "text-white bg-green-700";
    case "school-air":
      return "text-white bg-cyan-600";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function resolveCategory(category: string, name: string): string {
  // Tier sub-categorization based on tag name
  if (category === "tier") {
    const n = name.toLowerCase();
    if (n.includes("bronze") || n.includes("бронз")) return "tier-bronze";
    if (n.includes("silver") || n.includes("серебр")) return "tier-silver";
    if (n.includes("gold") || n.includes("золот")) return "tier-golden";
    return "tier-bronze";
  }
  if (category === "school") {
    const n = name.toLowerCase();
    if (n.includes("fire") || n.includes("огн")) return "school-fire";
    if (n.includes("water") || n.includes("вод")) return "school-water";
    if (n.includes("earth") || n.includes("земл")) return "school-earth";
    if (n.includes("air") || n.includes("возд")) return "school-air";
  }
  return category;
}

export default function TagBadges({ entityType, entityId, lang }: Props) {
  const navigate = useNavigate();
  const { tags } = useEntityTags(entityType, entityId);
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-4 py-2">
      {tags.map((t) => {
        const name = lang === "RU" ? t.name_ru || t.name_en : t.name_en;
        const cls = badgeClass(resolveCategory(t.category, name));
        return (
          <button
            key={t.id}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/?q=${encodeURIComponent(name)}`);
            }}
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full transition-opacity hover:opacity-80 ${cls}`}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
