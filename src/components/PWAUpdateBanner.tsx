import { useEffect, useState } from "react";
import { onPWAUpdate, applyPWAUpdate } from "@/pwa/registerSW";
import { useLang } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function PWAUpdateBanner() {
  const { lang } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const off = onPWAUpdate((needsRefresh) => setShow(needsRefresh));
    return off;
  }, []);

  if (!show) return null;

  const isRu = lang === "RU";

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card shadow-lg px-4 py-3">
        <RefreshCw className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm flex-1">
          {isRu
            ? "Доступно обновление — Перезагрузите для получения новой версии"
            : "Update available — Reload to get the latest version"}
        </p>
        <Button size="sm" onClick={applyPWAUpdate}>
          {isRu ? "Обновить" : "Reload"}
        </Button>
      </div>
    </div>
  );
}
