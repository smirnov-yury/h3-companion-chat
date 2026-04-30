import { GLYPH_SVGS } from "@/utils/glyphSvgs";

interface GlyphToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onChange: (value: string) => void;
}

const GLYPH_GROUPS: { label: string; tokens: string[] }[] = [
  {
    label: "Resources",
    tokens: ["gold", "treasure", "valuables", "building_materials", "resource_die"],
  },
  {
    label: "Unit stats",
    tokens: ["attack", "defense", "health_points", "initiative", "movement", "damage"],
  },
  {
    label: "Cards",
    tokens: ["spell", "hand", "activation", "instant", "ongoing", "permanent", "empower", "reinforce", "expert"],
  },
  {
    label: "Tiers",
    tokens: ["bronze", "silver", "azure", "golden"],
  },
  {
    label: "Effects",
    tokens: ["morale_positive", "morale_negative", "paralysis", "necro", "map_effect", "experience", "pay", "or"],
  },
  {
    label: "Units",
    tokens: ["unit_attack", "unit_ranged", "unit_flying", "unit_ground", "unit_retaliate", "unit_special"],
  },
];

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  token: string,
  onChange: (v: string) => void,
) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? start;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  const inserted = `<${token}>`;
  const next = before + inserted + after;
  onChange(next);
  requestAnimationFrame(() => {
    textarea.focus();
    const pos = start + inserted.length;
    textarea.setSelectionRange(pos, pos);
  });
}

export default function GlyphToolbar({ textareaRef, onChange }: GlyphToolbarProps) {
  return (
    <div className="flex flex-wrap gap-3 p-2 rounded-lg border border-border bg-muted/20">
      {GLYPH_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {group.label}
          </span>
          <div className="flex flex-wrap gap-1">
            {group.tokens.map((token) => {
              const svg = GLYPH_SVGS[token];
              if (!svg) return null;
              const sized = svg.replace(
                "<svg ",
                `<svg class="w-5 h-5" `,
              );
              return (
                <button
                  key={token}
                  type="button"
                  title={`<${token}>`}
                  onClick={() => {
                    if (textareaRef.current) {
                      insertAtCursor(textareaRef.current, token, onChange);
                    }
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent border border-transparent hover:border-border transition-colors shrink-0"
                  dangerouslySetInnerHTML={{ __html: sized }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
