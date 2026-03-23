"use client";

import { useState, useMemo } from "react";
import {
  Activity,
  Play,
  Pause,
  Square,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  BarChart3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  ProcessDefinition,
  DeployConfig,
  ProcessInstance,
  DeployStatus,
  InstanceStatus,
} from "../../types";

interface ProcessDashboardProps {
  processes: (ProcessDefinition & { deploy?: DeployConfig })[];
  instances: ProcessInstance[];
  onSelectProcess: (processId: string) => void;
  onSelectInstance: (instanceId: string) => void;
  onPause: (processId: string) => void;
  onResume: (processId: string) => void;
  onStop: (processId: string) => void;
}

const deployStatusColors: Record<DeployStatus, string> = {
  pending: "bg-zinc-100 text-zinc-700",
  deploying: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  stopped: "bg-zinc-100 text-zinc-700",
  failed: "bg-red-100 text-red-700",
};

const instanceStatusColors: Record<InstanceStatus, string> = {
  running: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  paused: "bg-amber-100 text-amber-700",
  cancelled: "bg-zinc-100 text-zinc-700",
};

const instanceStatusIcons: Record<InstanceStatus, React.ElementType> = {
  running: Play,
  completed: CheckCircle,
  failed: AlertTriangle,
  paused: Pause,
  cancelled: Square,
};

export function ProcessDashboard({
  processes,
  instances,
  onSelectProcess,
  onSelectInstance,
  onPause,
  onResume,
  onStop,
}: ProcessDashboardProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return processes.filter((p) => {
      const matchesSearch =
        !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || p.deploy?.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [processes, search, statusFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    const active = processes.filter((p) => p.deploy?.status === "active").length;
    const running = instances.filter((i) => i.status === "running").length;
    const failed = instances.filter((i) => i.status === "failed").length;
    const completed = instances.filter((i) => i.status === "completed").length;
    return { active, running, failed, completed };
  }, [processes, instances]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Prosess-dashboard</h2>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Aktive prosesser", value: stats.active, icon: Play, color: "text-green-500" },
          { label: "Kjører nå", value: stats.running, icon: Activity, color: "text-blue-500" },
          { label: "Feilet", value: stats.failed, icon: AlertTriangle, color: "text-red-500" },
          { label: "Fullført", value: stats.completed, icon: CheckCircle, color: "text-emerald-500" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border p-3">
            <div className="flex items-center gap-1.5">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-zinc-500">{stat.label}</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk prosesser..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 rounded-md border px-2 text-xs"
        >
          <option value="all">Alle statuser</option>
          <option value="active">Aktiv</option>
          <option value="paused">Pauset</option>
          <option value="stopped">Stoppet</option>
          <option value="failed">Feilet</option>
        </select>
      </div>

      {/* Process list */}
      <div className="space-y-2">
        {filtered.map((process) => {
          const processInstances = instances.filter(
            (i) => i.processId === process.id
          );
          const failRate =
            processInstances.length > 0
              ? Math.round(
                  (processInstances.filter((i) => i.status === "failed").length /
                    processInstances.length) *
                    100
                )
              : 0;

          return (
            <div
              key={process.id}
              className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
              onClick={() => onSelectProcess(process.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{process.name}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    v{process.version}
                  </Badge>
                  {process.deploy && (
                    <Badge
                      variant="secondary"
                      className={deployStatusColors[process.deploy.status]}
                    >
                      {process.deploy.status}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  {process.deploy?.status === "active" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPause(process.id);
                      }}
                    >
                      <Pause className="h-3 w-3" />
                    </Button>
                  )}
                  {process.deploy?.status === "paused" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onResume(process.id);
                      }}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                  {(process.deploy?.status === "active" ||
                    process.deploy?.status === "paused") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStop(process.id);
                      }}
                    >
                      <Square className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-2 flex gap-4 text-[10px] text-zinc-500">
                <span>Kjøringer: {processInstances.length}</span>
                <span>
                  Feilrate: {failRate}%
                </span>
                <span>{process.nodes.length} noder</span>
              </div>

              {/* Running instances */}
              {processInstances
                .filter((i) => i.status === "running")
                .slice(0, 3)
                .map((inst) => {
                  const Icon = instanceStatusIcons[inst.status];
                  return (
                    <div
                      key={inst.id}
                      className="mt-1.5 flex items-center gap-1.5 rounded border bg-blue-50/50 px-2 py-1 text-[10px] dark:bg-blue-950/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectInstance(inst.id);
                      }}
                    >
                      <Icon className="h-3 w-3 text-blue-500" />
                      <span>Instans {inst.id.slice(0, 8)}...</span>
                      <span className="text-zinc-400">
                        Steg: {inst.currentNodeIds.join(", ")}
                      </span>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
