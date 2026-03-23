"use client";

/**
 * Custom BPMN-nodekomponenter for ReactFlow.
 *
 * Hver node har visuell styling, agent-badge, MCP-badge, og tooltip.
 * Bruker Lucide icons fra shadcn/ui.
 */

import { cn } from "@/lib/utils";
import { NODE_COLORS, AUTONOMY_LABELS } from "../constants";
import type { AgentConfig, MCPToolConfig, BPMNNodeType } from "../types";

type BPMNNodeData = {
  label: string;
  bpmnType: BPMNNodeType;
  agentConfig?: AgentConfig;
  mcpConfig?: MCPToolConfig;
  selected?: boolean;
};

// ─── Autonomi-prikker ●●●○○ ─────────────────────────────

function AutonomyDots({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5" title={AUTONOMY_LABELS[level - 1]}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full",
            i <= level ? "bg-current" : "bg-current opacity-20"
          )}
        />
      ))}
    </div>
  );
}

// ─── Basislayout for task-noder ──────────────────────────

function TaskNode({ data }: { data: BPMNNodeData }) {
  const color = NODE_COLORS[data.bpmnType];
  const isAgent = !!data.agentConfig;
  const isMCP = !!data.mcpConfig;

  // Fargeklasse basert på type
  const borderColor = data.selected ? color : "hsl(var(--border))";
  const bgTint = isAgent
    ? `${color}08`
    : isMCP
      ? "#8b5cf608"
      : "transparent";

  return (
    <div
      className={cn(
        "min-w-[140px] max-w-[200px] rounded-lg border-2 bg-card px-3 py-2 shadow-sm transition-all",
        data.selected && "ring-2 ring-offset-1"
      )}
      style={{
        borderColor,
        backgroundColor: bgTint,
        // @ts-expect-error CSS custom property
        "--tw-ring-color": color,
      }}
    >
      {/* Header med ikon og badges */}
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs" style={{ color }}>
          {data.bpmnType === "serviceTask" ? "⚙" : "👤"}
        </span>
        <div className="flex items-center gap-1">
          {isMCP && (
            <span
              className="rounded-sm bg-purple-100 px-1 py-0.5 text-[8px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
            >
              🔌 MCP
            </span>
          )}
          {isAgent && (
            <span
              className="rounded-sm px-1 py-0.5 text-[8px] font-bold"
              style={{ color, backgroundColor: `${color}15` }}
            >
              A{data.agentConfig!.autonomyLevel}
            </span>
          )}
        </div>
      </div>

      {/* Label */}
      <p className="text-xs font-medium leading-tight">{data.label}</p>

      {/* Autonomi-prikker */}
      {isAgent && (
        <div className="mt-1" style={{ color }}>
          <AutonomyDots level={data.agentConfig!.autonomyLevel} />
        </div>
      )}
    </div>
  );
}

// ─── Event-node (sirkel) ─────────────────────────────────

function EventNode({ data }: { data: BPMNNodeData }) {
  const color = NODE_COLORS[data.bpmnType];
  const icons: Record<string, string> = {
    startEvent: "▶",
    endEvent: "⏹",
    timerEvent: "⏱",
    errorEvent: "⚠",
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full border-2 bg-card shadow-sm transition-all",
          data.bpmnType === "endEvent" && "border-[3px]",
          data.selected && "ring-2 ring-offset-1"
        )}
        style={{
          borderColor: color,
          // @ts-expect-error CSS custom property
          "--tw-ring-color": color,
        }}
      >
        <span className="text-sm" style={{ color }}>
          {icons[data.bpmnType] || "●"}
        </span>
      </div>
      <span className="mt-1 text-[10px] text-muted-foreground">
        {data.label}
      </span>
    </div>
  );
}

// ─── Gateway-node (diamant) ──────────────────────────────

function GatewayNode({ data }: { data: BPMNNodeData }) {
  const color = NODE_COLORS[data.bpmnType];
  const icon = data.bpmnType === "exclusiveGateway" ? "✕" : "+";

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "flex h-11 w-11 rotate-45 items-center justify-center rounded border-2 bg-card shadow-sm transition-all",
          data.selected && "ring-2 ring-offset-1"
        )}
        style={{
          borderColor: color,
          // @ts-expect-error CSS custom property
          "--tw-ring-color": color,
        }}
      >
        <span className="-rotate-45 text-sm font-bold" style={{ color }}>
          {icon}
        </span>
      </div>
      <span className="mt-2 text-[10px] text-muted-foreground">
        {data.label}
      </span>
    </div>
  );
}

// ─── Eksportert nodeType map for ReactFlow ──────────────

/**
 * Map fra BPMN-type til React-komponent.
 * Brukes med ReactFlow: `nodeTypes={bpmnNodeTypes}`
 */
export const bpmnNodeTypes: Record<
  BPMNNodeType,
  React.ComponentType<{ data: BPMNNodeData }>
> = {
  startEvent: EventNode,
  endEvent: EventNode,
  timerEvent: EventNode,
  errorEvent: EventNode,
  serviceTask: TaskNode,
  userTask: TaskNode,
  exclusiveGateway: GatewayNode,
  parallelGateway: GatewayNode,
};

export { TaskNode, EventNode, GatewayNode, AutonomyDots };
