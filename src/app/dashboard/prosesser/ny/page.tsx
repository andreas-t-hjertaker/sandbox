"use client";

import { useState, useCallback } from "react";
import {
  SplitViewLayout,
  DesignerChat,
  BPMNCanvas,
  PropertiesPanel,
  getTemplates,
} from "@/modules/process-designer";
import type { ProcessNode, ProcessEdge } from "@/modules/process-designer/types/process-types";

export default function NyProsessPage() {
  const [nodes, setNodes] = useState<ProcessNode[]>([]);
  const [edges, setEdges] = useState<ProcessEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showProperties, setShowProperties] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  const handleProcessUpdate = useCallback(
    (newNodes: ProcessNode[], newEdges: ProcessEdge[]) => {
      setNodes(newNodes);
      setEdges(newEdges);
    },
    []
  );

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setShowProperties(true);
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: Partial<ProcessNode>) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, ...updates } : n))
      );
    },
    []
  );

  const handleNodeMove = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, position } : n))
      );
    },
    []
  );

  // Last en mal som utgangspunkt
  const handleLoadTemplate = useCallback(
    (templateId: string) => {
      const templates = getTemplates();
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setNodes(template.nodes);
        setEdges(template.edges);
      }
    },
    []
  );

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <SplitViewLayout
        chatPanel={
          <DesignerChat
            nodes={nodes}
            edges={edges}
            onProcessUpdate={handleProcessUpdate}
          />
        }
        canvasPanel={
          <BPMNCanvas
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect}
            onNodeMove={handleNodeMove}
          />
        }
        propertiesPanel={
          selectedNode ? (
            <PropertiesPanel
              node={selectedNode}
              onUpdate={handleNodeUpdate}
              onClose={() => setShowProperties(false)}
            />
          ) : undefined
        }
        showProperties={showProperties && !!selectedNode}
        onToggleProperties={() => setShowProperties((v) => !v)}
      />
    </div>
  );
}
