import { useMemo } from "react";
import { useMeshData } from "../context/useMeshData";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import type { LogFilter } from "../types";

const filters: { id: LogFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "replication", label: "Replication" },
  { id: "errors", label: "Errors" },
  { id: "requests", label: "Requests" },
];

export function LogsPage() {
  const { logs, logFilter, setLogFilter, loading } = useMeshData();

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (logFilter === "all") return true;
      if (logFilter === "replication") return l.channel === "replication";
      if (logFilter === "errors")
        return l.level === "error" || l.level === "warn";
      if (logFilter === "requests") return l.channel === "request";
      return true;
    });
  }, [logs, logFilter]);

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader
          title="Live stream"
          subtitle="Structured logs · 200 line ring buffer"
          action={
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <Button
                  key={f.id}
                  size="sm"
                  variant={logFilter === f.id ? "primary" : "secondary"}
                  onClick={() => setLogFilter(f.id)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          }
        />
        <div className="rounded-2xl border border-white/[0.06] bg-black/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              streaming
            </div>
            <span className="font-mono text-[11px] text-slate-600">UTC</span>
          </div>
          <div className="scrollbar-thin max-h-[min(560px,52vh)] overflow-y-auto p-4 font-mono text-[12px] leading-relaxed">
            {loading ? (
              <p className="text-slate-500">Connecting to log tail…</p>
            ) : (
              filtered.map((l) => (
                <div
                  key={l.id}
                  className="flex gap-3 border-b border-white/[0.03] py-2 last:border-0"
                >
                  <span className="shrink-0 text-slate-600">
                    {new Date(l.at).toLocaleTimeString()}
                  </span>
                  <span
                    className={`shrink-0 ${
                      l.level === "error"
                        ? "text-rose-300"
                        : l.level === "warn"
                          ? "text-amber-200"
                          : l.level === "debug"
                            ? "text-slate-500"
                            : "text-emerald-200/90"
                    }`}
                  >
                    [{l.level.toUpperCase()}]
                  </span>
                  <span className="shrink-0 text-cyan-200/70">
                    [{l.channel}]
                  </span>
                  <span className="min-w-0 text-slate-200">{l.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Timeline" subtitle="Event density (mock)" />
          <div className="space-y-4">
            {[72, 48, 88, 40].map((h, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex h-28 w-8 items-end rounded-lg bg-white/[0.04] p-1 ring-1 ring-white/[0.06]">
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-cyan-500/40 to-violet-500/30"
                    style={{ height: `${h}%` }}
                  />
                </div>
                <div className="pb-1 text-[11px] text-slate-500">
                  T-{3 - i}m
                  <div className="text-xs text-slate-300">
                    {(h * 1.2).toFixed(0)} evt/s
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Noise budget" subtitle="Sampling and retention" />
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Trace sampling</span>
              <Badge variant="info">12%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Error capture</span>
              <Badge variant="success">100%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Hot retention</span>
              <span className="font-mono text-xs text-slate-400">6h</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
