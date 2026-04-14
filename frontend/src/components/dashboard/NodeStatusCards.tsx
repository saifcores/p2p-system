import { motion } from "framer-motion";
import { useMeshData } from "../../context/useMeshData";
import { Badge } from "../ui/Badge";
import { Card, CardHeader } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";
import type { MeshNode } from "../../types";

function statusBadge(n: MeshNode) {
  if (!n.enabled || n.status === "offline")
    return <Badge variant="muted">Offline</Badge>;
  if (n.status === "degraded") return <Badge variant="warning">Degraded</Badge>;
  return (
    <Badge variant="success" dot>
      Online
    </Badge>
  );
}

export function NodeStatusCards() {
  const { nodes, loading } = useMeshData();

  if (loading) {
    return (
      <Card>
        <CardHeader title="Node pulse" subtitle="Latency and capacity" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Node pulse"
        subtitle="Latency, storage, and peer links"
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {nodes.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-100">{n.label}</p>
                <p className="text-xs text-slate-500">
                  {n.region} · :{n.port}
                </p>
              </div>
              {statusBadge(n)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-500">Latency</p>
                <p className="mt-0.5 font-mono text-slate-200">
                  {n.enabled && n.status !== "offline"
                    ? `${n.latencyMs} ms`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Storage</p>
                <p className="mt-0.5 font-mono text-slate-200">
                  {n.storageUsedPct}%
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {n.peers.slice(0, 3).map((p) => (
                <span
                  key={p}
                  className="rounded-lg bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-slate-400 ring-1 ring-white/[0.06]"
                >
                  {p}
                </span>
              ))}
              {n.peers.length > 3 ? (
                <span className="text-[10px] text-slate-500">
                  +{n.peers.length - 3}
                </span>
              ) : null}
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
