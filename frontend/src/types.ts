export type NodeStatus = "online" | "offline" | "degraded";

export interface MeshNode {
  id: string;
  label: string;
  port: number;
  status: NodeStatus;
  latencyMs: number;
  storageUsedPct: number;
  /** Peer node ids when resolvable; otherwise short URL hints. */
  peers: string[];
  region: string;
  enabled: boolean;
  /** REST base URL for this Spring Boot peer (used by the UI client). */
  baseUrl: string;
}

export type FileReplicaStatus = "replicated" | "degraded" | "critical";

export interface MeshFile {
  id: string;
  name: string;
  sizeBytes: number;
  replicaNodes: string[];
  requiredReplicas: number;
  status: FileReplicaStatus;
  updatedAt: string;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export type ActivityType = "replication" | "transfer" | "health" | "error";

export interface ActivityItem {
  id: string;
  at: string;
  type: ActivityType;
  message: string;
}

export type ReplicationEntryStatus = "success" | "pending" | "failed";

export interface ReplicationEntry {
  id: string;
  at: string;
  sourceId: string;
  targetId: string;
  fileName: string;
  status: ReplicationEntryStatus;
  bytes?: number;
}

export type LogFilter = "all" | "replication" | "errors" | "requests";

export interface LogLine {
  id: string;
  at: string;
  level: "info" | "warn" | "error" | "debug";
  channel: "replication" | "request" | "system" | "raft";
  message: string;
}
