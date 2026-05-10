import { useLang } from "@/context/LanguageContext";
import PlayerCard from "./PlayerCard";
import type { PayloadPlayer } from "@/lib/setupResolver";

export default function PlayersGrid({
  players,
  startingPlayerIndex,
}: {
  players: PayloadPlayer[];
  startingPlayerIndex: number | null;
}) {
  const { lang } = useLang();

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">
        {lang === "RU" ? "Игроки" : "Players"}
      </h2>

      {/* Mobile quick-jump tab bar */}
      <div className="md:hidden -mx-4 px-4 overflow-x-auto sticky top-0 z-10 bg-background/90 backdrop-blur py-2 border-b">
        <div className="flex gap-2">
          {players.map((p, i) => (
            <a
              key={p.index}
              href={`#player-${p.index}`}
              className="text-xs px-3 py-1.5 rounded-full border bg-card whitespace-nowrap hover:bg-accent"
            >
              {p.name || (lang === "RU" ? `Игрок ${i + 1}` : `Player ${i + 1}`)}
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {players.map((p) => (
          <PlayerCard
            key={p.index}
            player={p}
            isStartingPlayer={startingPlayerIndex === p.index}
          />
        ))}
      </div>
    </section>
  );
}
