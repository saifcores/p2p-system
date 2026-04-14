import { RefreshCw } from "lucide-react";
import { useMeshData } from "../context/useMeshData";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import type { ReplicationEntry } from "../types";

function repBadge(s: ReplicationEntry["status"]) {
  if (s === "success") return <Badge variant="success">Completed</Badge>;
  if (s === "pending") return <Badge variant="info">In flight</Badge>;
  return <Badge variant="danger">Failed</Badge>;
}

export function ReplicationPage() {
  const { replication, nodes, retryReplication, loading } = useMeshData();

  const label = (id: string) => nodes.find((n) => n.id === id)?.label ?? id;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader
          title="Replication map"
          subtitle="Directed transfers · RDMA-capable links (simulated)"
        />
        <div className="relative h-[280px] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#020617]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(34,211,238,0.12),transparent_55%)]" />
          <svg viewBox="0 0 900 240" className="h-full w-full">
            <defs>
              <marker
                id="arrow"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 z" fill="rgba(148,163,184,0.55)" />
              </marker>
              <linearGradient id="pathGrad" x1="0" x2="1">
                <stop offset="0%" stopColor="rgba(34,211,238,0.25)" />
                <stop offset="100%" stopColor="rgba(139,92,246,0.45)" />
              </linearGradient>
            </defs>
            {replication.slice(0, 5).map((r, i) => {
              const y = 40 + i * 44;
              const x1 = 80;
              const x2 = 780;
              return (
                <g key={r.id}>
                  <path
                    d={`M ${x1} ${y} C ${(x1 + x2) / 2} ${y - 30}, ${(x1 + x2) / 2} ${y + 30}, ${x2} ${y}`}
                    fill="none"
                    stroke="url(#pathGrad)"
                    strokeWidth={2}
                    markerEnd="url(#arrow)"
                    className={
                      r.status === "pending" ? "animate-flow-line" : ""
                    }
                  />
                  <text
                    x={x1}
                    y={y - 10}
                    fill="rgba(148,163,184,0.95)"
                    fontSize="12"
                    fontFamily="Inter, system-ui"
                  >
                    {label(r.sourceId)}
                  </text>
                  <text
                    x={x2 - 140}
                    y={y - 10}
                    fill="rgba(148,163,184,0.95)"
                    fontSize="12"
                    fontFamily="Inter, system-ui"
                  >
                    {label(r.targetId)}
                  </text>
                  <text
                    x={x1}
                    y={y + 26}
                    fill="rgba(94,234,212,0.85)"
                    fontSize="11"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo"
                  >
                    {r.fileName}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-[11px] text-slate-400 backdrop-blur-md">
            Live fan-out · backoff on tail peers
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Replication log"
          subtitle="Source → target with retry"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="border-b border-white/[0.06] pb-3 pl-1">Time</th>
                <th className="border-b border-white/[0.06] pb-3">Route</th>
                <th className="border-b border-white/[0.06] pb-3">Object</th>
                <th className="border-b border-white/[0.06] pb-3">Status</th>
                <th className="border-b border-white/[0.06] pb-3 pr-1 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-sm text-slate-500"
                  >
                    Loading replication ledger…
                  </td>
                </tr>
              ) : (
                replication.map((r) => (
                  <tr key={r.id}>
                    <td className="border-b border-white/[0.04] py-4 pl-1 font-mono text-xs text-slate-400">
                      {new Date(r.at).toLocaleTimeString()}
                    </td>
                    <td className="border-b border-white/[0.04] py-4">
                      <span className="text-sm text-slate-200">
                        {label(r.sourceId)}
                      </span>
                      <span className="mx-2 text-slate-600">→</span>
                      <span className="text-sm text-slate-200">
                        {label(r.targetId)}
                      </span>
                    </td>
                    <td className="border-b border-white/[0.04] py-4 font-mono text-xs text-cyan-200/90">
                      {r.fileName}
                    </td>
                    <td className="border-b border-white/[0.04] py-4">
                      {repBadge(r.status)}
                    </td>
                    <td className="border-b border-white/[0.04] py-4 pr-1 text-right">
                      {r.status === "failed" ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => retryReplication(r.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Retry
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
