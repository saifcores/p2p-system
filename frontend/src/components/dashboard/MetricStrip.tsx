import { AlertTriangle, Boxes, Copy, Server } from "lucide-react";
import { motion } from "framer-motion";
import { useMeshData } from "../../context/useMeshData";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";

export function MetricStrip() {
  const { metrics, loading } = useMeshData();

  const items = [
    {
      label: "Total nodes",
      value: metrics.totalNodes,
      hint: `${metrics.onlineNodes} online`,
      icon: Server,
      accent: "from-cyan-500/20 to-blue-600/10",
    },
    {
      label: "Total files",
      value: metrics.totalFiles,
      hint: "Indexed objects",
      icon: Boxes,
      accent: "from-violet-500/20 to-cyan-500/10",
    },
    {
      label: "Replication factor",
      value: metrics.replicationFactor,
      hint: "Avg replicas / object",
      icon: Copy,
      accent: "from-fuchsia-500/15 to-cyan-500/10",
    },
    {
      label: "Failed nodes",
      value: metrics.failedNodes,
      hint: metrics.failedNodes ? "Failover active" : "None",
      icon: AlertTriangle,
      accent: "from-amber-500/15 to-rose-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="h-9 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((m, idx) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Card className="relative overflow-hidden p-5">
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${m.accent} opacity-60`}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-400">{m.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  {m.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{m.hint}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-2.5 ring-1 ring-white/10">
                <m.icon className="h-5 w-5 text-cyan-200/90" />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
