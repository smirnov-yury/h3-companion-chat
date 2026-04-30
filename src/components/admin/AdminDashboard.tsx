import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImageOff, Image as ImageIcon, CheckCircle, AlertTriangle } from "lucide-react";

interface TableCount {
  table: string;
  label: string;
  count: number;
}

interface ImageStat {
  table: string;
  label: string;
  missing: number;
  uploaded: number;
  verified: number;
}

interface AuditEntry {
  id: number;
  table_name: string;
  record_id: string;
  field_name: string | null;
  action: string;
  changed_at: string;
}

const COUNT_TABLES: { table: string; label: string }[] = [
  { table: "rules", label: "Rules" },
  { table: "unit_stats", label: "Units" },
  { table: "heroes", label: "Heroes" },
  { table: "spells", label: "Spells" },
  { table: "artifacts", label: "Artifacts" },
  { table: "abilities", label: "Abilities" },
  { table: "fields", label: "Map Elements" },
  { table: "events", label: "Events" },
  { table: "astrologers_proclaim", label: "Astrologers" },
  { table: "towns", label: "Towns" },
  { table: "town_buildings", label: "Buildings" },
  { table: "statistics", label: "Attributes" },
  { table: "war_machines", label: "War Machines" },
  { table: "glyphs", label: "Glyphs" },
  { table: "scenarios", label: "Scenarios" },
  { table: "scenario_books", label: "Scenario Books" },
];

const IMAGE_TABLES: { table: string; label: string }[] = [
  { table: "unit_stats", label: "Units" },
  { table: "heroes", label: "Heroes" },
  { table: "spells", label: "Spells" },
  { table: "artifacts", label: "Artifacts" },
  { table: "abilities", label: "Abilities" },
  { table: "fields", label: "Map Elements" },
  { table: "events", label: "Events" },
  { table: "astrologers_proclaim", label: "Astrologers" },
  { table: "towns", label: "Towns" },
  { table: "statistics", label: "Attributes" },
  { table: "war_machines", label: "War Machines" },
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState<TableCount[]>([]);
  const [imageStats, setImageStats] = useState<ImageStat[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const countResults = await Promise.all(
        COUNT_TABLES.map(async ({ table, label }) => {
          const { count } = await supabase
            .from(table as any)
            .select("*", { count: "exact", head: true });
          return { table, label, count: count ?? 0 };
        })
      );
      setCounts(countResults);

      const imageResults = await Promise.all(
        IMAGE_TABLES.map(async ({ table, label }) => {
          const { data } = await supabase
            .from(table as any)
            .select("image_status");
          const rows = ((data ?? []) as unknown) as { image_status: string }[];
          return {
            table,
            label,
            missing: rows.filter((r) => r.image_status === "missing").length,
            uploaded: rows.filter((r) => r.image_status === "uploaded").length,
            verified: rows.filter((r) => r.image_status === "verified").length,
          };
        })
      );
      setImageStats(imageResults);

      const { data: audit } = await supabase
        .from("db_audit_log")
        .select("id, table_name, record_id, field_name, action, changed_at")
        .order("changed_at", { ascending: false })
        .limit(10);
      setAuditLog((audit as AuditEntry[]) ?? []);

      setLoading(false);
    };

    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const totalMissing = imageStats.reduce((sum, s) => sum + s.missing, 0);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Dashboard</h2>

      {totalMissing > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive/40 bg-destructive/10 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4" />
          {totalMissing} images missing across all tables
        </div>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Row Counts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {counts.map(({ table, label, count }) => (
            <div
              key={table}
              className="rounded-lg border border-border bg-card p-3 flex flex-col"
            >
              <span className="text-2xl font-semibold text-foreground">{count}</span>
              <span className="text-xs text-muted-foreground mt-1">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Image Status
        </h3>
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Table</th>
                <th className="text-right px-3 py-2 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <ImageOff className="w-3.5 h-3.5" /> Missing
                  </span>
                </th>
                <th className="text-right px-3 py-2 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" /> Uploaded
                  </span>
                </th>
                <th className="text-right px-3 py-2 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {imageStats.map(({ table, label, missing, uploaded, verified }) => (
                <tr key={table} className="border-t border-border">
                  <td className="px-3 py-2 text-foreground">{label}</td>
                  <td className="px-3 py-2 text-right">
                    {missing > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-destructive/15 text-destructive text-xs font-medium">
                        {missing}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{uploaded}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{verified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Recent Changes
        </h3>
        {auditLog.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit entries yet.</p>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">When</th>
                  <th className="text-left px-3 py-2 font-medium">Table</th>
                  <th className="text-left px-3 py-2 font-medium">Record</th>
                  <th className="text-left px-3 py-2 font-medium">Field</th>
                  <th className="text-left px-3 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((entry) => (
                  <tr key={entry.id} className="border-t border-border">
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                      {new Date(entry.changed_at).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2 text-foreground">{entry.table_name}</td>
                    <td className="px-3 py-2 text-muted-foreground font-mono text-xs">
                      {entry.record_id}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {entry.field_name ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-foreground text-xs font-medium">
                        {entry.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
