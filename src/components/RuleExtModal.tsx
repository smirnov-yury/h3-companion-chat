import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import H3MasterSpinner from "@/components/H3MasterSpinner";
import { useLang } from "@/context/LanguageContext";
import { useRuleExtModal } from "@/context/RuleExtModalContext";

interface RuleExtRow {
  id: number;
  section_title: string;
  section_title_ru: string | null;
  text_en: string;
  text_ru: string | null;
  source: string;
  page_start: number | null;
  page_end: number | null;
}

export default function RuleExtModal() {
  const { openId, closeRuleExt } = useRuleExtModal();
  const { lang } = useLang();
  const isRu = lang === "RU";

  const query = useQuery({
    queryKey: ["rule_ext", openId],
    enabled: openId !== null,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (openId === null) return null;
      const { data, error } = await supabase
        .from("rules_extended")
        .select("id, section_title, section_title_ru, text_en, text_ru, source, page_start, page_end")
        .eq("id", openId)
        .maybeSingle();
      if (error) throw error;
      return (data as RuleExtRow) ?? null;
    },
  });

  const row = query.data ?? null;
  const title = isRu ? (row?.section_title_ru ?? row?.section_title ?? "") : (row?.section_title ?? "");
  const body = isRu ? (row?.text_ru ?? row?.text_en ?? "") : (row?.text_en ?? "");

  const pageLabel = row && row.page_start
    ? row.page_end && row.page_end !== row.page_start
      ? `pp. ${row.page_start}–${row.page_end}`
      : `p. ${row.page_start}`
    : null;

  return (
    <Dialog
      open={openId !== null}
      onOpenChange={(open) => {
        if (!open) closeRuleExt();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="pr-8">
            {query.isPending
              ? isRu ? "Загрузка..." : "Loading..."
              : query.isError
                ? isRu ? "Не удалось загрузить правило" : "Failed to load rule"
                : row
                  ? title
                  : isRu ? "Правило не найдено" : "Rule not found"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {query.isPending && (
            <div className="flex items-center justify-center py-12">
              <H3MasterSpinner size={48} variant="draw" className="text-primary" />
            </div>
          )}

          {query.isError && !query.isPending && (
            <p className="text-sm text-destructive py-4">
              {isRu
                ? "Произошла ошибка при загрузке. Попробуйте закрыть и снова открыть."
                : "An error occurred while loading. Try closing and reopening."}
            </p>
          )}

          {!query.isPending && !query.isError && row && (
            <div className="text-sm leading-relaxed whitespace-pre-line text-foreground">
              {body}
            </div>
          )}
        </div>

        {row && (row.source || pageLabel) && (
          <div className="flex items-center gap-2 pt-3 mt-2 border-t text-xs text-muted-foreground">
            <span>{row.source}</span>
            {pageLabel && <span>· {pageLabel}</span>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
