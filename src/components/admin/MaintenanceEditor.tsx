import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, RefreshCw, Trash2, Zap, FileSearch, ScrollText } from "lucide-react";

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="border border-border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function CodeBlock({ value }: { value: unknown }) {
  return (
    <pre className="bg-muted text-xs p-3 rounded overflow-x-auto whitespace-pre-wrap break-all">
      {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
    </pre>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatTs(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toISOString().replace("T", " ").slice(0, 19);
}

function CardCachePurge() {
  const [mode, setMode] = useState<"everything" | "files">("everything");
  const [urlsText, setUrlsText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<unknown>(null);

  const urls = useMemo(
    () => urlsText.split("\n").map((s) => s.trim()).filter((s) => s.length > 0),
    [urlsText],
  );

  async function purge() {
    setBusy(true);
    setResult(null);
    const body: Record<string, unknown> = { mode };
    if (mode === "files") body.urls = urls;
    const { data, error } = await supabase.functions.invoke("cache-purge", { body });
    if (error) {
      setResult({ error: error.message, details: data });
      toast.error("Cache purge failed");
    } else {
      setResult(data);
      toast.success(mode === "everything" ? "Purged entire zone" : `Purged ${urls.length} URL(s)`);
    }
    setBusy(false);
  }

  return (
    <Section title="Cloudflare cache purge" icon={Zap}>
      <p className="text-sm text-muted-foreground">
        Calls Cloudflare Purge Cache API on the h3master.app zone via the cache-purge Edge function.
      </p>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Mode</label>
        <Select value={mode} onValueChange={(v) => setMode(v as "everything" | "files")}>
          <SelectTrigger className="w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="everything">Purge everything (entire zone)</SelectItem>
            <SelectItem value="files">Purge specific URLs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === "files" && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            One URL per line, max 30. Must start with https://h3master.app/...
          </label>
          <Textarea
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            placeholder={"https://h3master.app/heroes\nhttps://h3master.app/scenarios/conflux-deluge"}
            rows={5}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">{urls.length} URL(s) ready</p>
        </div>
      )}

      <div>
        {mode === "everything" ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={busy} variant="destructive">
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Purge everything
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Purge entire Cloudflare zone?</AlertDialogTitle>
                <AlertDialogDescription>
                  All cached content on h3master.app will be evicted from Cloudflare edge. Origin will receive traffic burst until cache rebuilds. Confirm only if you understand the egress impact.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={purge}>Purge everything</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button onClick={purge} disabled={busy || urls.length === 0 || urls.length > 30}>
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            Purge {urls.length} URL(s)
          </Button>
        )}
      </div>

      {result !== null && <CodeBlock value={result} />}
    </Section>
  );
}

const REGEN_TABLES = [
  "abilities", "ai_cards", "artifacts", "astrologers_proclaim", "events",
  "fields", "heroes", "map_events", "morale_cards", "pandora_box",
  "rules", "rules_extended", "scenarios", "spells", "statistics",
  "town_buildings", "towns", "unit_stats", "war_machines",
] as const;
type RegenTable = (typeof REGEN_TABLES)[number];

function CardEmbeddingRegen() {
  const [table, setTable] = useState<RegenTable>("heroes");
  const [recordId, setRecordId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<unknown>(null);

  async function regen() {
    setBusy(true);
    setResult(null);
    const { data, error } = await (supabase.rpc as any)("regen_embedding", { p_table: table, p_id: recordId.trim() });
    if (error) {
      setResult({ error: error.message });
      toast.error("Regen failed");
    } else {
      setResult(data);
      if ((data as { ok?: boolean })?.ok) {
        toast.success(`Embedding regen queued for ${table}.${recordId}`);
      } else {
        toast.error(`Regen returned ok:false - see details`);
      }
    }
    setBusy(false);
  }

  return (
    <Section title="Embedding regen" icon={RefreshCw}>
      <p className="text-sm text-muted-foreground">
        Nulls embedding_en + embedding_ru on the given row and triggers generate-embeddings Edge to recompute. Use after content fix to an indexed entity.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Table</label>
          <Select value={table} onValueChange={(v) => setTable(v as RegenTable)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGEN_TABLES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Record ID (slug or numeric)</label>
          <Input
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            placeholder="e.g. tarnum_castle or 54"
            className="font-mono text-sm"
          />
        </div>
      </div>

      <div>
        <Button onClick={regen} disabled={busy || recordId.trim().length === 0}>
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Regenerate
        </Button>
      </div>

      {result !== null && <CodeBlock value={result} />}
    </Section>
  );
}

type OrphanRow = {
  folder: string;
  filename: string;
  full_path: string;
  size_bytes: number;
  updated_at: string;
  is_orphan: boolean;
  match_kind: "direct" | "pattern" | "whitelist" | "duplicate" | "no_match";
};

function CardStorageOrphans() {
  const [rows, setRows] = useState<OrphanRow[] | null>(null);
  const [lastScanAt, setLastScanAt] = useState<Date | null>(null);
  const [bucketTotal, setBucketTotal] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlyOrphans, setOnlyOrphans] = useState(true);

  async function scan() {
    setBusy(true);
    setError(null);
    setRows(null);
    const [orphansRes, bucketCountRes] = await Promise.all([
      (supabase.rpc as any)("find_storage_orphans").range(0, 9999),
      (supabase.rpc as any)("get_storage_bucket_count", { p_bucket: "component-media" }),
    ]);
    if (orphansRes.error) {
      setError(orphansRes.error.message);
      setRows(null);
      setBucketTotal(null);
    } else {
      setRows((orphansRes.data as OrphanRow[]) || []);
      setBucketTotal(
        typeof bucketCountRes.data === "number"
          ? bucketCountRes.data
          : bucketCountRes.error
          ? null
          : Number(bucketCountRes.data) || null,
      );
      setLastScanAt(new Date());
    }
    setBusy(false);
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    return onlyOrphans ? rows.filter((r) => r.is_orphan) : rows;
  }, [rows, onlyOrphans]);

  const stats = useMemo(() => {
    if (rows === null) return null;
    const total = rows.length;
    const orphan = rows.filter((r) => r.is_orphan).length;
    const direct = rows.filter((r) => r.match_kind === "direct").length;
    const pattern = rows.filter((r) => r.match_kind === "pattern").length;
    const whitelist = rows.filter((r) => r.match_kind === "whitelist").length;
    const duplicate = rows.filter((r) => r.match_kind === "duplicate").length;
    return { total, orphan, direct, pattern, whitelist, duplicate };
  }, [rows]);

  return (
    <Section title="Storage orphan scanner" icon={FileSearch}>
      <p className="text-sm text-muted-foreground">
        Scans component-media bucket. Files with no DB reference are flagged. Bulk delete must still be done via Supabase Dashboard (storage.protect_delete blocks direct SQL).
      </p>

      <div className="flex items-center gap-3">
        <Button onClick={scan} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSearch className="w-4 h-4 mr-2" />}
          {rows === null ? "Scan storage" : "Rescan"}
        </Button>

        {rows !== null && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={onlyOrphans}
              onChange={(e) => setOnlyOrphans(e.target.checked)}
              className="accent-primary"
            />
            Orphans only
          </label>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {stats && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {bucketTotal !== null && bucketTotal > stats.total ? (
              <Badge variant="destructive" title="PostgREST truncated response — increase .range() upper bound">
                scanned {stats.total} / {bucketTotal} in bucket — limit hit
              </Badge>
            ) : (
              <Badge variant="outline">
                scanned {stats.total}
                {bucketTotal !== null ? ` / ${bucketTotal} in bucket` : ""}
              </Badge>
            )}
            <Badge variant={stats.orphan > 0 ? "destructive" : "secondary"}>orphans {stats.orphan}</Badge>
            <Badge variant="secondary">direct {stats.direct}</Badge>
            <Badge variant="secondary">pattern {stats.pattern}</Badge>
            <Badge variant="secondary">whitelist {stats.whitelist}</Badge>
            <Badge
              variant="secondary"
              className={stats.duplicate > 0 ? "bg-yellow-500/20 text-foreground border-yellow-500/50" : ""}
            >
              duplicate {stats.duplicate}
            </Badge>
          </div>
          {lastScanAt && (
            <p className="text-xs text-muted-foreground">
              Last scan: {lastScanAt.toISOString().replace("T", " ").slice(0, 19)} UTC
            </p>
          )}
        </div>
      )}

      {rows !== null && filtered.length > 0 && (
        <div className="overflow-x-auto border border-border rounded">
          <table className="w-full text-xs">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="px-2 py-1.5 font-medium">Path</th>
                <th className="px-2 py-1.5 font-medium">Size</th>
                <th className="px-2 py-1.5 font-medium">Updated</th>
                <th className="px-2 py-1.5 font-medium">Match</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.full_path}
                  className={
                    r.is_orphan
                      ? "bg-destructive/10"
                      : r.match_kind === "duplicate"
                      ? "bg-yellow-500/10 border-t border-yellow-500/30"
                      : "border-t border-border"
                  }
                >
                  <td className="px-2 py-1.5 font-mono break-all">{r.full_path}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{formatBytes(r.size_bytes)}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-muted-foreground">{formatTs(r.updated_at)}</td>
                  <td className="px-2 py-1.5">
                    <Badge
                      variant={r.match_kind === "no_match" ? "destructive" : "secondary"}
                      className={
                        "text-[10px] " +
                        (r.match_kind === "duplicate"
                          ? "bg-yellow-500/20 text-foreground border-yellow-500/50"
                          : "")
                      }
                    >
                      {r.match_kind}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows !== null && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          {onlyOrphans ? "No orphans" : "No files"}
        </p>
      )}
    </Section>
  );
}

type AuditRow = {
  id: number;
  changed_at: string;
  table_name: string;
  record_id: string | null;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
};

function CardAuditLog() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [filterTable, setFilterTable] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");

  async function load() {
    setBusy(true);
    const { data, error } = await (supabase as any)
      .from("v_db_audit_log_recent")
      .select("*")
      .order("changed_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error("Audit log load failed");
      setRows([]);
    } else {
      setRows((data as AuditRow[]) || []);
    }
    setBusy(false);
  }

  useEffect(() => {
    load();
  }, []);

  const tableOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.table_name));
    return ["all", ...Array.from(set).sort()];
  }, [rows]);

  const actionOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.action));
    return ["all", ...Array.from(set).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterTable !== "all" && r.table_name !== filterTable) return false;
      if (filterAction !== "all" && r.action !== filterAction) return false;
      return true;
    });
  }, [rows, filterTable, filterAction]);

  return (
    <Section title="Audit log (last 30 days)" icon={ScrollText}>
      <p className="text-sm text-muted-foreground">
        From view v_db_audit_log_recent. Long old/new values truncated to 240 chars.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={load} disabled={busy} variant="outline" size="sm">
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Table</span>
          <Select value={filterTable} onValueChange={setFilterTable}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tableOptions.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Action</span>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {actionOptions.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Badge variant="outline">{filtered.length} / {rows.length} rows</Badge>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No matching rows</p>
      ) : (
        <div className="overflow-x-auto border border-border rounded">
          <table className="w-full text-xs">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="px-2 py-1.5 font-medium whitespace-nowrap">When</th>
                <th className="px-2 py-1.5 font-medium">Table</th>
                <th className="px-2 py-1.5 font-medium">Record</th>
                <th className="px-2 py-1.5 font-medium">Action</th>
                <th className="px-2 py-1.5 font-medium">Field</th>
                <th className="px-2 py-1.5 font-medium">Old</th>
                <th className="px-2 py-1.5 font-medium">New</th>
                <th className="px-2 py-1.5 font-medium">By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="px-2 py-1.5 whitespace-nowrap text-muted-foreground font-mono">{formatTs(r.changed_at)}</td>
                  <td className="px-2 py-1.5 font-medium">{r.table_name}</td>
                  <td className="px-2 py-1.5 font-mono break-all">{r.record_id}</td>
                  <td className="px-2 py-1.5">
                    <Badge
                      variant={r.action === "DELETE" ? "destructive" : r.action === "INSERT" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {r.action}
                    </Badge>
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground">{r.field_name}</td>
                  <td className="px-2 py-1.5 max-w-[200px] break-words text-muted-foreground">{r.old_value}</td>
                  <td className="px-2 py-1.5 max-w-[200px] break-words">{r.new_value}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">{r.changed_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

export default function MaintenanceEditor() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Maintenance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Self-serve operational tools. All actions require admin role.
        </p>
      </header>

      <CardCachePurge />
      <CardEmbeddingRegen />
      <CardStorageOrphans />
      <CardAuditLog />
    </div>
  );
}
