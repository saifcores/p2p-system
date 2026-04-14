import { Menu, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useCallback, useState } from "react";
import { useMeshData } from "../context/useMeshData";

export function TopBar({
  title,
  subtitle,
  onMenu,
}: {
  title: string;
  subtitle?: string;
  onMenu: () => void;
}) {
  const { metrics, refreshError, refresh } = useMeshData();
  const healthy = metrics.failedNodes === 0;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#030712]/70 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={onMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-200 ring-1 ring-white/10 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-sm text-slate-500">{subtitle}</p>
          ) : null}
          {refreshError ? (
            <p
              className="mt-1 truncate text-xs text-amber-200/90"
              title={refreshError}
            >
              {refreshError}
            </p>
          ) : null}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={refreshing}
            title="Refresh cluster data"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-300 ring-1 ring-white/10 transition hover:bg-white/[0.08] disabled:pointer-events-none disabled:opacity-50"
            aria-label="Refresh cluster data"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              readOnly
              placeholder="Search nodes, files, hashes…"
              className="h-10 w-[min(320px,28vw)] rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 outline-none ring-0 focus:border-cyan-500/40"
            />
          </div>
        </div>
        <div
          className={`flex items-center gap-2 rounded-2xl px-3 py-2 ring-1 ${
            healthy
              ? "bg-emerald-500/10 ring-emerald-500/20"
              : "bg-amber-500/10 ring-amber-500/20"
          }`}
        >
          <ShieldCheck
            className={`h-4 w-4 ${healthy ? "text-emerald-300" : "text-amber-200"}`}
          />
          <div className="hidden text-right sm:block">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Cluster
            </p>
            <p
              className={`text-xs font-semibold ${healthy ? "text-emerald-200" : "text-amber-100"}`}
            >
              {healthy ? "Healthy" : "Degraded"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
