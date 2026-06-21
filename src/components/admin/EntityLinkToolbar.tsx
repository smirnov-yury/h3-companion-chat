import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";

interface EntityLinkToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement>;
  onChange: (value: string) => void;
}

interface Match {
  entity_type: string;
  entity_id: string;
  name_en: string;
  name_ru: string;
}

function insertAtCursor(
  el: HTMLTextAreaElement | HTMLInputElement,
  token: string,
  onChange: (v: string) => void,
) {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? start;
  const before = el.value.slice(0, start);
  const after = el.value.slice(end);
  const next = before + token + after;
  onChange(next);
  requestAnimationFrame(() => {
    el.focus();
    const pos = start + token.length;
    try { el.setSelectionRange(pos, pos); } catch { /* noop */ }
  });
}

export default function EntityLinkToolbar({ textareaRef, onChange }: EntityLinkToolbarProps) {
  const { lang } = useLang();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (debounced.length < 2) { setMatches([]); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: embedData, error: embedErr } = await supabase.functions.invoke('embed-query', { body: { text: debounced } });
        if (embedErr || !embedData?.embedding) throw new Error('embed failed');
        const rpc = lang === 'RU' ? 'match_hybrid_ru' : 'match_hybrid_en';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.rpc as any)(rpc, {
          query_text: debounced,
          query_embedding: embedData.embedding,
          match_count: 30,
          match_threshold: 0.15,
        });
        if (!cancelled) setMatches((data as Match[]) ?? []);
      } catch {
        if (!cancelled) setMatches([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debounced, lang]);

  const displayName = (m: Match) =>
    lang === 'RU' ? (m.name_ru || m.name_en) : (m.name_en || m.name_ru);

  const pick = (m: Match) => {
    if (!textareaRef.current) return;
    const token = `[${displayName(m)}](${m.entity_type}:${m.entity_id})`;
    insertAtCursor(textareaRef.current, token, onChange);
  };

  return (
    <div className="flex flex-col gap-2 p-2 rounded-lg border border-border bg-muted/20 w-full">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search entities..."
        className="w-full bg-transparent text-xs text-foreground outline-none border border-border rounded px-2 py-1 placeholder:text-muted-foreground"
        autoFocus
      />
      <div className="max-h-[360px] overflow-y-auto flex flex-col gap-1">
        {debounced.length < 2 && (
          <span className="text-xs text-muted-foreground italic px-1">Type to search...</span>
        )}
        {debounced.length >= 2 && loading && (
          <span className="text-xs text-muted-foreground italic px-1">Searching...</span>
        )}
        {debounced.length >= 2 && !loading && matches.length === 0 && (
          <span className="text-xs text-muted-foreground italic px-1">No matches</span>
        )}
        {matches.map((m) => (
          <button
            key={`${m.entity_type}:${m.entity_id}`}
            type="button"
            onClick={() => pick(m)}
            className="flex items-center justify-between gap-2 text-left text-xs px-2 py-1.5 rounded hover:bg-accent border border-transparent hover:border-border transition-colors"
          >
            <span className="truncate text-foreground">{displayName(m)}</span>
            <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground border border-border rounded px-1.5 py-0.5">
              {m.entity_type}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
