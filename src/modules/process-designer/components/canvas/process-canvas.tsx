"use client";

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2 } from "lucide-react";

interface ProcessCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeClick?: NodeMouseHandler;
  nodeTypes?: NodeTypes;
  isStreaming?: boolean;
}

function ProcessCanvasInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  nodeTypes,
  isStreaming = false,
}: ProcessCanvasProps) {
  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-zinc-50 dark:bg-zinc-950"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          className="!bg-zinc-50 dark:!bg-zinc-950"
        />
        <Controls
          className="!border-border !bg-background !shadow-sm [&>button]:!border-border [&>button]:!bg-background [&>button]:!text-foreground [&>button]:hover:!bg-muted"
          position="bottom-left"
        />
        <MiniMap
          className="!border-border !bg-background/80 !shadow-sm"
          nodeColor={(node) => {
            if (node.type === "startEvent") return "#22c55e";
            if (node.type === "endEvent") return "#ef4444";
            if (node.type === "exclusiveGateway" || node.type === "parallelGateway")
              return "#f59e0b";
            return "#6366f1";
          }}
          maskColor="rgba(0,0,0,0.1)"
          position="bottom-right"
        />
      </ReactFlow>

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-background/95 px-4 py-2 shadow-lg backdrop-blur-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium text-foreground">
            AI bygger...
          </span>
        </div>
      )}
    </div>
  );
}

export function ProcessCanvas(props: ProcessCanvasProps) {
  return (
    <ReactFlowProvider>
      <ProcessCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
