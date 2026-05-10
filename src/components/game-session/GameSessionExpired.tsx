import { Link } from "react-router-dom";
import { Hourglass } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";

export default function GameSessionExpired() {
  const { lang } = useLang();
  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-5">
      <div className="flex justify-center">
        <div className="rounded-full bg-muted p-4">
          <Hourglass className="w-10 h-10 text-muted-foreground" />
        </div>
      </div>
      <h1 className="text-2xl font-semibold">
        {lang === "RU" ? "Партия завершена" : "Session expired"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {lang === "RU"
          ? "Эта партия была сгенерирована более 24 часов назад и автоматически удалена. Все партии живут 24 часа со времени создания."
          : "This game session was generated more than 24 hours ago and has been removed. All sessions live for 24 hours after creation."}
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
        <Button asChild>
          <Link to="/game-setup">
            {lang === "RU" ? "Создать новую партию" : "Create new session"}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">
            {lang === "RU" ? "На главную" : "Home"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
