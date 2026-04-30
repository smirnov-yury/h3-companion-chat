import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RotateCcw, Loader2, RefreshCw } from "lucide-react";

const INPUT =
  "rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

const TABLE_OPTIONS = [
  "", "rules", "unit_stats", "heroes", "spells", "artifacts", "abilities",
  "statistics", "war_machines", "events", "astrologers_proclaim", "fields",
  "towns", "town_buildings", "scenarios", "glyphs",
];

const ACTION_OPTIONS = ["", "INSERT", "UPDATE", "DELETE", "ROLLBACK"];

interface AuditRow {
  id: number;
  table_name: string | null;
  record_id: string | null;
  action: string | null;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string | null;
}

const PAGE_SIZE = 50;

function truncate(s: string | null, max = 60): string {
  if (!s) return "—";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "medium" });
}

function actionColor(action: string | null): string {
  if (action === "INSERT") return "text-green-500";
  if (action === "DELETE") return "text-destructive";
  if (action === "ROLLBACK") return "text-yellow-500";
  return "text-muted-foreground";
}

export default function AuditLog() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterTable, setFilterTable] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [rollingBack, setRollingBack] = useState<number | null>(null);

  const fetchRows = async (p: number) => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("db_audit_log")
      .select(
        "id, table_name, record_id, action, field_name, old_value, new_value, changed_by, changed_at",
        { count: "exact" }
      )
      .order("changed_at", { ascending: false })
      .range(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE - 1);

    if (filterTable) query = query.eq("table_name", filterTable);
    if (filterAction) query = query.eq("action", filterAction);
    if (filterDateFrom) query = query.gte("changed_at", filterDateFrom);
    if (filterDateTo) query = query.lte("changed_at", filterDateTo + "T23:59:59");

    const { data, count, error: e } = await query;
    if (e) {
      setError(e.message);
    } else {
      setRows((data as AuditRow[]) ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    setPage(0);
    fetchRows(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTable, filterAction, filterDateFrom, filterDateTo]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchRows(p);
  };

  const handleRollback = async (row: AuditRow) => {
    if (!row.table_name || !row.record_id || !row.field_name) return;
    setRollingBack(row.id);

    let oldVal: unknown = row.old_value;
    try {
      oldVal = JSON.parse(row.old_value ?? "null");
    } catch {
      /* keep as string */
    }

    const { error: e } = await supabase
      .from(row.table_name as never)
      .update({ [row.field_name]: oldVal } as never)
      .eq("id", row.record_id);

    if (e) {
      toast.error(`Rollback failed: ${e.message}`);
    } else {
      toast.success("Field rolled back. Reselect the record in the editor to see the updated value.");
      fetchRows(page);
    }
    setRollingBack(null);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Audit Log ({total} entries)</h2>
        <button
          type="button"
          onClick={() => fetchRows(page)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:bg-accent"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Table</label>
          <select value={filterTable} onChange={(e) => setFilterTable(e.target.value)} className={INPUT}>
            {TABLE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t || "— all —"}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Action</label>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className={INPUT}>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{a || "— all —"}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">From</label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className={INPUT}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">To</label>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className={INPUT}
          />
        </div>
        {(filterTable || filterAction || filterDateFrom || filterDateTo) && (
          <button
            type="button"
            onClick={() => {
              setFilterTable("");
              setFilterAction("");
              setFilterDateFrom("");
              setFilterDateTo("");
            }}
            className="px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent border border-border"
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Time</th>
              <th className="text-left px-3 py-2 font-medium">Action</th>
              <th className="text-left px-3 py-2 font-medium">Table</th>
              <th className="text-left px-3 py-2 font-medium">Record ID</th>
              <th className="text-left px-3 py-2 font-medium">Field</th>
              <th className="text-left px-3 py-2 font-medium">Old value</th>
              <th className="text-left px-3 py-2 font-medium">New value</th>
              <th className="text-right px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                  No entries
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-border align-top">
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                    {formatDate(row.changed_at)}
                  </td>
                  <td className={`px-3 py-2 font-medium ${actionColor(row.action)}`}>
                    {row.action ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-foreground">{row.table_name ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground font-mono text-xs">
                    {row.record_id ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{row.field_name ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground font-mono text-xs max-w-xs break-all">
                    {truncate(row.old_value)}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground font-mono text-xs max-w-xs break-all">
                    {truncate(row.new_value)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.action === "UPDATE" && row.old_value !== null && (
                      <button
                        type="button"
                        onClick={() => handleRollback(row)}
                        disabled={rollingBack === row.id}
                        title="Rollback this field to old value"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 text-xs"
                      >
                        {rollingBack === row.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        Rollback
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages} ({total} total)
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:bg-accent disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:bg-accent disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
