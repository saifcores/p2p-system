import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  GitBranch,
  LayoutGrid,
  MoreHorizontal,
  UploadCloud,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useMeshData } from "../context/useMeshData";
import { formatBytes } from "../utils/formatBytes";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import type { MeshFile } from "../types";

function fileStatusBadge(f: MeshFile) {
  if (f.status === "replicated")
    return (
      <Badge variant="success" dot>
        Replicated
      </Badge>
    );
  if (f.status === "degraded")
    return (
      <Badge variant="warning" dot>
        Missing replicas
      </Badge>
    );
  return (
    <Badge variant="danger" dot>
      Critical
    </Badge>
  );
}

export function FilesPage() {
  const {
    files,
    triggerReplicate,
    simulateUpload,
    uploadFileObject,
    downloadClusterFile,
    loading,
  } = useMeshData();
  const [drag, setDrag] = useState(false);
  const [detail, setDetail] = useState<MeshFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer.files?.[0];
      if (!f) return;
      void uploadFileObject(f);
    },
    [uploadFileObject],
  );

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/10" />
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`relative rounded-2xl border border-dashed px-6 py-10 text-center transition-colors ${
            drag
              ? "border-cyan-400/60 bg-cyan-500/5"
              : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <UploadCloud className="mx-auto h-10 w-10 text-cyan-300/90" />
          <p className="mt-3 text-sm font-medium text-slate-100">
            Drop objects to ingest
          </p>
          <p className="mt-1 text-xs text-slate-500">
            POSTs to the first reachable node; peers replicate asynchronously
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            aria-hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadFileObject(f);
              e.target.value = "";
            }}
          />
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button
              variant="secondary"
              leftIcon={<UploadCloud className="h-4 w-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose file
            </Button>
            <Button
              variant="primary"
              leftIcon={<UploadCloud className="h-4 w-4" />}
              onClick={() =>
                simulateUpload(`upload-${Date.now()}.bin`, 8_388_608)
              }
            >
              Upload sample (8 MiB)
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Objects"
          subtitle="Replica coverage across the fleet"
          action={
            <Button variant="ghost" className="hidden sm:inline-flex">
              <LayoutGrid className="h-4 w-4" />
              Distribution
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="border-b border-white/[0.06] pb-3 pl-1">Name</th>
                <th className="border-b border-white/[0.06] pb-3">Size</th>
                <th className="border-b border-white/[0.06] pb-3">Replicas</th>
                <th className="border-b border-white/[0.06] pb-3">Status</th>
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
                    Loading object index…
                  </td>
                </tr>
              ) : (
                files.map((f) => (
                  <tr key={f.id} className="group">
                    <td className="border-b border-white/[0.04] py-4 pl-1">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500/15 to-violet-500/10 ring-1 ring-white/10" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-100">
                            {f.name}
                          </p>
                          <p className="font-mono text-[11px] text-slate-500">
                            {f.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-white/[0.04] py-4 font-mono text-sm text-slate-300">
                      {formatBytes(f.sizeBytes)}
                    </td>
                    <td className="border-b border-white/[0.04] py-4">
                      <span className="font-mono text-sm text-slate-200">
                        {f.replicaNodes.length}/{f.requiredReplicas}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">nodes</span>
                    </td>
                    <td className="border-b border-white/[0.04] py-4">
                      {fileStatusBadge(f)}
                    </td>
                    <td className="border-b border-white/[0.04] py-4 pr-1 text-right">
                      <div className="flex justify-end gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void downloadClusterFile(f.name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => triggerReplicate(f.id)}
                        >
                          <GitBranch className="h-4 w-4" />
                          Replicate
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDetail(f)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
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

      <AnimatePresence>
        {detail ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
            onClick={() => setDetail(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel-strong w-full max-w-lg rounded-2xl p-6"
            >
              <p className="text-sm font-semibold text-white">
                Replica placement
              </p>
              <p className="mt-1 text-xs text-slate-500">{detail.name}</p>
              <div className="mt-4 space-y-2">
                {detail.replicaNodes.map((id) => (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                  >
                    <span className="font-mono text-xs text-slate-200">
                      {id}
                    </span>
                    <Badge variant="success">Warm</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setDetail(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => detail && triggerReplicate(detail.id)}
                >
                  Force replicate
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={() =>
          simulateUpload(`quick-upload-${Date.now()}.tar`, 4_194_304)
        }
        className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-xl shadow-cyan-500/20 ring-1 ring-white/20"
        aria-label="Quick upload"
      >
        <UploadCloud className="h-6 w-6" />
      </motion.button>
    </div>
  );
}
