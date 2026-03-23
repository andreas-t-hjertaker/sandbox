"use client";

import { useState } from "react";
import {
  Rocket,
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DeployConfig, DeployStatus, ProcessDefinition } from "../../types";

interface DeployPanelProps {
  process: ProcessDefinition;
  deployConfig: DeployConfig | null;
  onDeploy: (environment: "staging" | "production") => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRollback: (version: number) => void;
  isDeploying?: boolean;
}

const statusConfig: Record<
  DeployStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: { label: "Venter", color: "bg-zinc-100 text-zinc-700", icon: Clock },
  deploying: { label: "Deployer...", color: "bg-blue-100 text-blue-700", icon: Loader2 },
  active: { label: "Aktiv", color: "bg-green-100 text-green-700", icon: CheckCircle },
  paused: { label: "Pauset", color: "bg-amber-100 text-amber-700", icon: Pause },
  stopped: { label: "Stoppet", color: "bg-zinc-100 text-zinc-700", icon: Square },
  failed: { label: "Feilet", color: "bg-red-100 text-red-700", icon: XCircle },
};

export function DeployPanel({
  process,
  deployConfig,
  onDeploy,
  onPause,
  onResume,
  onStop,
  onRollback,
  isDeploying,
}: DeployPanelProps) {
  const [selectedEnv, setSelectedEnv] = useState<"staging" | "production">("staging");

  const status = deployConfig?.status;
  const StatusIcon = status ? statusConfig[status].icon : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Rocket className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Deploy prosess</h3>
        {status && (
          <Badge variant="secondary" className={statusConfig[status].color}>
            {StatusIcon && (
              <StatusIcon
                className={`mr-1 h-3 w-3 ${status === "deploying" ? "animate-spin" : ""}`}
              />
            )}
            {statusConfig[status].label}
          </Badge>
        )}
      </div>

      {/* Process info */}
      <div className="rounded-lg border p-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-zinc-500">Prosess:</span>
            <p className="font-medium">{process.name}</p>
          </div>
          <div>
            <span className="text-zinc-500">Versjon:</span>
            <p className="font-medium">v{process.version}</p>
          </div>
          <div>
            <span className="text-zinc-500">Noder:</span>
            <p className="font-medium">{process.nodes.length}</p>
          </div>
          <div>
            <span className="text-zinc-500">Status:</span>
            <p className="font-medium">{process.status}</p>
          </div>
        </div>
      </div>

      {/* Environment selector */}
      {(!deployConfig || status === "stopped" || status === "failed") && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">
            Miljø
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedEnv("staging")}
              className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                selectedEnv === "staging"
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              Staging
            </button>
            <button
              onClick={() => setSelectedEnv("production")}
              className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                selectedEnv === "production"
                  ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              Production
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {(!deployConfig || status === "stopped" || status === "failed") && (
          <Button
            size="sm"
            onClick={() => onDeploy(selectedEnv)}
            disabled={isDeploying || process.status !== "published"}
          >
            {isDeploying ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Rocket className="mr-1 h-3 w-3" />
            )}
            Deploy
          </Button>
        )}

        {status === "active" && (
          <Button size="sm" variant="outline" onClick={onPause}>
            <Pause className="mr-1 h-3 w-3" />
            Pause
          </Button>
        )}

        {status === "paused" && (
          <Button size="sm" variant="outline" onClick={onResume}>
            <Play className="mr-1 h-3 w-3" />
            Gjenoppta
          </Button>
        )}

        {(status === "active" || status === "paused") && (
          <Button size="sm" variant="outline" onClick={onStop}>
            <Square className="mr-1 h-3 w-3" />
            Stopp
          </Button>
        )}

        {deployConfig && process.version > 1 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRollback(process.version - 1)}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Rollback til v{process.version - 1}
          </Button>
        )}
      </div>

      {/* Deploy info */}
      {process.status === "draft" && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Prosessen må publiseres før den kan deployes.
        </p>
      )}
    </div>
  );
}
