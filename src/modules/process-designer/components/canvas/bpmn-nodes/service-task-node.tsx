"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Cog } from "lucide-react";
import type { AgentConfig, MCPToolConfig } from "../../../types";

type BPMNNodeData = {
  label: string;
  agentConfig?: AgentConfig;
  mcpConfig?: MCPToolConfig;
  metadata?: Record<string, unknown>;
};

function AutonomyDots({ level }: { level: number }) {
  return (
    <span className="flex gap-0.5 text-[10px] leading-none" title={`Autonomy level ${level}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < level ? "text-blue-500" : "text-zinc-300 dark:text-zinc-600"}
        >
          ●
        </span>
      ))}
    </span>
  );
}

export function ServiceTaskNode({ data, selected }: NodeProps & { data: BPMNNodeData }) {
  const hasAgent = !!data.agentConfig;
  const hasMcp = !!data.mcpConfig;

  const borderColor = hasMcp
    ? "border-purple-400 dark:border-purple-500"
    : hasAgent
      ? "border-blue-400 dark:border-blue-500"
      : "border-zinc-300 dark:border-zinc-600";

  return (
    <div
      className={`
        group relative flex min-w-[180px] flex-col rounded-lg border-2
        bg-white shadow-sm transition-shadow duration-150 dark:bg-zinc-900
        ${borderColor}
        ${selected ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900" : ""}
        hover:shadow-md
      `}
      title={data.label}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <Cog className="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />
        <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {data.label}
        </span>
      </div>

      {/* Badges */}
      {(hasAgent || hasMcp) && (
        <div className="flex items-center gap-2 px-3 py-1.5">
          {hasAgent && <AutonomyDots level={data.agentConfig!.autonomyLevel} />}
          {hasMcp && (
            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              MCP
            </span>
          )}
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-blue-400 !bg-white dark:!bg-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-blue-400 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}
