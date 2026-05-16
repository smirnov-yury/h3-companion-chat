import { useState } from "react";
import { ChevronDown, Bot } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import type { Payload } from "@/lib/setupResolver";

type AISetup = NonNullable<Payload["ai_setup"]>;

export default function AISetupSection({ aiSetup }: { aiSetup: AISetup }) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const [open, setOpen] = useState(false);

  const faction = lang === "RU" ? aiSetup.ai_faction_ru : aiSetup.ai_faction_en;
  const heroes = lang === "RU" ? aiSetup.enemy_heroes_ru : aiSetup.enemy_heroes_en;
  const armies = lang === "RU" ? aiSetup.enemy_armies_ru : aiSetup.enemy_armies_en;
  const decks = lang === "RU" ? aiSetup.enemy_decks_ru : aiSetup.enemy_decks_en;
  const spellDeck = lang === "RU" ? aiSetup.enemy_spell_deck_ru : aiSetup.enemy_spell_deck_en;
  const special = lang === "RU" ? aiSetup.special_setup_ru : aiSetup.special_setup_en;
  const notes = lang === "RU" ? aiSetup.notes_ru : aiSetup.notes_en;

  const isEmpty =
    !faction &&
    heroes.length === 0 &&
    armies.length === 0 &&
    decks.length === 0 &&
    spellDeck.length === 0 &&
    !special &&
    !notes;
  if (isEmpty) return null;

  const renderList = (
    title: string,
    items: Array<{ name: string; units?: string; cards?: string }>,
    valueKey: "units" | "cards",
  ) => (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">{title}</div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-sm">
            <span className="font-medium">{it.name}:</span>{" "}
            <span dangerouslySetInnerHTML={{ __html: renderGlyphs(it[valueKey] ?? "", glyphs) }} />
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{lang === "RU" ? "Противник (ИИ)" : "Enemy (AI)"}</h2>
      <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border bg-card">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-4">
          <span className="flex items-center gap-2 text-sm font-semibold text-left">
            <Bot className="w-4 h-4 text-primary shrink-0" />
            {faction || (lang === "RU" ? "ИИ-противник" : "AI opponent")}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-4">
          {heroes.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                {lang === "RU" ? "Герои" : "Heroes"}
              </div>
              <ul className="space-y-1">
                {heroes.map((h, i) => (
                  <li key={i} className="text-sm">{h}</li>
                ))}
              </ul>
            </div>
          )}
          {armies.length > 0 && renderList(lang === "RU" ? "Армии" : "Armies", armies, "units")}
          {decks.length > 0 && renderList(lang === "RU" ? "Колоды" : "Decks", decks, "cards")}
          {spellDeck.length > 0 && renderList(lang === "RU" ? "Колода заклинаний" : "Spell deck", spellDeck, "cards")}
          {special && (
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                {lang === "RU" ? "Особая подготовка" : "Special setup"}
              </div>
              <div
                className="text-sm leading-relaxed whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: renderGlyphs(special, glyphs) }}
              />
            </div>
          )}
          {notes && (
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                {lang === "RU" ? "Заметки" : "Notes"}
              </div>
              <div
                className="text-sm leading-relaxed whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: renderGlyphs(notes, glyphs) }}
              />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
