import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

const titles: Record<string, { title: string; subtitle?: string }> = {
  "/": {
    title: "Tableau de bord",
    subtitle: "Topologie du maillage et état du parc en direct",
  },
  "/files": {
    title: "Gestionnaire de fichiers",
    subtitle: "Objets, réplicas et répartition",
  },
  "/nodes": {
    title: "Nœuds",
    subtitle: "Pairs, capacité et simulation de pannes",
  },
  "/replication": {
    title: "Réplication",
    subtitle: "Diffusion multi-cibles et contrôles de nouvelle tentative",
  },
  "/logs": {
    title: "Journaux et supervision",
    subtitle: "Flux structurés avec filtres",
  },
};

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const loc = useLocation();
  const meta = titles[loc.pathname] ?? { title: "Maillage P2P" };

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
