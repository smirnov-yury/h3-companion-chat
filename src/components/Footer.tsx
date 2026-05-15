import { Link } from "react-router-dom";
import { useLang } from "@/context/LanguageContext";
import { reopenCookieBanner } from "@/components/CookieConsent";

interface FooterProps {
  /** "default" = full footer with links + disclaimer; "minimal" = inline links only (used on HomePage). */
  variant?: "default" | "minimal";
}

export default function Footer({ variant = "default" }: FooterProps) {
  const { lang } = useLang();
  const isRu = lang === "RU";

  const linkClass =
    "text-xs text-muted-foreground hover:text-primary transition-colors";

  const links = (
    <>
      <Link to="/about" className={linkClass}>
        {isRu ? "О приложении" : "About"}
      </Link>
      <Link to="/privacy" className={linkClass}>
        {isRu ? "Конфиденциальность" : "Privacy"}
      </Link>
      <Link to="/terms" className={linkClass}>
        {isRu ? "Условия" : "Terms"}
      </Link>
      <button type="button" onClick={reopenCookieBanner} className={linkClass}>
        {isRu ? "Настройки cookies" : "Cookie preferences"}
      </button>
    </>
  );

  if (variant === "minimal") {
    return (
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {links}
      </nav>
    );
  }

  return (
    <footer className="mt-12 pt-6 border-t border-border space-y-3 text-center">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {links}
      </nav>
      <p className="text-xs text-muted-foreground">
        © 2026 H3 Master ·{" "}
        {isRu
          ? "Неофициальный фанатский компаньон"
          : "Unofficial fan-made companion"}
      </p>
    </footer>
  );
}
