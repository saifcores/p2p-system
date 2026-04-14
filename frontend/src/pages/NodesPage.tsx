import { AnimatePresence, motion } from "framer-motion";
import { Cpu, Power, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useMeshData } from "../context/useMeshData";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import type { MeshNode } from "../types";

function nodeBadge(n: MeshNode) {
  if (!n.enabled || n.status === "offline")
    return <Badge variant="muted">Offline</Badge>;
  if (n.status === "degraded") return <Badge variant="warning">Degraded</Badge>;
  return (
    <Badge variant="success" dot>
      Online
    </Badge>
  );
}

export function NodesPage() {
  const { nodes, files, toggleNode, addPeer, removePeer, loading } =
    useMeshData();
  const [selected, setSelected] = useState<MeshNode | null>(null);

  const filesOnNode = useMemo(() => {
    if (!selected) return [];
    return files.filter((f) => f.replicaNodes.includes(selected.id));
  }, [files, selected]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Fleet"
          subtitle="Operator controls · simulate failures safely"
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                leftIcon={<UserPlus className="h-4 w-4" />}
                onClick={addPeer}
              >
                Add peer
              </Button>
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="border-b border-white/[0.06] pb-3 pl-1">Node</th>
                <th className="border-b border-white/[0.06] pb-3">Port</th>
                <th className="border-b border-white/[0.06] pb-3">Status</th>
                <th className="border-b border-white/[0.06] pb-3">Storage</th>
                <th className="border-b border-white/[0.06] pb-3 pr-1 text-right">
                  Actions
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
                    Resolving peer registry…
                  </td>
                </tr>
              ) : (
                nodes.map((n) => (
                  <tr key={n.id} className="group">
                    <td className="border-b border-white/[0.04] py-4 pl-1">
                      <button
                        type="button"
                        onClick={() => setSelected(n)}
                        className="text-left"
                      >
                        <p className="font-medium text-slate-100">{n.label}</p>
                        <p className="text-xs text-slate-500">{n.region}</p>
                      </button>
                    </td>
                    <td className="border-b border-white/[0.04] py-4 font-mono text-sm text-slate-300">
                      :{n.port}
                    </td>
                    <td className="border-b border-white/[0.04] py-4">
                      {nodeBadge(n)}
                    </td>
                    <td className="border-b border-white/[0.04] py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400/80 to-violet-500/80"
                            style={{ width: `${n.storageUsedPct}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-slate-400">
                          {n.storageUsedPct}%
                        </span>
                      </div>
                    </td>
                    <td className="border-b border-white/[0.04] py-4 pr-1 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant={n.enabled ? "secondary" : "primary"}
                          onClick={() => toggleNode(n.id)}
                          aria-label={
                            n.enabled ? "Turn off node" : "Turn on node"
                          }
                        >
                          <Power className="h-4 w-4" />
                          {n.enabled ? "Off" : "On"}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => removePeer(n.id)}
                          aria-label="Remove peer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Health signals"
            subtitle="Synthetic probes · 500ms interval"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {["P95 latency", "Packet loss", "Disk pressure"].map((label, i) => (
              <div
                key={label}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {i === 0
                    ? `${18 + (nodes.length % 7)} ms`
                    : i === 1
                      ? `${(0.02).toFixed(2)}%`
                      : "Low"}
                </p>
                <p className="mt-2 text-[11px] text-slate-500">Within SLO</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Mobile view" subtitle="Simplified monitoring" />
          <div className="space-y-3">
            {nodes.slice(0, 4).map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/[0.05]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-100">
                    {n.label}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {n.enabled ? `${n.latencyMs} ms` : "offline"}
                  </p>
                </div>
                <Cpu className="h-4 w-4 text-slate-500" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {selected ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.aside
              initial={{ x: 360 }}
              animate={{ x: 0 }}
              exit={{ x: 360 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-full max-w-md border-l border-white/[0.08] bg-[#050a14]/95 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] p-6">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Node detail</p>
                  <p className="truncate text-lg font-semibold text-white">
                    {selected.label}
                  </p>
                  <p className="text-xs text-slate-500">{selected.region}</p>
                </div>
                <Button variant="secondary" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </div>
              <div className="scrollbar-thin max-h-[calc(100vh-220px)] space-y-6 overflow-y-auto p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Connected peers
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.peers.map((p) => (
                      <span
                        key={p}
                        className="rounded-xl bg-white/[0.04] px-3 py-1 font-mono text-xs text-slate-200 ring-1 ring-white/[0.06]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Objects stored
                  </p>
                  <div className="mt-3 space-y-2">
                    {filesOnNode.length ? (
                      filesOnNode.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                        >
                          <span className="truncate text-sm text-slate-200">
                            {f.name}
                          </span>
                          <Badge variant="info">Hot</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No replicas pinned to this node.
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-cyan-500/10 to-violet-600/5 p-4">
                  <p className="text-sm font-medium text-slate-100">
                    Failure simulation
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Toggles isolate the peer from the mesh without deleting
                    metadata.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      className="flex-1"
                      variant="secondary"
                      onClick={() => toggleNode(selected.id)}
                    >
                      <Power className="h-4 w-4" />
                      Toggle ON/OFF
                    </Button>
                  </div>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
