import { motion } from "framer-motion";
import { useMemo } from "react";
import { useMeshData } from "../../context/useMeshData";
import type { MeshNode } from "../../types";

function nodeColor(n: MeshNode) {
  if (n.status === "offline" || !n.enabled) return "#64748b";
  if (n.status === "degraded") return "#fbbf24";
  return "#22d3ee";
}

export function NetworkGraph() {
  const { nodes, edges, loading } = useMeshData();

  const layout = useMemo(() => {
    const cx = 50;
    const cy = 52;
    const r = 36;
    const pos: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(1, nodes.length) - Math.PI / 2;
      pos[n.id] = {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    });
    return { pos, cx, cy, r };
  }, [nodes]);

  if (loading) {
    return (
      <div className="glass-panel flex h-[320px] items-center justify-center sm:h-[380px]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
      </div>
    );
  }

  return (
    <div className="glass-panel relative overflow-hidden p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.08),transparent_50%)]" />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Live topology</p>
          <p className="text-xs text-slate-500">Gossip edges · last 30s</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400" /> Online
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Degraded
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-500" /> Offline
          </span>
        </div>
      </div>
      <svg
        viewBox="0 0 100 100"
        className="relative z-[1] h-[min(52vh,420px)] w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,211,238,0.15)" />
            <stop offset="100%" stopColor="rgba(139,92,246,0.35)" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {edges.map((e) => {
          const a = layout.pos[e.from];
          const b = layout.pos[e.to];
          if (!a || !b) return null;
          return (
            <line
              key={`${e.from}-${e.to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="url(#edgeGrad)"
              strokeWidth={0.35}
              className="animate-flow-line"
              opacity={0.85}
            />
          );
        })}
        {nodes.map((n) => {
          const p = layout.pos[n.id];
          if (!p) return null;
          const online = n.status === "online" && n.enabled;
          return (
            <g key={n.id} transform={`translate(${p.x}, ${p.y})`}>
              {online ? (
                <circle
                  r={4.2}
                  fill="none"
                  stroke="rgba(34,211,238,0.35)"
                  strokeWidth={0.8}
                  className="animate-pulse-ring"
                />
              ) : null}
              <motion.circle
                r={2.8}
                fill={nodeColor(n)}
                filter="url(#glow)"
                initial={false}
                animate={{ opacity: n.enabled ? 1 : 0.45 }}
              />
              <text
                y={5.2}
                textAnchor="middle"
                fill="rgba(148,163,184,0.95)"
                fontSize={2.8}
                className="font-sans"
              >
                {n.label.replace("edge-", "").replace("core-", "")}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
