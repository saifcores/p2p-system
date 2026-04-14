import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  FileStack,
  GitBranch,
  LayoutDashboard,
  Network,
  Radio,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/files", label: "Files", icon: FileStack },
  { to: "/nodes", label: "Nodes", icon: Network },
  { to: "/replication", label: "Replication", icon: GitBranch },
  { to: "/logs", label: "Logs", icon: Activity },
];

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const Nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      <div className="mb-4 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/25 ring-1 ring-white/10">
          <Radio className="h-5 w-5 text-cyan-300" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-white">
            P2P Mesh
          </p>
          <p className="truncate text-[11px] text-slate-500">Control plane</p>
        </div>
      </div>
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onClose}
          className={({ isActive }) =>
            clsx(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0 opacity-80" />
          <span className="font-medium">{label}</span>
        </NavLink>
      ))}
      <div className="mt-auto rounded-2xl border border-white/[0.06] bg-gradient-to-br from-cyan-500/10 to-violet-600/10 p-4">
        <p className="text-xs font-medium text-slate-200">Replication factor</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
          3×
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
          Quorum writes across availability zones. Fault tolerance: 1 node.
        </p>
      </div>
    </nav>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-white/[0.06] bg-[#050a14]/80 backdrop-blur-xl lg:block">
        {Nav}
      </aside>
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={onClose}
              aria-label="Close menu"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-[min(280px,85vw)] border-r border-white/[0.08] bg-[#050a14]/95 shadow-2xl backdrop-blur-xl lg:hidden"
            >
              {Nav}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
