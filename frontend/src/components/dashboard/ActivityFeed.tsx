import { motion } from "framer-motion";
import { AlertCircle, ArrowLeftRight, HeartPulse } from "lucide-react";
import { useMeshData } from "../../context/useMeshData";
import { Card, CardHeader } from "../ui/Card";
import type { ActivityType } from "../../types";

function iconFor(t: ActivityType) {
  if (t === "error") return AlertCircle;
  if (t === "health") return HeartPulse;
  return ArrowLeftRight;
}

function colorFor(t: ActivityType) {
  if (t === "error") return "text-rose-300";
  if (t === "health") return "text-emerald-300";
  if (t === "replication") return "text-cyan-300";
  return "text-violet-300";
}

export function ActivityFeed() {
  const { activity, loading } = useMeshData();

  return (
    <Card className="max-h-[520px] overflow-hidden">
      <CardHeader title="Activity" subtitle="Replication, transfers, health" />
      <div className="scrollbar-thin max-h-[440px] space-y-3 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-sm text-slate-500">Hydrating event stream…</p>
        ) : (
          activity.map((a, idx) => {
            const Icon = iconFor(a.type);
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="flex gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3"
              >
                <div className={`mt-0.5 ${colorFor(a.type)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200">{a.message}</p>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">
                    {new Date(a.at).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </Card>
  );
}
