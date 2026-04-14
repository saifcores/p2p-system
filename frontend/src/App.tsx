import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastStack } from "./components/ui/ToastStack";
import { DataProvider } from "./context/DataContext";
import { AppLayout } from "./layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { FilesPage } from "./pages/FilesPage";
import { LogsPage } from "./pages/LogsPage";
import { NodesPage } from "./pages/NodesPage";
import { ReplicationPage } from "./pages/ReplicationPage";

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="files" element={<FilesPage />} />
            <Route path="nodes" element={<NodesPage />} />
            <Route path="replication" element={<ReplicationPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <ToastStack />
      </BrowserRouter>
    </DataProvider>
  );
}
