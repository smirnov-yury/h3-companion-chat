import { useLang } from "@/context/LanguageContext";

interface Props {
  current: number;
  total: number;
}

export default function StepProgress({ current, total }: Props) {
  const { lang } = useLang();
  return (
    <div className="sticky top-11 z-10 bg-background border-b border-border py-3 px-4">
      <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
        {Array.from({ length: total }).map((_, i) => {
          const step = i + 1;
          const active = step === current;
          const done = step < current;
          return (
            <div key={step} className="flex items-center gap-2 flex-1 last:flex-none">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                    ? "bg-primary/40 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step}
              </div>
              {step < total && (
                <div className={`flex-1 h-0.5 ${done ? "bg-primary/40" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="text-center text-xs text-muted-foreground mt-2">
        {lang === "RU" ? `Шаг ${current} из ${total}` : `Step ${current} of ${total}`}
      </div>
    </div>
  );
}
