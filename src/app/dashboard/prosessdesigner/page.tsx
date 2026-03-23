"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { DesignerLayout } from "@/modules/process-designer/components/layout";
import { ChatPanel } from "@/modules/process-designer/components/chat";
import { ProcessCanvas } from "@/modules/process-designer/components/canvas/process-canvas";
import { CanvasToolbar } from "@/modules/process-designer/components/canvas/canvas-toolbar";
import { nodeTypes } from "@/modules/process-designer/components/canvas/bpmn-nodes";
import { PropertiesPanel } from "@/modules/process-designer/components/properties";
import { ValidationPanel } from "@/modules/process-designer/components/validation";
import { ExportPanel } from "@/modules/process-designer/components/export";
import { MCPLibraryPanel } from "@/modules/process-designer/components/mcp-library";

import { autoLayout, type LayoutDirection } from "@/modules/process-designer/lib/auto-layout";
import { validateProcess } from "@/modules/process-designer/lib/bpmn-validation";
import {
  detectPhase,
  generateSuggestions,
} from "@/modules/process-designer/lib/llm-orchestrator";

import type {
  ProcessDefinition,
  ProcessNode,
  ChatMessage,
  ChatPhase,
  ValidationResult,
} from "@/modules/process-designer/types";

// ─── Initial state ──────────────────────────────────────────────────

const INITIAL_PROCESS: ProcessDefinition = {
  id: "new-process",
  name: "Ny prosess",
  description: "",
  version: 1,
  status: "draft",
  createdBy: "",
  nodes: [],
  edges: [],
  tags: [],
  isTemplate: false,
  createdAt: null,
  updatedAt: null,
};

// ─── Convert between ProcessNode and ReactFlow Node ─────────────────

function toReactFlowNodes(nodes: ProcessNode[]): Node[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: {
      label: n.label,
      agentConfig: n.agentConfig,
      mcpConfig: n.mcpConfig,
      metadata: n.metadata,
    },
    selected: false,
  }));
}

function toReactFlowEdges(edges: ProcessDefinition["edges"]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: false,
    style: { strokeWidth: 2 },
    data: { condition: e.condition },
  }));
}

// ─── Page Component ─────────────────────────────────────────────────

export default function ProcessDesignerPage() {
  // Process state
  const [process, setProcess] = useState<ProcessDefinition>(INITIAL_PROCESS);
  const [nodes, setNodes, onNodesChange] = useNodesState(toReactFlowNodes(process.nodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toReactFlowEdges(process.edges));

  // UI state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showProperties, setShowProperties] = useState(false);
  const [direction, setDirection] = useState<LayoutDirection>("LR");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hei! Jeg er Process Agent Designer. Beskriv prosessen du vil bygge, så hjelper jeg deg med å strukturere, agentifisere og deploye den.\n\nStart med å fortelle meg: **Hva er det prosessen skal gjøre?**",
      phase: "kartlegging",
      suggestions: [
        "Jeg vil automatisere fakturamottaket",
        "Hjelp meg med bankavtemming",
        "Bygg en lønnskjøringsprosess",
      ],
      timestamp: Date.now(),
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);

  const currentPhase = useMemo(
    () => detectPhase(messages, process),
    [messages, process]
  );
  const suggestions = useMemo(
    () => generateSuggestions(currentPhase),
    [currentPhase]
  );

  // Selected node
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return process.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, process.nodes]);

  // ─── Handlers ───────────────────────────────────────────────────

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, style: { strokeWidth: 2 } }, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      setShowProperties(true);
    },
    []
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content,
        phase: currentPhase,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Simulate AI response
      setIsStreaming(true);
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content: `Forstått! La meg analysere dette. Jeg jobber med å ${
            currentPhase === "kartlegging"
              ? "kartlegge prosessen"
              : currentPhase === "strukturering"
                ? "strukturere BPMN-flyten"
                : currentPhase === "agentifisering"
                  ? "foreslå agentifisering"
                  : "validere prosessen"
          }...`,
          phase: currentPhase,
          suggestions: generateSuggestions(currentPhase),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsStreaming(false);
      }, 1500);
    },
    [currentPhase]
  );

  const handleAutoLayout = useCallback(() => {
    const result = autoLayout(process.nodes, process.edges, { direction });
    setProcess((prev) => ({ ...prev, nodes: result.nodes }));
    setNodes(toReactFlowNodes(result.nodes));
  }, [process.nodes, process.edges, direction, setNodes]);

  const handleValidate = useCallback(() => {
    const result = validateProcess(process);
    setValidationResult(result);
  }, [process]);

  const handleToggleDirection = useCallback(() => {
    setDirection((d) => (d === "LR" ? "TB" : "LR"));
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((f) => !f);
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: Partial<ProcessNode>) => {
      setProcess((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...updates } : n
        ),
      }));
    },
    []
  );

  const handleImport = useCallback(
    (data: { nodes: ProcessNode[]; edges: ProcessDefinition["edges"]; name: string }) => {
      setProcess((prev) => ({
        ...prev,
        name: data.name,
        nodes: data.nodes,
        edges: data.edges,
      }));
      setNodes(toReactFlowNodes(data.nodes));
      setEdges(toReactFlowEdges(data.edges));
    },
    [setNodes, setEdges]
  );

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <ReactFlowProvider>
      <div className="flex h-[calc(100vh-64px)] flex-col">
        <DesignerLayout
          chatPanel={
            <ChatPanel
              messages={messages}
              currentPhase={currentPhase}
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              suggestions={suggestions}
            />
          }
          canvasPanel={
            <div className="flex h-full flex-col">
              <CanvasToolbar
                onAutoLayout={handleAutoLayout}
                onValidate={handleValidate}
                onZoomToFit={() => {}}
                onToggleDirection={handleToggleDirection}
                onToggleFullscreen={handleToggleFullscreen}
                direction={direction}
              />
              <div className="relative flex-1">
                <ProcessCanvas
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={onNodeClick}
                  nodeTypes={nodeTypes}
                  isStreaming={isStreaming}
                />
              </div>

              {/* Validation results */}
              {validationResult && (
                <div className="max-h-48 overflow-y-auto border-t">
                  <ValidationPanel
                    result={validationResult}
                    onNodeClick={(nodeId) => {
                      setSelectedNodeId(nodeId);
                      setShowProperties(true);
                    }}
                    onValidate={handleValidate}
                  />
                </div>
              )}
            </div>
          }
          propertiesPanel={
            showProperties && selectedNode ? (
              <PropertiesPanel
                node={selectedNode}
                onUpdate={handleNodeUpdate}
                onClose={() => setShowProperties(false)}
              />
            ) : (
              <ExportPanel process={process} onImport={handleImport} />
            )
          }
          showProperties={showProperties}
        />
      </div>
    </ReactFlowProvider>
  );
}
