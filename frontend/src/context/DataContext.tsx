import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  downloadFile as apiDownload,
  fetchHealth,
  fetchLocalFiles,
  fetchPeers,
  normalizeBaseUrl,
  registerPeerOnNode,
  removePeerOnNode,
  uploadFile as apiUpload,
  type FileMetadataDto,
} from "../api/p2pClient";
import { P2P_NODE_URLS, TARGET_REPLICAS } from "../config";
import { formatBytes } from "../utils/formatBytes";
import { normalizeStoredAt } from "../utils/storedAt";
import { MeshDataContext } from "./meshContext";
import type { DataContextValue, ToastMessage } from "./meshTypes";
import type {
  ActivityItem,
  ActivityType,
  GraphEdge,
  LogFilter,
  LogLine,
  MeshFile,
  MeshNode,
  ReplicationEntry,
} from "../types";

const POLL_MS = 4000;

function randomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function shortPeerHint(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `http://${url}`);
    return `${u.hostname}:${u.port || (u.protocol === "https:" ? "443" : "80")}`;
  } catch {
    return url.slice(0, 24);
  }
}

interface PollOk {
  kind: "ok";
  baseUrl: string;
  nodeId: string;
  files: FileMetadataDto[];
  peerUrls: string[];
  latencyMs: number;
}

interface PollFail {
  kind: "fail";
  baseUrl: string;
  message: string;
}

type PollResult = PollOk | PollFail;

export function DataProvider({ children }: { children: ReactNode }) {
  const [extraPeerUrls, setExtraPeerUrls] = useState<string[]>([]);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const [disabledBaseUrls, setDisabledBaseUrls] = useState<string[]>([]);
  const [nodes, setNodes] = useState<MeshNode[]>([]);
  const [files, setFiles] = useState<MeshFile[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [replication, setReplication] = useState<ReplicationEntry[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [logFilter, setLogFilter] = useState<LogFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const lastKnownRef = useRef<Map<string, MeshNode>>(new Map());

  const allBaseUrls = useMemo(() => {
    const fromEnv = P2P_NODE_URLS.filter(
      (u) => !removedUrls.includes(normalizeBaseUrl(u)),
    );
    const extra = extraPeerUrls.map(normalizeBaseUrl);
    return Array.from(new Set([...fromEnv, ...extra]));
  }, [extraPeerUrls, removedUrls]);

  const pushToast = useCallback((t: Omit<ToastMessage, "id">) => {
    const id = randomId();
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addActivity = useCallback((message: string, type: ActivityType) => {
    setActivity((a) =>
      [
        { id: randomId(), at: new Date().toISOString(), type, message },
        ...a,
      ].slice(0, 50),
    );
  }, []);

  const buildCluster = useCallback(
    (results: PollResult[]) => {
      const ok = results.filter((r): r is PollOk => r.kind === "ok");
      const idByBase = new Map<string, string>();
      ok.forEach((r) => idByBase.set(normalizeBaseUrl(r.baseUrl), r.nodeId));

      const meshNodes: MeshNode[] = [];
      for (const r of ok) {
        const base = normalizeBaseUrl(r.baseUrl);
        const totalBytes = r.files.reduce((s, f) => s + f.sizeBytes, 0);
        const storageUsedPct = Math.min(
          95,
          Math.max(5, Math.round((totalBytes / (96 * 1024 * 1024)) * 100)),
        );
        let port = 80;
        try {
          const u = new URL(base);
          port = parseInt(
            u.port || (u.protocol === "https:" ? "443" : "80"),
            10,
          );
        } catch {
          /* ignore */
        }

        const peerIds = r.peerUrls
          .map((p) => idByBase.get(normalizeBaseUrl(p)))
          .filter((x): x is string => Boolean(x));
        const peerDisplay =
          peerIds.length > 0
            ? peerIds
            : r.peerUrls.map(
                (u) => idByBase.get(normalizeBaseUrl(u)) ?? shortPeerHint(u),
              );

        const node: MeshNode = {
          id: r.nodeId,
          label: r.nodeId,
          port,
          status: r.latencyMs > 2500 ? "degraded" : "online",
          latencyMs: r.latencyMs,
          storageUsedPct,
          peers: peerDisplay,
          region: (() => {
            try {
              return new URL(base).hostname;
            } catch {
              return "local";
            }
          })(),
          enabled: true,
          baseUrl: base,
        };
        lastKnownRef.current.set(base, node);
        meshNodes.push(node);
      }

      for (const r of results) {
        if (r.kind === "fail") {
          const base = normalizeBaseUrl(r.baseUrl);
          const cached = lastKnownRef.current.get(base);
          if (cached) {
            meshNodes.push({
              ...cached,
              status: "offline",
              enabled: false,
              latencyMs: 0,
              storageUsedPct: 0,
            });
          }
        }
      }

      for (const base of allBaseUrls) {
        if (disabledBaseUrls.includes(base)) {
          const cached = lastKnownRef.current.get(base);
          if (cached && !meshNodes.some((n) => n.baseUrl === base)) {
            meshNodes.push({
              ...cached,
              status: "offline",
              enabled: false,
              latencyMs: 0,
            });
          }
        }
      }

      const deduped = new Map<string, MeshNode>();
      for (const n of meshNodes) {
        deduped.set(n.id, n);
      }
      const uniqueNodes = [...deduped.values()];

      const byName = new Map<
        string,
        { meta: FileMetadataDto; holders: Set<string> }
      >();
      for (const r of ok) {
        for (const f of r.files) {
          const cur = byName.get(f.filename) ?? {
            meta: f,
            holders: new Set<string>(),
          };
          cur.holders.add(r.nodeId);
          cur.meta = f;
          byName.set(f.filename, cur);
        }
      }

      const onlineCount = uniqueNodes.filter(
        (n) => n.enabled && n.status !== "offline",
      ).length;
      const required = Math.min(TARGET_REPLICAS, Math.max(1, onlineCount));

      const meshFiles: MeshFile[] = [...byName.entries()].map(([name, v]) => {
        const holders = [...v.holders];
        const count = holders.length;
        let status: MeshFile["status"] = "degraded";
        if (count >= required) status = "replicated";
        else if (count <= 0) status = "critical";
        else status = "degraded";

        return {
          id: name,
          name,
          sizeBytes: v.meta.sizeBytes,
          replicaNodes: holders,
          requiredReplicas: required,
          status,
          updatedAt: normalizeStoredAt(v.meta.storedAt),
        };
      });
      meshFiles.sort((a, b) => a.name.localeCompare(b.name));

      const edgeList: GraphEdge[] = [];
      const idSet = new Set(uniqueNodes.map((n) => n.id));
      for (const n of uniqueNodes) {
        for (const p of n.peers) {
          if (idSet.has(p)) {
            edgeList.push({ from: n.id, to: p });
          }
        }
      }

      setNodes(uniqueNodes);
      setFiles(meshFiles);
      setEdges(edgeList);

      setReplication((prev) =>
        prev.map((entry) => {
          if (entry.status !== "pending") return entry;
          const target = uniqueNodes.find((n) => n.id === entry.targetId);
          if (!target || target.status === "offline") return entry;
          const f = meshFiles.find((x) => x.name === entry.fileName);
          const okRep = f?.replicaNodes.includes(entry.targetId);
          return okRep ? { ...entry, status: "success" as const } : entry;
        }),
      );

      setLogs((prev) => {
        const line: LogLine = {
          id: randomId(),
          at: new Date().toISOString(),
          level: ok.length ? "info" : "warn",
          channel: "request",
          message:
            ok.length === 0
              ? `cluster poll · no nodes reachable (${results.length} tried)`
              : `cluster poll · ${ok.length}/${allBaseUrls.length} nodes UP · ${meshFiles.length} unique objects`,
        };
        return [line, ...prev].slice(0, 200);
      });
    },
    [allBaseUrls, disabledBaseUrls],
  );

  const refresh = useCallback(async () => {
    setRefreshError(null);
    const results: PollResult[] = [];
    for (const baseUrl of allBaseUrls) {
      const base = normalizeBaseUrl(baseUrl);
      if (disabledBaseUrls.includes(base)) {
        results.push({
          kind: "fail",
          baseUrl: base,
          message: "disabled (simulated outage)",
        });
        continue;
      }
      const t0 = performance.now();
      try {
        const health = await fetchHealth(base);
        const fileList = await fetchLocalFiles(base);
        let peerUrls: string[] = [];
        try {
          peerUrls = await fetchPeers(base);
        } catch {
          peerUrls = [];
        }
        const latencyMs = Math.round(performance.now() - t0);
        results.push({
          kind: "ok",
          baseUrl: base,
          nodeId: health.nodeId,
          files: fileList,
          peerUrls,
          latencyMs,
        });
      } catch (e) {
        results.push({
          kind: "fail",
          baseUrl: base,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }
    buildCluster(results);
    const anyOk = results.some((r) => r.kind === "ok");
    if (!anyOk && results.length > 0) {
      setRefreshError(
        "No peers responded. Start Spring Boot nodes and check CORS / URLs.",
      );
    }
    setLoading(false);
  }, [allBaseUrls, buildCluster, disabledBaseUrls]);

  useEffect(() => {
    const boot = window.setTimeout(() => {
      void refresh();
    }, 0);
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(id);
    };
  }, [refresh]);

  const metrics = useMemo(() => {
    const onlineNodes = nodes.filter(
      (n) => n.enabled && n.status !== "offline",
    ).length;
    const failedNodes = nodes.filter(
      (n) => !n.enabled || n.status === "offline",
    ).length;
    const rf = files.length
      ? Math.round(
          (files.reduce((s, f) => s + f.replicaNodes.length, 0) /
            Math.max(1, files.length)) *
            10,
        ) / 10
      : 0;
    return {
      totalNodes: nodes.length,
      onlineNodes,
      failedNodes,
      totalFiles: files.length,
      replicationFactor: rf,
    };
  }, [nodes, files]);

  const pickIngress = useCallback((): MeshNode | undefined => {
    return nodes.find((n) => n.enabled && n.status !== "offline");
  }, [nodes]);

  const uploadFileObject = useCallback(
    async (file: File) => {
      const ingress = pickIngress();
      if (!ingress) {
        pushToast({
          title: "No reachable node",
          description: "Start at least one Spring Boot peer.",
          variant: "error",
        });
        return;
      }
      try {
        await apiUpload(ingress.baseUrl, file.name, file, false);
        addActivity(
          `Stored ${file.name} (${formatBytes(file.size)}) on ${ingress.label}`,
          "transfer",
        );
        pushToast({
          title: "Upload accepted",
          description: file.name,
          variant: "success",
        });
        const others = nodes.filter(
          (n) => n.id !== ingress.id && n.enabled && n.status !== "offline",
        );
        if (others.length) {
          const entries: ReplicationEntry[] = others.map((t) => ({
            id: randomId(),
            at: new Date().toISOString(),
            sourceId: ingress.id,
            targetId: t.id,
            fileName: file.name,
            status: "pending" as const,
            bytes: file.size,
          }));
          setReplication((prev) => [...entries, ...prev].slice(0, 80));
        }
        void refresh();
      } catch (e) {
        pushToast({
          title: "Upload failed",
          description: e instanceof Error ? e.message : String(e),
          variant: "error",
        });
      }
    },
    [addActivity, nodes, pickIngress, pushToast, refresh],
  );

  const simulateUpload = useCallback(
    async (name: string, sizeBytes: number) => {
      const cap = Math.min(sizeBytes, 512 * 1024);
      const buf = new Uint8Array(cap);
      crypto.getRandomValues(buf);
      const blob = new Blob([buf]);
      const ingress = pickIngress();
      if (!ingress) {
        pushToast({ title: "No reachable node", variant: "error" });
        return;
      }
      try {
        await apiUpload(ingress.baseUrl, name, blob, false);
        addActivity(
          `Stored ${name} (${formatBytes(cap)}) on ${ingress.label}`,
          "transfer",
        );
        pushToast({
          title: "Upload accepted",
          description: name,
          variant: "success",
        });
        void refresh();
      } catch (e) {
        pushToast({
          title: "Upload failed",
          description: e instanceof Error ? e.message : String(e),
          variant: "error",
        });
      }
    },
    [addActivity, pickIngress, pushToast, refresh],
  );

  const downloadClusterFile = useCallback(
    async (filename: string) => {
      const f = files.find((x) => x.name === filename);
      const holderId = f?.replicaNodes[0];
      const n = holderId ? nodes.find((x) => x.id === holderId) : pickIngress();
      if (!n) {
        pushToast({ title: "No node to download from", variant: "error" });
        return;
      }
      try {
        const blob = await apiDownload(n.baseUrl, filename);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
        addActivity(`Downloaded ${filename} from ${n.label}`, "transfer");
      } catch (e) {
        pushToast({
          title: "Download failed",
          description: e instanceof Error ? e.message : String(e),
          variant: "error",
        });
      }
    },
    [addActivity, files, nodes, pickIngress, pushToast],
  );

  const addPeer = useCallback(() => {
    const raw = window.prompt(
      "Peer base URL (Spring Boot) — must be reachable from this browser",
      "http://localhost:5013",
    );
    if (!raw) return;
    const url = normalizeBaseUrl(raw);

    void (async () => {
      try {
        const normalizedNew = url;

        if (allBaseUrls.some((u) => normalizeBaseUrl(u) === normalizedNew)) {
          pushToast({
            title: "Already in mesh",
            description: normalizedNew,
            variant: "default",
          });
          return;
        }

        const targets = nodes.filter(
          (n) => n.enabled && n.status !== "offline",
        );

        if (targets.length === 0) {
          setExtraPeerUrls((prev) =>
            prev.includes(normalizedNew) ? prev : [...prev, normalizedNew],
          );
          pushToast({
            title: "Peer saved for later",
            description:
              "Start a Spring Boot node, then use Add peer again to register.",
            variant: "default",
          });
          return;
        }

        const clusterMembers = allBaseUrls
          .map(normalizeBaseUrl)
          .filter((u) => u !== normalizedNew);

        const forwardResults = await Promise.allSettled(
          targets.map((n) => registerPeerOnNode(n.baseUrl, normalizedNew)),
        );
        const forwardOk = forwardResults.filter(
          (r) => r.status === "fulfilled",
        ).length;
        if (forwardOk === 0) {
          const first = forwardResults.find((r) => r.status === "rejected");
          const msg =
            first?.status === "rejected" && first.reason instanceof Error
              ? first.reason.message
              : "no node accepted registration";
          throw new Error(msg);
        }

        let reverseOk = 0;
        try {
          await fetchHealth(normalizedNew);
          if (clusterMembers.length > 0) {
            const reverseResults = await Promise.allSettled(
              clusterMembers.map((member) =>
                registerPeerOnNode(normalizedNew, member),
              ),
            );
            reverseOk = reverseResults.filter(
              (r) => r.status === "fulfilled",
            ).length;
          }
        } catch {
          /* new peer not listening yet */
        }

        setExtraPeerUrls((prev) =>
          prev.includes(normalizedNew) ? prev : [...prev, normalizedNew],
        );

        addActivity(
          `Mesh: ${normalizedNew} registered on ${forwardOk}/${targets.length} node(s); reverse ${reverseOk}/${clusterMembers.length}`,
          "health",
        );

        if (clusterMembers.length > 0 && reverseOk === 0) {
          pushToast({
            title: "Half-mesh: start the new peer",
            description:
              "Existing nodes know this URL. Start the new JVM and click Add peer again to finish linking.",
            variant: "default",
          });
        } else if (forwardOk < targets.length) {
          pushToast({
            title: "Partial registration",
            description: `${forwardOk}/${targets.length} nodes updated. Check offline simulators.`,
            variant: "default",
          });
        } else {
          pushToast({
            title: "Peer registered",
            description: normalizedNew,
            variant: "success",
          });
        }
        void refresh();
      } catch (e) {
        pushToast({
          title: "Register failed",
          description: e instanceof Error ? e.message : String(e),
          variant: "error",
        });
      }
    })();
  }, [addActivity, allBaseUrls, nodes, pushToast, refresh]);

  const removePeer = useCallback(
    (nodeId: string) => {
      const target = nodes.find((n) => n.id === nodeId);
      if (!target) return;
      const url = normalizeBaseUrl(target.baseUrl);
      void (async () => {
        try {
          const responders = nodes.filter(
            (n) => n.enabled && n.status !== "offline" && n.id !== target.id,
          );
          await Promise.all(
            responders.map((n) =>
              removePeerOnNode(n.baseUrl, url).catch(() => undefined),
            ),
          );
          if (P2P_NODE_URLS.map(normalizeBaseUrl).includes(url)) {
            setRemovedUrls((prev) =>
              prev.includes(url) ? prev : [...prev, url],
            );
          } else {
            setExtraPeerUrls((prev) =>
              prev.filter((x) => normalizeBaseUrl(x) !== url),
            );
          }
          setDisabledBaseUrls((prev) => prev.filter((b) => b !== url));
          lastKnownRef.current.delete(url);
          pushToast({
            title: "Peer removed from mesh",
            description: target.label,
            variant: "default",
          });
          void refresh();
        } catch (e) {
          pushToast({
            title: "Remove failed",
            description: e instanceof Error ? e.message : String(e),
            variant: "error",
          });
        }
      })();
    },
    [nodes, pushToast, refresh],
  );

  const toggleNode = useCallback(
    (nodeId: string) => {
      const n = nodes.find((x) => x.id === nodeId);
      if (!n) return;
      const base = normalizeBaseUrl(n.baseUrl);
      const wasDisabled = disabledBaseUrls.includes(base);
      setDisabledBaseUrls((prev) =>
        wasDisabled ? prev.filter((b) => b !== base) : [...prev, base],
      );
      pushToast({
        title: wasDisabled
          ? "Node re-enabled (polling)"
          : "Node drained (simulated)",
        description: n.label,
        variant: "default",
      });
      addActivity(
        `Operator ${wasDisabled ? "enabled" : "disabled"} ${n.label}`,
        "health",
      );
    },
    [addActivity, disabledBaseUrls, nodes, pushToast],
  );

  const retryReplication = useCallback(
    (repId: string) => {
      const entry = replication.find((r) => r.id === repId);
      if (!entry) return;
      void (async () => {
        const source = nodes.find((n) => n.id === entry.sourceId);
        const target = nodes.find((n) => n.id === entry.targetId);
        if (!source || !target) {
          pushToast({ title: "Source/target not in view", variant: "error" });
          return;
        }
        try {
          const blob = await apiDownload(source.baseUrl, entry.fileName);
          await apiUpload(target.baseUrl, entry.fileName, blob, true);
          setReplication((prev) =>
            prev.map((r) =>
              r.id === repId ? { ...r, status: "success" as const } : r,
            ),
          );
          pushToast({
            title: "Replication push ok",
            description: entry.fileName,
            variant: "success",
          });
          void refresh();
        } catch (e) {
          pushToast({
            title: "Retry failed",
            description: e instanceof Error ? e.message : String(e),
            variant: "error",
          });
        }
      })();
    },
    [nodes, pushToast, replication, refresh],
  );

  const triggerReplicate = useCallback(
    (fileId: string) => {
      const file = files.find((f) => f.id === fileId);
      const ingress = pickIngress();
      if (!file || !ingress) return;
      void (async () => {
        try {
          const sourceId = file.replicaNodes[0];
          const source = sourceId
            ? nodes.find((n) => n.id === sourceId)
            : undefined;
          if (!source) {
            pushToast({ title: "No replica to copy from", variant: "error" });
            return;
          }
          const blob = await apiDownload(source.baseUrl, file.name);
          await apiUpload(ingress.baseUrl, file.name, blob, false);
          pushToast({
            title: "Fan-out triggered",
            description: file.name,
            variant: "success",
          });
          void refresh();
        } catch (e) {
          pushToast({
            title: "Replicate failed",
            description: e instanceof Error ? e.message : String(e),
            variant: "error",
          });
        }
      })();
    },
    [files, nodes, pickIngress, pushToast, refresh],
  );

  const value: DataContextValue = {
    nodes,
    files,
    edges,
    activity,
    replication,
    logs,
    toasts,
    dismissToast,
    metrics,
    toggleNode,
    addPeer,
    removePeer,
    retryReplication,
    triggerReplicate,
    simulateUpload,
    uploadFileObject,
    downloadClusterFile,
    addActivity,
    logFilter,
    setLogFilter,
    loading,
    refreshError,
    refresh,
  };

  return (
    <MeshDataContext.Provider value={value}>
      {children}
    </MeshDataContext.Provider>
  );
}
