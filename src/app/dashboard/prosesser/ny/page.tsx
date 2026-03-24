"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  SplitViewLayout,
  DesignerChat,
  BPMNCanvas,
  PropertiesPanel,
  getTemplates,
  cloneTemplate,
  type ProcessNode,
  type ProcessEdge,
} from "@/modules/process-designer";

export default function NyProsessPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("mal");

  // Initialiser fra mal hvis angitt
  const initialData = useMemo(() => {
    if (templateId) {
      const templates = getTemplates();
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        const cloned = cloneTemplate(template);
        return { nodes: cloned.nodes, edges: cloned.edges };
      }
    }
    return { nodes: [] as ProcessNode[], edges: [] as ProcessEdge[] };
  }, [templateId]);

  const [nodes, setNodes] = useState<ProcessNode[]>(initialData.nodes);
  const [edges, setEdges] = useState<ProcessEdge[]>(initialData.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showProperties, setShowProperties] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const handleNodeSelect = useCallback((id: string | null) => {
    setSelectedNodeId(id);
    if (id) setShowProperties(true);
  }, []);

  const handleNodeUpdate = useCallback(
    (updated: ProcessNode) => {
      setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    },
    []
  );

  const handleNodesChange = useCallback(
    (newNodes: ProcessNode[], newEdges: ProcessEdge[]) => {
      setNodes(newNodes);
      setEdges(newEdges);
    },
    []
  );

  return (
    <div className="h-[calc(100vh-theme(spacing.14)-theme(spacing.12))]">
      <SplitViewLayout
        chatPanel={
          <DesignerChat
            nodes={nodes}
            edges={edges}
            onUpdate={handleNodesChange}
          />
        }
        canvasPanel={
          <BPMNCanvas
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect}
          />
        }
        propertiesPanel={
          selectedNode ? (
            <PropertiesPanel
              node={selectedNode}
              onUpdate={handleNodeUpdate}
            />
          ) : undefined
        }
        showProperties={showProperties && !!selectedNode}
        onToggleProperties={() => setShowProperties((p) => !p)}
      />
    </div>
  );
}
