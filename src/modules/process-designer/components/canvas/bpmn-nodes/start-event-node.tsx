"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";
import type { AgentConfig, MCPToolConfig } from "../../../types";

type BPMNNodeData = {
  label: string;
  agentConfig?: AgentConfig;
  mcpConfig?: MCPToolConfig;
  metadata?: Record<string, unknown>;
};

export function StartEventNode({ data, selected }: NodeProps & { data: BPMNNodeData }) {
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
          flex h-14 w-14 items-center justify-center rounded-full
          border-2 border-green-500 bg-green-50 dark:bg-green-950
          transition-shadow duration-150
          ${selected ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900" : ""}
          hover:shadow-md
        `}
      >
        <Play className="h-6 w-6 text-green-600 dark:text-green-400" />
      </div>
      <span className="mt-1.5 max-w-[100px] truncate text-center text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {data.label}
      </span>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-green-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}
