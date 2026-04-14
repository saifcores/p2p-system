import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useMeshData } from "../../context/useMeshData";

export function ToastStack() {
  const { toasts, dismissToast } = useMeshData();
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="pointer-events-auto glass-panel-strong overflow-hidden"
          >
            <div
              className={`flex gap-3 p-4 ${
                t.variant === "success"
                  ? "border-l-2 border-emerald-400"
                  : t.variant === "error"
                    ? "border-l-2 border-rose-400"
                    : "border-l-2 border-cyan-400/80"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-50">{t.title}</p>
                {t.description ? (
                  <p className="mt-0.5 text-xs text-slate-400">
                    {t.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="rounded-lg p-1 text-slate-500 hover:bg-white/5 hover:text-slate-200"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
