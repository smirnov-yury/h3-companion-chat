import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";

type CronJob = {
  jobid: number;
  jobname: string;
  title: string;
  purpose: string;
  owner: string;
  cron_expr: string;
  schedule_human: string;
  active: boolean;
  is_critical: boolean;
  last_start: string | null;
  last_end: string | null;
  last_duration_sec: number | null;
  last_run_status: string | null;
  last_message: string | null;
  runs_7d: number;
  ok_7d: number;
  failed_7d: number;
  avg_sec_7d: number | null;
  health: string;
};

const HEALTH_ORDER: Record<string, number> = {
  failed: 0, stuck: 1, missed: 2, running: 3, never_run: 4, disabled: 5, ok: 6,
};

const HEALTH_TOOLTIPS: Record<string, string> = {
  ok: "Last run succeeded and is on schedule.",
  failed: "Last run ended in failure.",
  running: "Currently running.",
  stuck: "Running longer than its expected duration.",
  missed: "Has not run within its expected interval — effectively stale.",
  disabled: "Job is not active.",
  never_run: "No recorded run yet.",
};

function healthVariant(h: string): { className: string } {
  if (h === "ok") return { className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" };
  if (h === "failed" || h === "stuck" || h === "missed")
    return { className: "bg-destructive/15 text-destructive border-destructive/40" };
  if (h === "running") return { className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30" };
  return { className: "bg-muted text-muted-foreground border-border" };
}

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "just now";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatDuration(sec: number | null): string {
  if (sec === null || sec === undefined) return "";
  if (sec < 1) return `${Math.round(sec * 1000)}ms`;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s}s`;
}

export default function CronJobsMonitor() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcErr } = await (supabase.rpc as any)("admin_cron_status");
      if (rpcErr) {
        const msg = rpcErr.message || String(rpcErr);
        if (/admin/i.test(msg) || /permission/i.test(msg) || rpcErr.code === "42501") {
          throw new Error("Admin access required");
        }
        throw new Error(msg);
      }
      setJobs(Array.isArray(data) ? (data as CronJob[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sorted = useMemo(() => {
    return [...jobs].sort((a, b) => {
      if (a.is_critical !== b.is_critical) return a.is_critical ? -1 : 1;
      const ha = HEALTH_ORDER[a.health] ?? 99;
      const hb = HEALTH_ORDER[b.health] ?? 99;
      if (ha !== hb) return ha - hb;
      return a.jobid - b.jobid;
    });
  }, [jobs]);

  const toggle = (id: number) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cron / Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Read-only monitor of scheduled background jobs and their recent health.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
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

      {loading ? (
        <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : !error && sorted.length === 0 ? (
        <div className="px-4 py-8 text-sm text-muted-foreground rounded-lg border border-border">
          No jobs found.
        </div>
      ) : !error && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-medium w-6"></th>
                  <th className="text-left px-3 py-2 font-medium">Job</th>
                  <th className="text-left px-3 py-2 font-medium">Health</th>
                  <th className="text-left px-3 py-2 font-medium">Schedule</th>
                  <th className="text-left px-3 py-2 font-medium">Last run</th>
                  <th className="text-left px-3 py-2 font-medium">7-day</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((j) => {
                  const showError =
                    j.last_run_status === "failed" ||
                    j.health === "failed" ||
                    j.health === "stuck" ||
                    j.health === "missed";
                  const isOpen = expanded[j.jobid];
                  const v = healthVariant(j.health);
                  return (
                    <Fragment key={j.jobid}>
                      <tr className="border-t border-border align-top">
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => toggle(j.jobid)}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={isOpen ? "Collapse" : "Expand"}
                          >
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{j.title || j.jobname}</span>
                            {j.is_critical && (
                              <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 gap-1">
                                <AlertTriangle className="w-3 h-3" /> critical
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 font-mono">{j.jobname}</div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className={v.className} title={HEALTH_TOOLTIPS[j.health] || ""}>
                            {j.health}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <div>{j.schedule_human}</div>
                          <div className="text-xs text-muted-foreground font-mono">{j.cron_expr}</div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div>{relativeTime(j.last_start)}</div>
                          {j.last_duration_sec !== null && j.last_start && (
                            <div className="text-xs text-muted-foreground">{formatDuration(j.last_duration_sec)}</div>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={j.failed_7d > 0 ? "text-destructive font-medium" : ""}>
                            {j.ok_7d}/{j.runs_7d}
                          </span>
                          {j.avg_sec_7d !== null && (
                            <div className="text-xs text-muted-foreground">avg {formatDuration(j.avg_sec_7d)}</div>
                          )}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-t border-border bg-muted/20">
                          <td></td>
                          <td colSpan={5} className="px-3 py-3 space-y-2">
                            {j.purpose && (
                              <div className="text-sm text-muted-foreground">{j.purpose}</div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Owner: <span className="font-mono">{j.owner || "—"}</span>
                              {" · "}Active: {j.active ? "yes" : "no"}
                              {" · "}Failed 7d: {j.failed_7d}
                            </div>
                            {showError && j.last_message && (
                              <pre className="text-xs bg-background border border-border rounded p-2 overflow-x-auto whitespace-pre-wrap text-destructive">
                                {j.last_message}
                              </pre>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {sorted.map((j) => {
              const isOpen = expanded[j.jobid];
              const v = healthVariant(j.health);
              const showError =
                j.last_run_status === "failed" ||
                j.health === "failed" ||
                j.health === "stuck" ||
                j.health === "missed";
              return (
                <div key={j.jobid} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-medium truncate">{j.title || j.jobname}</span>
                      {j.is_critical && (
                        <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 gap-1">
                          <AlertTriangle className="w-3 h-3" /> critical
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className={v.className} title={HEALTH_TOOLTIPS[j.health] || ""}>
                      {j.health}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{j.jobname}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Schedule</div>
                      <div>{j.schedule_human}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Last run</div>
                      <div>
                        {relativeTime(j.last_start)}
                        {j.last_duration_sec !== null && j.last_start && ` · ${formatDuration(j.last_duration_sec)}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">7-day</div>
                      <div className={j.failed_7d > 0 ? "text-destructive font-medium" : ""}>
                        {j.ok_7d}/{j.runs_7d}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Active</div>
                      <div>{j.active ? "yes" : "no"}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(j.jobid)}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    Details
                  </button>
                  {isOpen && (
                    <div className="space-y-2 pt-1">
                      {j.purpose && <div className="text-xs text-muted-foreground">{j.purpose}</div>}
                      <div className="text-xs text-muted-foreground">
                        Owner: <span className="font-mono">{j.owner || "—"}</span>
                        {" · "}Failed 7d: {j.failed_7d}
                      </div>
                      {showError && j.last_message && (
                        <pre className="text-xs bg-background border border-border rounded p-2 overflow-x-auto whitespace-pre-wrap text-destructive">
                          {j.last_message}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
