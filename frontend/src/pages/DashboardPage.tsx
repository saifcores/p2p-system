import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import { MetricStrip } from "../components/dashboard/MetricStrip";
import { NetworkGraph } from "../components/dashboard/NetworkGraph";
import { NodeStatusCards } from "../components/dashboard/NodeStatusCards";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <MetricStrip />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <NetworkGraph />
          <NodeStatusCards />
        </div>
        <div className="xl:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
