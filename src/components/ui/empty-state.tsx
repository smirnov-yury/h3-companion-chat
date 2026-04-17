import { SearchX } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onReset?: () => void;
  title?: string;
  subtitle?: string;
}

export function EmptyState({ onReset, title, subtitle }: EmptyStateProps) {
  const { lang } = useLang();
  const t = title ?? (lang === "RU" ? "Ничего не найдено" : "Nothing found");
  const s =
    subtitle ??
    (lang === "RU"
      ? "Попробуйте изменить фильтры или поисковый запрос"
      : "Try adjusting your filters or search query");
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <SearchX size={48} className="text-muted-foreground" />
      <p className="text-lg font-medium mt-4 text-foreground">{t}</p>
      <p className="text-sm text-muted-foreground mt-1">{s}</p>
      {onReset && (
        <Button variant="outline" className="mt-4" onClick={onReset}>
          {lang === "RU" ? "Сбросить фильтры" : "Reset filters"}
        </Button>
      )}
    </div>
  );
}

interface SkeletonGridProps {
  count?: number;
  className?: string;
}

export function SkeletonGrid({
  count = 12,
  className = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3",
}: SkeletonGridProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg bg-muted animate-pulse aspect-[3/4]" />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg bg-muted animate-pulse mb-2" />
      ))}
    </div>
  );
}
