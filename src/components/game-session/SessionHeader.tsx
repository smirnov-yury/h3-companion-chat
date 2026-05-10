import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/context/LanguageContext";
import type { Payload } from "@/lib/setupResolver";

function formatExpires(expiresAt: string, lang: "RU" | "EN"): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (isNaN(ms) || ms <= 0) return lang === "RU" ? "истекла" : "expired";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return lang === "RU" ? `истекает через ${hours} ч` : `expires in ${hours}h`;
  const minutes = Math.max(1, Math.floor(ms / 60_000));
  return lang === "RU" ? `истекает через ${minutes} мин` : `expires in ${minutes}m`;
}

export default function SessionHeader({ payload, expiresAt }: { payload: Payload; expiresAt: string }) {
  const { lang } = useLang();
  const sc = payload.scenario;
  const title = (lang === "RU" ? sc.title_ru : sc.title_en) || sc.title_en;
  const bookTitle = (lang === "RU" ? sc.book_title_ru : sc.book_title_en) || sc.book_title_en || "—";
  const playersLabel = lang === "RU" ? "игроков" : "players";
  const modeLabel = sc.mode === "clash" || sc.mode === "Clash" ? "Clash" : sc.mode;

  return (
    <div className="border-b bg-card">
      <div className="px-4 py-5 md:flex md:items-start md:justify-between md:gap-6">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">{title}</h1>
          <div className="text-sm text-muted-foreground">
            {bookTitle} · {modeLabel} · {payload.player_count} {playersLabel}
          </div>
          <div className="text-xs text-muted-foreground md:hidden mt-1">
            {formatExpires(expiresAt, lang)}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 md:mt-0 md:flex-col md:items-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => console.log("share TBD")}
          >
            <Share2 className="w-4 h-4" />
            {lang === "RU" ? "Поделиться" : "Share"}
          </Button>
          <div className="hidden md:block text-xs text-muted-foreground">
            {formatExpires(expiresAt, lang)}
          </div>
        </div>
      </div>
    </div>
  );
}
