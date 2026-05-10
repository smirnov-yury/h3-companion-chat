import {
  Sword,
  Shield,
  Sparkles,
  BookOpen,
  Coins,
  TrendingUp,
  Building2,
  Swords,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { componentImageUrl } from "@/lib/storage";
import type { PayloadPlayer } from "@/lib/setupResolver";

const FACTION_BADGE: Record<string, string> = {
  Castle:     "bg-[#E90000] text-white border-[#E90000]",
  Necropolis: "bg-[#882CA0] text-white border-[#882CA0]",
  Dungeon:    "bg-[#C07888] text-white border-[#C07888]",
  Tower:      "bg-[#3152FE] text-white border-[#3152FE]",
  Fortress:   "bg-[#0898A0] text-white border-[#0898A0]",
  Rampart:    "bg-[#449C2B] text-white border-[#449C2B]",
  Inferno:    "bg-[#F67F00] text-white border-[#F67F00]",
  Conflux:    "bg-[#F5A623] text-white border-[#F5A623]",
  Stronghold: "bg-[#9B7652] text-white border-[#9B7652]",
  Cove:       "bg-[#0369A1] text-white border-[#0369A1]",
};

const FACTION_LABEL_RU: Record<string, string> = {
  Castle: "Замок", Rampart: "Оплот", Tower: "Башня", Inferno: "Инферно",
  Necropolis: "Некрополис", Dungeon: "Темница", Stronghold: "Цитадель",
  Fortress: "Крепость", Conflux: "Сопряжение", Cove: "Причал",
};

const TIER_DOT: Record<string, string> = {
  bronze: "bg-[#A24F18]",
  silver: "bg-[#DADADA]",
  golden: "bg-[#E1BB3A]",
};

function FactionBadge({ town }: { town: string }) {
  const { lang } = useLang();
  if (!town) return null;
  const matchKey = Object.keys(FACTION_BADGE).find((k) => k.toLowerCase() === town.toLowerCase());
  const cls = matchKey ? FACTION_BADGE[matchKey] : "bg-muted text-muted-foreground border-border";
  const label = lang === "RU" ? (matchKey && FACTION_LABEL_RU[matchKey]) || town : matchKey || town;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${cls}`}>
      {label}
    </span>
  );
}

function MiniHeader({ icon: Icon, label }: { icon: typeof Coins; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
}

export default function PlayerCard({
  player,
  isStartingPlayer,
}: {
  player: PayloadPlayer;
  isStartingPlayer: boolean;
}) {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();

  const heroName = player.hero
    ? (lang === "RU" ? player.hero.name_ru : player.hero.name_en) || player.hero.name_en
    : null;

  const resourcesText =
    (lang === "RU" ? player.starting_resources_text_ru : player.starting_resources_text_en) || "";
  const incomeText =
    (lang === "RU" ? player.income_text_ru : player.income_text_en) || "";
  const buildingsRaw =
    (lang === "RU" ? player.starting_buildings_raw_ru : player.starting_buildings_raw_en) || "";
  const unitsRaw =
    (lang === "RU" ? player.starting_units_raw_ru : player.starting_units_raw_en) || "";

  const stats = player.hero
    ? [
        { Icon: Sword, value: player.hero.attack },
        { Icon: Shield, value: player.hero.defense },
        { Icon: Sparkles, value: player.hero.power },
        { Icon: BookOpen, value: player.hero.knowledge },
      ]
    : [];
  const showStats = stats.some((s) => s.value != null);

  return (
    <Card id={`player-${player.index}`} className="scroll-mt-24">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="text-base font-bold">
            {player.name || (lang === "RU" ? `Игрок ${player.index + 1}` : `Player ${player.index + 1}`)}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {isStartingPlayer && (
              <Badge variant="default" className="text-[10px]">
                {lang === "RU" ? "Ходит первым" : "First to play"}
              </Badge>
            )}
            <FactionBadge town={player.town} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hero */}
        <div className="flex gap-3 items-start">
          {player.hero ? (
            <>
              {player.hero.image ? (
                <img
                  src={componentImageUrl("heroes", player.hero.image)}
                  alt={heroName ?? ""}
                  className="w-16 h-16 md:w-20 md:h-20 rounded object-cover border shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded border bg-muted shrink-0" />
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="font-semibold text-sm truncate">{heroName}</div>
                {showStats && (
                  <div className="flex gap-2 flex-wrap text-xs">
                    {stats.map(({ Icon, value }, i) =>
                      value != null ? (
                        <span key={i} className="inline-flex items-center gap-0.5 text-muted-foreground">
                          <Icon className="w-3.5 h-3.5" />
                          <span className="font-mono">{value}</span>
                        </span>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground italic">
              {lang === "RU" ? "Герой не выбран" : "No hero selected"}
            </div>
          )}
        </div>

        {/* Resources */}
        {resourcesText && (
          <div className="space-y-1">
            <MiniHeader icon={Coins} label={lang === "RU" ? "Стартовые ресурсы" : "Starting resources"} />
            <div
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderGlyphs(resourcesText, glyphs) }}
            />
          </div>
        )}

        {/* Income */}
        {incomeText && (
          <div className="space-y-1">
            <MiniHeader icon={TrendingUp} label={lang === "RU" ? "Доход" : "Income"} />
            <div
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderGlyphs(incomeText, glyphs) }}
            />
          </div>
        )}

        {/* Buildings */}
        <div className="space-y-1.5">
          <MiniHeader icon={Building2} label={lang === "RU" ? "Стартовые здания" : "Starting buildings"} />
          {player.starting_buildings.length > 0 ? (
            <div className="space-y-1">
              {player.starting_buildings.map((b) => {
                const name = (lang === "RU" ? b.name_ru : b.name_en) || b.name_en;
                return (
                  <div key={b.id} className="flex items-center justify-between gap-2 rounded border bg-muted/30 px-2 py-1.5 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      {b.tier && (
                        <span className={`inline-block w-2 h-2 rounded-full ${TIER_DOT[b.tier] ?? "bg-muted"}`} />
                      )}
                      <span className="truncate">{name}</span>
                    </div>
                    {b.cost && (
                      <span
                        className="text-xs text-muted-foreground whitespace-nowrap"
                        dangerouslySetInnerHTML={{ __html: renderGlyphs(b.cost, glyphs) }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : buildingsRaw ? (
            <div className="rounded border border-yellow-500/50 bg-yellow-500/10 p-2 text-xs space-y-1">
              <div className="text-yellow-600 dark:text-yellow-400 font-semibold">
                {lang === "RU" ? "Не удалось распарсить" : "Failed to parse"}
              </div>
              <div dangerouslySetInnerHTML={{ __html: renderGlyphs(buildingsRaw, glyphs) }} />
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">—</div>
          )}
        </div>

        {/* Units */}
        <div className="space-y-1.5">
          <MiniHeader icon={Swords} label={lang === "RU" ? "Стартовые юниты" : "Starting units"} />
          {player.starting_units_resolved && player.starting_units.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {player.starting_units.map((u, i) => {
                const name = (lang === "RU" ? u.name_ru : u.name_en) || u.name_en;
                return (
                  <div key={`${u.unit_id}-${i}`} className="rounded border bg-muted/30 p-1.5 space-y-1">
                    {u.image ? (
                      <img
                        src={componentImageUrl("unit_stats", u.image)}
                        alt={name}
                        className="w-full aspect-[5/7] object-cover rounded"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full aspect-[5/7] rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground p-1 text-center">
                        {name}
                      </div>
                    )}
                    <div className="text-[11px] font-semibold truncate">
                      <span className="text-muted-foreground">{u.squad}</span> {name}
                    </div>
                    {u.cost && (
                      <div
                        className="text-[10px] text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: renderGlyphs(u.cost, glyphs) }}
                      />
                    )}
                    <span className={`inline-block w-2 h-2 rounded-full ${TIER_DOT[u.tier] ?? "bg-muted"}`} />
                  </div>
                );
              })}
            </div>
          ) : unitsRaw ? (
            <div className="rounded border border-yellow-500/50 bg-yellow-500/10 p-2 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-yellow-600 dark:text-yellow-400 font-semibold">
                  {lang === "RU" ? "Разберите вручную" : "Parse manually"}
                </div>
                <div dangerouslySetInnerHTML={{ __html: renderGlyphs(unitsRaw, glyphs) }} />
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">—</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
