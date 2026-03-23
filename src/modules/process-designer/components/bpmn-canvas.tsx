"use client";

/**
 * BPMN Canvas — ReactFlow-basert prosessvisning.
 *
 * Viser BPMN-noder og kanter med custom nodekomponenter.
 * Supports zoom, pan, minimap, og drag-and-drop.
 *
 * NB: Krever at `reactflow` er installert som avhengighet.
 * Se package.json for versjon.
 */

import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { NODE_COLORS } from "../constants";
import type { ProcessNode, ProcessEdge, BPMNNodeType } from "../types";

// ─── Typer for ReactFlow-kompatibilitet ─────────────────────

type RFNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    bpmnType: BPMNNodeType;
    agentConfig?: ProcessNode["agentConfig"];
    mcpConfig?: ProcessNode["mcpConfig"];
    metadata: Record<string, unknown>;
  };
};

type RFEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: Record<string, unknown>;
};

// ─── Konvertere mellom BPMN og ReactFlow-format ─────────────

export function toReactFlowNodes(nodes: ProcessNode[]): RFNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      label: node.label,
      bpmnType: node.type,
      agentConfig: node.agentConfig,
      mcpConfig: node.mcpConfig,
      metadata: node.metadata,
    },
  }));
}

export function toReactFlowEdges(edges: ProcessEdge[]): RFEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label || edge.condition,
    animated: false,
    style: { stroke: "hsl(var(--border))" },
  }));
}

export function fromReactFlowNodes(rfNodes: RFNode[]): ProcessNode[] {
  return rfNodes.map((node) => ({
    id: node.id,
    type: node.data.bpmnType,
    label: node.data.label,
    position: node.position,
    agentConfig: node.data.agentConfig,
    mcpConfig: node.data.mcpConfig,
    metadata: node.data.metadata,
  }));
}

// ─── BPMN Node Ikoner (SVG) ────────────────────────────────

const nodeIcons: Record<BPMNNodeType, string> = {
  startEvent: "▶",
  endEvent: "⏹",
  serviceTask: "⚙",
  userTask: "👤",
  exclusiveGateway: "✕",
  parallelGateway: "+",
  timerEvent: "⏱",
  errorEvent: "⚠",
};

// ─── Statisk BPMN-canvas (uten ReactFlow-avhengighet) ──────

type BPMNCanvasProps = {
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  selectedNodeId?: string | null;
  onNodeSelect?: (nodeId: string) => void;
  onNodeMove?: (nodeId: string, position: { x: number; y: number }) => void;
  className?: string;
};

/**
 * Statisk BPMN-canvas som viser noder og kanter med SVG.
 * Fungerer som fallback uten ReactFlow, og som grunnlag for custom nodevisning.
 */
export function BPMNCanvas({
  nodes,
  edges,
  selectedNodeId,
  onNodeSelect,
  className,
}: BPMNCanvasProps) {
  const viewBox = useMemo(() => {
    if (nodes.length === 0) return "0 0 800 400";
    const xs = nodes.map((n) => n.position.x);
    const ys = nodes.map((n) => n.position.y);
    const minX = Math.min(...xs) - 60;
    const minY = Math.min(...ys) - 40;
    const maxX = Math.max(...xs) + 200;
    const maxY = Math.max(...ys) + 100;
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [nodes]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, ProcessNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      onNodeSelect?.(nodeId);
    },
    [onNodeSelect]
  );

  return (
    <div className={cn("h-full w-full overflow-auto bg-background", className)}>
      {nodes.length === 0 ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <p className="text-sm">
            Chatten vil generere BPMN-noder her. Start med å beskrive prosessen.
          </p>
        </div>
      ) : (
        <svg
          viewBox={viewBox}
          className="h-full w-full"
          style={{ minHeight: 400 }}
        >
          {/* Kanter */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="hsl(var(--muted-foreground))"
                opacity="0.5"
              />
            </marker>
          </defs>

          {edges.map((edge) => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);
            if (!source || !target) return null;

            const sx = source.position.x + 80;
            const sy = source.position.y + 25;
            const tx = target.position.x;
            const ty = target.position.y + 25;

            return (
              <g key={edge.id}>
                <line
                  x1={sx}
                  y1={sy}
                  x2={tx}
                  y2={ty}
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                {edge.label && (
                  <text
                    x={(sx + tx) / 2}
                    y={(sy + ty) / 2 - 8}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Noder */}
          {nodes.map((node) => {
            const isEvent =
              node.type === "startEvent" ||
              node.type === "endEvent" ||
              node.type === "timerEvent" ||
              node.type === "errorEvent";
            const isGateway =
              node.type === "exclusiveGateway" ||
              node.type === "parallelGateway";
            const isSelected = selectedNodeId === node.id;
            const color = NODE_COLORS[node.type];

            return (
              <g
                key={node.id}
                transform={`translate(${node.position.x}, ${node.position.y})`}
                onClick={() => handleNodeClick(node.id)}
                className="cursor-pointer"
              >
                {isEvent ? (
                  <circle
                    cx="25"
                    cy="25"
                    r="22"
                    fill="white"
                    stroke={color}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all"
                  />
                ) : isGateway ? (
                  <g transform="translate(25, 0)">
                    <rect
                      x="-22"
                      y="3"
                      width="44"
                      height="44"
                      rx="4"
                      fill="white"
                      stroke={color}
                      strokeWidth={isSelected ? 3 : 2}
                      transform="rotate(45, 0, 25)"
                      className="transition-all"
                    />
                  </g>
                ) : (
                  <rect
                    width="160"
                    height="50"
                    rx="8"
                    fill="white"
                    stroke={isSelected ? color : "hsl(var(--border))"}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="transition-all"
                  />
                )}

                {/* Ikon */}
                <text
                  x={isEvent || isGateway ? 25 : 16}
                  y={isEvent || isGateway ? 30 : 30}
                  textAnchor="middle"
                  className="text-xs"
                  style={{ fill: color }}
                >
                  {nodeIcons[node.type]}
                </text>

                {/* Label */}
                <text
                  x={isEvent || isGateway ? 25 : 80}
                  y={isEvent || isGateway ? 60 : 30}
                  textAnchor="middle"
                  className="fill-foreground text-[11px] font-medium"
                >
                  {node.label.length > 20
                    ? node.label.slice(0, 18) + "…"
                    : node.label}
                </text>

                {/* Agent-badge */}
                {node.agentConfig && !isEvent && !isGateway && (
                  <g transform="translate(130, 5)">
                    <rect
                      width="26"
                      height="14"
                      rx="7"
                      fill={color}
                      opacity="0.2"
                    />
                    <text
                      x="13"
                      y="11"
                      textAnchor="middle"
                      className="text-[8px] font-bold"
                      style={{ fill: color }}
                    >
                      A{node.agentConfig.autonomyLevel}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
