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

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: "default" | "success" | "error";
}

export interface DataContextValue {
  nodes: MeshNode[];
  files: MeshFile[];
  edges: GraphEdge[];
  activity: ActivityItem[];
  replication: ReplicationEntry[];
  logs: LogLine[];
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  metrics: {
    totalNodes: number;
    onlineNodes: number;
    failedNodes: number;
    totalFiles: number;
    replicationFactor: number;
  };
  toggleNode: (id: string) => void;
  addPeer: () => void;
  removePeer: (id: string) => void;
  retryReplication: (id: string) => void;
  triggerReplicate: (fileId: string) => void;
  simulateUpload: (name: string, sizeBytes: number) => void;
  uploadFileObject: (file: File) => Promise<void>;
  downloadClusterFile: (filename: string) => Promise<void>;
  addActivity: (message: string, type: ActivityType) => void;
  logFilter: LogFilter;
  setLogFilter: (f: LogFilter) => void;
  loading: boolean;
  refreshError: string | null;
  refresh: () => Promise<void>;
}
