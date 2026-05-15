import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLang } from "@/context/LanguageContext";
import { getConsent, setConsent } from "@/lib/consent";

const REOPEN_EVENT = "h3m:open-cookie-banner";

export function reopenCookieBanner() {
  window.dispatchEvent(new CustomEvent(REOPEN_EVENT));
}

export default function CookieConsent() {
  const { lang } = useLang();
  const isRu = lang === "RU";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
    function handleReopen() {
      setVisible(true);
    }
    window.addEventListener(REOPEN_EVENT, handleReopen);
    return () => window.removeEventListener(REOPEN_EVENT, handleReopen);
  }, []);

  if (!visible) return null;

  function accept() {
    setConsent(true);
    setVisible(false);
  }
  function decline() {
    setConsent(false);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={isRu ? "Согласие на использование cookies" : "Cookie consent"}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg"
    >
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 sm:max-w-2xl">
            <h2 className="text-sm font-semibold">
              {isRu ? "Конфиденциальность и cookies" : "Privacy & Cookies"}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isRu ? (
                <>
                  Мы используем только необходимые cookie для работы приложения. С вашего согласия мы также подключим Google Analytics для понимания того, как используется сайт. Подробности — в нашей{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Политике конфиденциальности
                  </Link>
                  .
                </>
              ) : (
                <>
                  We use only essential cookies for the app to function. With your consent we will additionally enable Google Analytics to understand how the site is used. Details in our{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={decline}>
              {isRu ? "Отклонить" : "Decline"}
            </Button>
            <Button size="sm" onClick={accept}>
              {isRu ? "Принять" : "Accept"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
