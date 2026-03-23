"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { X } from "lucide-react";
import type { AgentConfig, MCPToolConfig } from "../../../types";

type BPMNNodeData = {
  label: string;
  agentConfig?: AgentConfig;
  mcpConfig?: MCPToolConfig;
  metadata?: Record<string, unknown>;
};

export function ExclusiveGatewayNode({ data, selected }: NodeProps & { data: BPMNNodeData }) {
  return (
    <div
      className={`
        group relative flex flex-col items-center
        ${selected ? "drop-shadow-lg" : ""}
      `}
      title={data.label}
    >
      <div
        className={`
          flex h-12 w-12 rotate-45 items-center justify-center
          border-2 border-amber-500 bg-amber-50 dark:bg-amber-950
          transition-shadow duration-150
          ${selected ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900" : ""}
          hover:shadow-md
        `}
      >
        <X className="h-5 w-5 -rotate-45 text-amber-600 dark:text-amber-400" />
      </div>
      <span className="mt-3 max-w-[100px] truncate text-center text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {data.label}
      </span>
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-amber-500 !bg-white dark:!bg-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-amber-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}
