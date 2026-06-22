import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/context/LanguageContext";
import { Plus, Save, Trash2, Loader2 } from "lucide-react";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

interface LinkRow {
  id: number;
  from_type: string;
  from_id: string;
  to_type: string;
  to_id: string;
  link_type: string;
  context_text: string | null;
  sort_order: number;
}

interface PickedEntity {
  entity_type: string;
  entity_id: string;
  name: string;
}

interface Match {
  entity_type: string;
  entity_id: string;
  name_en: string;
  name_ru: string;
}

const LINK_TYPE_SUGGESTIONS = [
  "references_spell",
  "uses_ability",
  "references_rule",
  "references_ability",
  "references_unit",
  "references_field",
];

function EntityPicker({
  label,
  value,
  onPick,
}: {
  label: string;
  value: PickedEntity | null;
  onPick: (v: PickedEntity) => void;
}) {
  const { lang } = useLang();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [open, setOpen] = useState(false);

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

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="text-xs font-mono text-foreground px-2 py-1 rounded bg-muted/30 border border-border">
        {value ? `${value.entity_type}:${value.entity_id} — ${value.name}` : "none yet"}
      </div>
      <input
        type="text"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search entities..."
        className="w-full bg-transparent text-xs text-foreground outline-none border border-border rounded px-2 py-1 placeholder:text-muted-foreground"
      />
      {open && debounced.length >= 2 && (
        <div className="max-h-[260px] overflow-y-auto flex flex-col gap-1 p-1 rounded border border-border bg-card">
          {loading && (
            <span className="text-xs text-muted-foreground italic px-1">Searching...</span>
          )}
          {!loading && matches.length === 0 && (
            <span className="text-xs text-muted-foreground italic px-1">No matches</span>
          )}
          {matches.map((m) => (
            <button
              key={`${m.entity_type}:${m.entity_id}`}
              type="button"
              onClick={() => {
                onPick({ entity_type: m.entity_type, entity_id: m.entity_id, name: displayName(m) });
                setOpen(false);
                setQ("");
              }}
              className="flex items-center justify-between gap-2 text-left text-xs px-2 py-1.5 rounded hover:bg-accent border border-transparent hover:border-border transition-colors"
            >
              <span className="truncate text-foreground">{displayName(m)}</span>
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground border border-border rounded px-1.5 py-0.5">
                {m.entity_type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EntityLinksEditor() {
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [fromEntity, setFromEntity] = useState<PickedEntity | null>(null);
  const [toEntity, setToEntity] = useState<PickedEntity | null>(null);
  const [linkType, setLinkType] = useState("");
  const [contextText, setContextText] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("entity_links")
      .select("id,from_type,from_id,to_type,to_id,link_type,context_text,sort_order")
      .order("from_type")
      .order("from_id")
      .order("sort_order");
    setRows((data as LinkRow[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const canAdd = !!fromEntity && !!toEntity && linkType.trim().length > 0;

  const add = async () => {
    if (!canAdd || !fromEntity || !toEntity) return;
    setAdding(true);
    const { error } = await supabase.from("entity_links").insert({
      from_type: fromEntity.entity_type,
      from_id: fromEntity.entity_id,
      to_type: toEntity.entity_type,
      to_id: toEntity.entity_id,
      link_type: linkType.trim(),
      context_text: contextText.trim() || null,
      sort_order: sortOrder || 0,
    });
    setAdding(false);
    if (!error) {
      setFromEntity(null);
      setToEntity(null);
      setLinkType("");
      setContextText("");
      setSortOrder(0);
      await load();
    }
  };

  const edit = (id: number, field: "link_type" | "context_text" | "sort_order", value: string | number) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const save = async (id: number) => {
    const r = rows.find((x) => x.id === id);
    if (!r) return;
    setSavingIds((p) => new Set(p).add(id));
    await supabase.from("entity_links").update({
      link_type: r.link_type,
      sort_order: r.sort_order,
      context_text: r.context_text?.trim() ? r.context_text : null,
    }).eq("id", id);
    setSavingIds((p) => { const n = new Set(p); n.delete(id); return n; });
  };

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    setDeleting(true);
    await supabase.from("entity_links").delete().eq("id", deleteTarget);
    setRows((prev) => prev.filter((r) => r.id !== deleteTarget));
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Entity Links</h1>
        <p className="text-sm text-muted-foreground">
          Manage "See Also" relations between entities. Each row links a FROM entity to a TO entity by a link type.
        </p>
      </div>

      <div className="rounded-md bg-card border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Add link</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <EntityPicker label="From" value={fromEntity} onPick={setFromEntity} />
          <EntityPicker label="To" value={toEntity} onPick={setToEntity} />
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Link type</span>
            <input
              list="entity-link-types"
              value={linkType}
              onChange={(e) => setLinkType(e.target.value)}
              placeholder="references_spell"
              className="bg-transparent text-xs text-foreground outline-none border border-border rounded px-2 py-1"
            />
            <datalist id="entity-link-types">
              {LINK_TYPE_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Context (optional)</span>
            <input
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              placeholder=""
              className="bg-transparent text-xs text-foreground outline-none border border-border rounded px-2 py-1"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Sort order</span>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              className="bg-transparent text-xs text-foreground outline-none border border-border rounded px-2 py-1"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!canAdd || adding}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">
          Existing links {loading ? <Loader2 className="inline w-3 h-3 animate-spin ml-1" /> : <span className="text-muted-foreground">({rows.length})</span>}
        </h2>
        <div className="space-y-1">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-2 px-2 py-1.5 rounded-md bg-card border border-border">
              <span className="text-xs font-mono text-muted-foreground">{r.from_type}:{r.from_id}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-xs font-mono text-muted-foreground">{r.to_type}:{r.to_id}</span>
              <input
                value={r.link_type}
                onChange={(e) => edit(r.id, "link_type", e.target.value)}
                placeholder="link_type"
                className="w-44 bg-transparent text-xs text-foreground outline-none border-b border-transparent focus:border-border px-1"
              />
              <input
                type="number"
                value={r.sort_order}
                onChange={(e) => edit(r.id, "sort_order", Number(e.target.value) || 0)}
                className="w-16 bg-transparent text-xs text-foreground outline-none border-b border-transparent focus:border-border px-1"
              />
              <input
                value={r.context_text ?? ""}
                onChange={(e) => edit(r.id, "context_text", e.target.value)}
                placeholder="context"
                className="flex-1 min-w-[120px] bg-transparent text-xs text-foreground outline-none border-b border-transparent focus:border-border px-1"
              />
              <button type="button" onClick={() => save(r.id)} className="text-primary hover:text-primary/80" title="Save">
                {savingIds.has(r.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
              <button type="button" onClick={() => setDeleteTarget(r.id)} className="text-destructive/60 hover:text-destructive" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {!loading && rows.length === 0 && (
            <p className="text-xs text-muted-foreground italic px-2">No links yet.</p>
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
