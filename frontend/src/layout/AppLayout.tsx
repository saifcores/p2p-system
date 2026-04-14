import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

const titles: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Dashboard", subtitle: "Live mesh topology and fleet health" },
  "/files": {
    title: "File manager",
    subtitle: "Objects, replicas, and distribution",
  },
  "/nodes": {
    title: "Nodes",
    subtitle: "Peers, capacity, and failure simulation",
  },
  "/replication": {
    title: "Replication",
    subtitle: "Fan-out paths and retry controls",
  },
  "/logs": {
    title: "Logs & monitoring",
    subtitle: "Structured stream with filters",
  },
};

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const loc = useLocation();
  const meta = titles[loc.pathname] ?? { title: "P2P Mesh" };

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenu={() => setMobileOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
