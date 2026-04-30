import { AnimatePresence, motion } from "framer-motion";
import { Cpu, Plug, Power, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useMeshData } from "../context/useMeshData";
import { MESH_POLL_INTERVAL_MS } from "../config";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import type { MeshNode } from "../types";

function nodeBadge(n: MeshNode) {
  if (!n.enabled || n.status === "offline")
    return <Badge variant="muted">Hors ligne</Badge>;
  if (n.status === "degraded") return <Badge variant="warning">Dégradé</Badge>;
  return (
    <Badge variant="success" dot>
      En ligne
    </Badge>
  );
}

export function NodesPage() {
  const {
    nodes,
    files,
    toggleNode,
    addPeer,
    registerPeerUrl,
    removePeer,
    loading,
  } = useMeshData();
  const [selected, setSelected] = useState<MeshNode | null>(null);
  const [peerUrlInput, setPeerUrlInput] = useState("http://localhost:5013");
  const [peerSubmitBusy, setPeerSubmitBusy] = useState(false);

  function confirmRemovePeer(id: string) {
    const target = nodes.find((n) => n.id === id);
    if (
      !target ||
      typeof window === "undefined" ||
      !window.confirm(
        `Retirer « ${target.label} » du maillage et désinscrire cette URL ` +
          `(${target.baseUrl}) sur les autres pairs ?`,
      )
    )
      return;
    removePeer(id);
    setSelected((prev) => (prev?.id === id ? null : prev));
  }

  const filesOnNode = useMemo(() => {
    if (!selected) return [];
    return files.filter((f) => f.replicaNodes.includes(selected.id));
  }, [files, selected]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Ajouter un nœud au maillage"
          subtitle="POST /internal/peers · enregistré sur les JVM existantes puis sens inverse si le nouveau pair est déjà UP"
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                leftIcon={<UserPlus className="h-4 w-4" />}
                onClick={addPeer}
                title="Saisie rapide via fenêtre système"
              >
                Invite rapide
              </Button>
            </div>
          }
        />
        <form
          className="flex flex-col gap-3 border-t border-white/[0.05] pt-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setPeerSubmitBusy(true);
            void (async () => {
              try {
                await registerPeerUrl(peerUrlInput);
              } finally {
                setPeerSubmitBusy(false);
              }
            })();
          }}
        >
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              URL de base HTTP(S)
            </span>
            <input
              type="url"
              name="peerUrl"
              value={peerUrlInput}
              onChange={(e) => setPeerUrlInput(e.target.value)}
              placeholder="http://hostname:5013"
              autoComplete="url"
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
              disabled={peerSubmitBusy}
            />
          </label>
          <Button
            type="submit"
            variant="primary"
            disabled={peerSubmitBusy || peerUrlInput.trim() === ""}
            leftIcon={<Plug className="h-4 w-4" />}
          >
            Enregistrer le pair
          </Button>
        </form>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          L’interface doit pouvoir joindre cette URL (CORS, même origine ou
          proxy). Les nœuds listés dans <code>VITE_P2P_NODE_URLS</code> peuvent
          être retirés du tableau tout en gardant leur JVM sous tension.
        </p>
      </Card>

      <Card>
        <CardHeader
          title="Parc"
          subtitle="Pilotage opérateur · simulation de pannes en sécurité"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="border-b border-white/[0.06] pb-3 pl-1">Nœud</th>
                <th className="border-b border-white/[0.06] pb-3">Port</th>
                <th className="border-b border-white/[0.06] pb-3">État</th>
                <th className="border-b border-white/[0.06] pb-3">Stockage</th>
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
                    Résolution du registre des pairs…
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
                            n.enabled ? "Éteindre le nœud" : "Allumer le nœud"
                          }
                        >
                          <Power className="h-4 w-4" />
                          {n.enabled ? "Arrêt" : "Marche"}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => confirmRemovePeer(n.id)}
                          aria-label="Retirer le pair du maillage"
                          title="Supprimer cette URL du contrôle UI et désinscrire les autres nœuds"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Retirer</span>
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
            title="Signaux de santé"
            subtitle={`Sondes synthétiques · scrutation environ toutes les ${MESH_POLL_INTERVAL_MS / 1000}s`}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {["Latence P95", "Perte de paquets", "Pression disque"].map(
              (label, i) => (
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
                        : "Faible"}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500">Dans le SLO</p>
                </div>
              ),
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Vue mobile" subtitle="Supervision simplifiée" />
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
                    {n.enabled ? `${n.latencyMs} ms` : "hors ligne"}
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
                  <p className="text-xs text-slate-500">Détail du nœud</p>
                  <p className="truncate text-lg font-semibold text-white">
                    {selected.label}
                  </p>
                  <p className="text-xs text-slate-500">{selected.region}</p>
                  <p className="mt-2 break-all font-mono text-[11px] text-cyan-200/75">
                    {selected.baseUrl}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => setSelected(null)}>
                  Fermer
                </Button>
              </div>
              <div className="scrollbar-thin max-h-[calc(100vh-220px)] space-y-6 overflow-y-auto p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Pairs connectés
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
                    Objets stockés
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
                          <Badge variant="info">Chaud</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        Aucun réplica épinglé sur ce nœud.
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-cyan-500/10 to-violet-600/5 p-4">
                  <p className="text-sm font-medium text-slate-100">
                    Simulation de panne
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Les interrupteurs isolent le pair du maillage sans supprimer
                    les métadonnées.
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="flex-1"
                      variant="secondary"
                      onClick={() => toggleNode(selected.id)}
                    >
                      <Power className="h-4 w-4" />
                      Basculer Marche/Arrêt
                    </Button>
                    <Button
                      className="flex-1"
                      variant="danger"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => confirmRemovePeer(selected.id)}
                    >
                      Retirer ce pair
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
