"use client";

/**
 * Prosess-status dashboard — oversikt over kjørende prosesser (#20).
 */

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export type ProcessInstanceStatus =
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "waiting";

export type ProcessInstance = {
  id: string;
  processName: string;
  processVersion: number;
  status: ProcessInstanceStatus;
  currentStep: string;
  startedAt: Date;
  completedAt?: Date;
  stepsCompleted: number;
  totalSteps: number;
  error?: string;
};

export type DeployedProcess = {
  id: string;
  name: string;
  version: number;
  status: "active" | "paused" | "stopped";
  instanceCount: number;
  lastRun?: Date;
  errorRate: number;
};

type ProcessStatusDashboardProps = {
  processes: DeployedProcess[];
  instances: ProcessInstance[];
  onSelectInstance?: (id: string) => void;
  onToggleProcess?: (id: string, action: "pause" | "resume" | "stop") => void;
  className?: string;
};

const statusIcons: Record<ProcessInstanceStatus, React.ElementType> = {
  running: Play,
  paused: Pause,
  completed: CheckCircle2,
  failed: XCircle,
  waiting: Clock,
};

const statusColors: Record<ProcessInstanceStatus, string> = {
  running: "text-blue-500",
  paused: "text-yellow-500",
  completed: "text-green-500",
  failed: "text-red-500",
  waiting: "text-muted-foreground",
};

export function ProcessStatusDashboard({
  processes,
  instances,
  onSelectInstance,
  onToggleProcess,
  className,
}: ProcessStatusDashboardProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Deployede prosesser */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Deployede prosesser</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {processes.map((proc) => (
            <Card key={proc.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{proc.name}</CardTitle>
                  <Badge
                    variant={
                      proc.status === "active"
                        ? "default"
                        : proc.status === "paused"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {proc.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Versjon: {proc.version}</p>
                  <p>Kjøringer: {proc.instanceCount}</p>
                  <p>
                    Feilrate:{" "}
                    <span
                      className={cn(
                        proc.errorRate > 10
                          ? "text-red-500"
                          : proc.errorRate > 5
                            ? "text-yellow-500"
                            : "text-green-500"
                      )}
                    >
                      {proc.errorRate}%
                    </span>
                  </p>
                  {proc.lastRun && (
                    <p>
                      Siste:{" "}
                      {proc.lastRun.toLocaleDateString("nb-NO")}
                    </p>
                  )}
                </div>
                <div className="mt-3 flex gap-1">
                  {proc.status === "active" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onToggleProcess?.(proc.id, "pause")}
                    >
                      <Pause className="mr-1 h-3 w-3" />
                      Pause
                    </Button>
                  ) : proc.status === "paused" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onToggleProcess?.(proc.id, "resume")}
                    >
                      <Play className="mr-1 h-3 w-3" />
                      Gjenoppta
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive"
                    onClick={() => onToggleProcess?.(proc.id, "stop")}
                  >
                    <Square className="mr-1 h-3 w-3" />
                    Stopp
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {processes.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">
              Ingen prosesser er deployert ennå.
            </p>
          )}
        </div>
      </div>

      {/* Kjørende instanser */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Kjøringer</h2>
        <div className="space-y-2">
          {instances.map((inst) => {
            const Icon = statusIcons[inst.status];
            const color = statusColors[inst.status];
            const progress =
              inst.totalSteps > 0
                ? Math.round((inst.stepsCompleted / inst.totalSteps) * 100)
                : 0;

            return (
              <button
                key={inst.id}
                type="button"
                onClick={() => onSelectInstance?.(inst.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent/50"
              >
                <Icon className={cn("h-4 w-4 shrink-0", color)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {inst.processName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {inst.currentStep} — {inst.stepsCompleted}/{inst.totalSteps} steg
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Fremdriftsbar */}
                  <div className="h-1.5 w-20 rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        inst.status === "failed"
                          ? "bg-red-500"
                          : inst.status === "completed"
                            ? "bg-green-500"
                            : "bg-primary"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {progress}%
                  </span>
                </div>
                {inst.error && (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                )}
              </button>
            );
          })}
          {instances.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ingen kjøringer pågår.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
