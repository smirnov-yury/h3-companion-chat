import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Wrench, Zap, Mic, MessageSquare } from "lucide-react";

type LogRow = {
  id: number;
  created_at: string;
  ip_hash: string | null;
  lang: string | null;
  question_text: string | null;
  used_tool: boolean;
  model: string;
  input_tokens: number;
  output_tokens: number;
  response_status: number | null;
  latency_ms: number | null;
  error_message: string | null;
  cost_usd: number | null;
  request_type: "chat" | "transcribe" | null;
  audio_duration_sec: number | null;
};

const MODELS = ["gpt-4o", "gpt-4o-mini"] as const;
type ModelOption = (typeof MODELS)[number];

function formatCost(usd: number | null | undefined): string {
  if (usd === null || usd === undefined) return "—";
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(5)}`;
  return `$${usd.toFixed(4)}`;
}

function formatLatency(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function sumRange(rows: LogRow[], days: number, picker: (r: LogRow) => number): number {
  const cutoff = Date.now() - days * 24 * 3600 * 1000;
  return rows
    .filter((r) => new Date(r.created_at).getTime() >= cutoff)
    .reduce((acc, r) => {
      const v = picker(r);
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);
}

function countRange(rows: LogRow[], days: number): number {
  const cutoff = Date.now() - days * 24 * 3600 * 1000;
  return rows.filter((r) => new Date(r.created_at).getTime() >= cutoff).length;
}

export default function AiMetricsEditor() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [model, setModel] = useState<ModelOption>("gpt-4o");
  const [savingModel, setSavingModel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<string>("");
  const [savingRateLimit, setSavingRateLimit] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: settingRow, error: settingErr } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "ai_model")
        .maybeSingle();
      if (settingErr) throw settingErr;
      const raw = settingRow?.value;
      const m = (typeof raw === "string" ? raw : "gpt-4o") as ModelOption;
      setModel((MODELS as readonly string[]).includes(m) ? m : "gpt-4o");

      const { data: rateLimitRow } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "ai_rate_limit_per_hour")
        .maybeSingle();
      if (rateLimitRow && rateLimitRow.value !== null && rateLimitRow.value !== undefined) {
        const v = rateLimitRow.value;
        setRateLimit(typeof v === "string" ? v : String(v));
      }

      const { data: logsData, error: logsErr } = await supabase
        .from("v_ai_chat_logs_with_cost" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (logsErr) throw logsErr;
      setRows(((logsData as unknown) as LogRow[]) ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleModelChange = async (value: string) => {
    if (!(MODELS as readonly string[]).includes(value)) return;
    setSavingModel(true);
    setError(null);
    try {
      const { error: upErr } = await supabase
        .from("app_settings")
        .update({ value: value })
        .eq("key", "ai_model");
      if (upErr) throw upErr;
      setModel(value as ModelOption);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingModel(false);
    }
  };

  const handleSaveRateLimit = async () => {
    const parsed = parseInt(rateLimit, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 10000) {
      setRateLimitError("Введите число от 1 до 10000");
      return;
    }
    setSavingRateLimit(true);
    setRateLimitError(null);
    try {
      const { error: upErr } = await supabase
        .from("app_settings")
        .upsert({ key: "ai_rate_limit_per_hour", value: String(parsed) }, { onConflict: "key" });
      if (upErr) {
        setRateLimitError(upErr.message);
      } else {
        setRateLimit(String(parsed));
      }
    } catch (e) {
      setRateLimitError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingRateLimit(false);
    }
  };

  const stats = useMemo(() => {
    const ranges = [
      { label: "Last 24h", days: 1 },
      { label: "Last 7d", days: 7 },
      { label: "Last 30d", days: 30 },
    ];
    return ranges.map((r) => ({
      label: r.label,
      requests: countRange(rows, r.days),
      inputTokens: sumRange(rows, r.days, (x) => x.input_tokens),
      outputTokens: sumRange(rows, r.days, (x) => x.output_tokens),
      cost: sumRange(rows, r.days, (x) => Number(x.cost_usd ?? 0)),
    }));
  }, [rows]);

  const toolShare = useMemo(() => {
    if (rows.length === 0) return 0;
    const usedTool = rows.filter((r) => r.used_tool).length;
    return Math.round((usedTool / rows.length) * 100);
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">AI Metrics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Per-request usage logs for the AI Game Master chat. 90-day retention.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAll}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg border border-destructive/40 bg-destructive/10 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="text-sm font-medium">Active model</div>
        <div className="flex items-center gap-3">
          <Select value={model} onValueChange={handleModelChange} disabled={savingModel}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {savingModel && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">
            Applies on the next request. All users share this setting.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border p-4 space-y-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Requests</dt>
              <dd className="text-right font-mono">{s.requests}</dd>
              <dt className="text-muted-foreground">Input tokens</dt>
              <dd className="text-right font-mono">{s.inputTokens.toLocaleString()}</dd>
              <dt className="text-muted-foreground">Output tokens</dt>
              <dd className="text-right font-mono">{s.outputTokens.toLocaleString()}</dd>
              <dt className="text-muted-foreground">Cost</dt>
              <dd className="text-right font-mono">{formatCost(s.cost)}</dd>
            </dl>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium">Last 200 requests</h2>
          <span className="text-xs text-muted-foreground">Tool path share: {toolShare}%</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-8 text-sm text-muted-foreground">No requests yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Time</th>
                  <th className="text-left px-3 py-2 font-medium">Type</th>
                  <th className="text-left px-3 py-2 font-medium">Lang</th>
                  <th className="text-left px-3 py-2 font-medium">Tool</th>
                  <th className="text-left px-3 py-2 font-medium">Model</th>
                  <th className="text-right px-3 py-2 font-medium">In</th>
                  <th className="text-right px-3 py-2 font-medium">Out</th>
                  <th className="text-right px-3 py-2 font-medium">Cost</th>
                  <th className="text-right px-3 py-2 font-medium">Latency</th>
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                  <th className="text-left px-3 py-2 font-medium">Question</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      {r.request_type === "transcribe" ? (
                        <Badge variant="secondary" className="gap-1" title={r.audio_duration_sec ? `${r.audio_duration_sec.toFixed(1)}s` : undefined}>
                          <Mic className="w-3 h-3" /> voice
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <MessageSquare className="w-3 h-3" /> chat
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">{r.lang ?? "—"}</td>
                    <td className="px-3 py-2">
                      {r.request_type === "transcribe" ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : r.used_tool ? (
                        <Badge variant="secondary" className="gap-1">
                          <Wrench className="w-3 h-3" /> tool
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Zap className="w-3 h-3" /> fast
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{r.model}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.input_tokens}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.output_tokens}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatCost(r.cost_usd)}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatLatency(r.latency_ms)}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono">{r.response_status ?? "—"}</span>
                      {r.error_message ? (
                        <span className="ml-1 text-destructive" title={r.error_message}>!</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 max-w-md">
                      <div className="truncate" title={r.question_text ?? ""}>
                        {r.question_text ?? "—"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
