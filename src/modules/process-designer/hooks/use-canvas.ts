import { useCallback, useMemo } from "react";
import {
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge as addRFEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type XYPosition,
  MarkerType,
} from "@xyflow/react";
import { useProcessDesignerContext } from "../store";
import type { ProcessNode, ProcessEdge, BPMNNodeType } from "../types";

// ─── Conversion helpers ──────────────────────────────────────────────

function processNodeToRFNode(node: ProcessNode): Node {
  return {
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
    selected: false,
  };
}

function processEdgeToRFEdge(edge: ProcessEdge): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    data: {
      condition: edge.condition,
    },
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed },
  };
}

function rfNodeToProcessNode(node: Node): ProcessNode {
  return {
    id: node.id,
    type: (node.data?.bpmnType as BPMNNodeType) ?? (node.type as BPMNNodeType) ?? "serviceTask",
    label: (node.data?.label as string) ?? node.id,
    position: node.position,
    agentConfig: node.data?.agentConfig as ProcessNode["agentConfig"],
    mcpConfig: node.data?.mcpConfig as ProcessNode["mcpConfig"],
    metadata: (node.data?.metadata as Record<string, unknown>) ?? {},
  };
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useCanvas() {
  const { state, dispatch } = useProcessDesignerContext();
  const reactFlowInstance = useReactFlow();

  // Convert process nodes/edges to ReactFlow format
  const rfNodes = useMemo<Node[]>(
    () => state.process?.nodes.map(processNodeToRFNode) ?? [],
    [state.process?.nodes],
  );

  const rfEdges = useMemo<Edge[]>(
    () => state.process?.edges.map(processEdgeToRFEdge) ?? [],
    [state.process?.edges],
  );

  // ─── Node change handler ───────────────────────────────────────────
  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!state.process) return;

      for (const change of changes) {
        switch (change.type) {
          case "position": {
            if (change.position && !change.dragging) {
              dispatch({
                type: "UPDATE_NODE",
                payload: {
                  id: change.id,
                  changes: { position: change.position },
                },
              });
            }
            break;
          }
          case "select": {
            if (change.selected) {
              dispatch({ type: "SELECT_NODE", payload: change.id });
            } else if (state.selectedNodeId === change.id) {
              dispatch({ type: "SELECT_NODE", payload: null });
            }
            break;
          }
          case "remove": {
            dispatch({ type: "REMOVE_NODE", payload: change.id });
            break;
          }
        }
      }
    },
    [state.process, state.selectedNodeId, dispatch],
  );

  // ─── Edge change handler ───────────────────────────────────────────
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!state.process) return;

      for (const change of changes) {
        switch (change.type) {
          case "select": {
            if (change.selected) {
              dispatch({ type: "SELECT_EDGE", payload: change.id });
            } else if (state.selectedEdgeId === change.id) {
              dispatch({ type: "SELECT_EDGE", payload: null });
            }
            break;
          }
          case "remove": {
            dispatch({ type: "REMOVE_EDGE", payload: change.id });
            break;
          }
        }
      }
    },
    [state.process, state.selectedEdgeId, dispatch],
  );

  // ─── Connection handler ────────────────────────────────────────────
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const newEdge: ProcessEdge = {
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
      };

      dispatch({ type: "ADD_EDGE", payload: newEdge });
    },
    [dispatch],
  );

  // ─── Add node ──────────────────────────────────────────────────────
  const addNode = useCallback(
    (type: BPMNNodeType, position?: XYPosition, label?: string) => {
      const id = `${type}-${Date.now()}`;
      const defaultLabels: Record<BPMNNodeType, string> = {
        startEvent: "Start",
        endEvent: "Slutt",
        serviceTask: "Tjeneste",
        userTask: "Brukeroppgave",
        exclusiveGateway: "Betingelse",
        parallelGateway: "Parallell",
        timerEvent: "Timer",
        errorEvent: "Feil",
      };

      const resolvedPosition = position ?? screenToFlowPosition({ x: 400, y: 300 });

      const node: ProcessNode = {
        id,
        type,
        label: label ?? defaultLabels[type],
        position: resolvedPosition,
        metadata: {},
      };

      dispatch({ type: "ADD_NODE", payload: node });
      dispatch({ type: "SELECT_NODE", payload: id });

      return id;
    },
    [dispatch],
  );

  // ─── Remove node ───────────────────────────────────────────────────
  const removeNode = useCallback(
    (id: string) => {
      dispatch({ type: "REMOVE_NODE", payload: id });
    },
    [dispatch],
  );

  // ─── Add edge ──────────────────────────────────────────────────────
  const addEdge = useCallback(
    (source: string, target: string, label?: string, condition?: string) => {
      const id = `e-${source}-${target}-${Date.now()}`;
      const edge: ProcessEdge = { id, source, target, label, condition };
      dispatch({ type: "ADD_EDGE", payload: edge });
      return id;
    },
    [dispatch],
  );

  // ─── Remove edge ──────────────────────────────────────────────────
  const removeEdge = useCallback(
    (id: string) => {
      dispatch({ type: "REMOVE_EDGE", payload: id });
    },
    [dispatch],
  );

  // ─── Screen to flow coordinate conversion ─────────────────────────
  const screenToFlowPosition = useCallback(
    (position: { x: number; y: number }): XYPosition => {
      try {
        return reactFlowInstance.screenToFlowPosition(position);
      } catch {
        return { x: position.x, y: position.y };
      }
    },
    [reactFlowInstance],
  );

  // ─── Fit view ──────────────────────────────────────────────────────
  const fitView = useCallback(
    (options?: { padding?: number; duration?: number }) => {
      reactFlowInstance.fitView({
        padding: options?.padding ?? 0.2,
        duration: options?.duration ?? 300,
      });
    },
    [reactFlowInstance],
  );

  // ─── Zoom controls ────────────────────────────────────────────────
  const zoomIn = useCallback(() => {
    reactFlowInstance.zoomIn({ duration: 200 });
  }, [reactFlowInstance]);

  const zoomOut = useCallback(() => {
    reactFlowInstance.zoomOut({ duration: 200 });
  }, [reactFlowInstance]);

  const zoomTo = useCallback(
    (level: number) => {
      reactFlowInstance.zoomTo(level, { duration: 200 });
    },
    [reactFlowInstance],
  );

  // ─── Focus on a specific node ─────────────────────────────────────
  const focusNode = useCallback(
    (nodeId: string) => {
      const node = state.process?.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      reactFlowInstance.setCenter(node.position.x + 90, node.position.y + 30, {
        zoom: 1.5,
        duration: 500,
      });
      dispatch({ type: "SELECT_NODE", payload: nodeId });
    },
    [state.process?.nodes, reactFlowInstance, dispatch],
  );

  // ─── Click on pane (deselect) ─────────────────────────────────────
  const onPaneClick = useCallback(() => {
    dispatch({ type: "SELECT_NODE", payload: null });
    dispatch({ type: "SELECT_EDGE", payload: null });
  }, [dispatch]);

  // ─── Drop handler for drag-and-drop from palette ──────────────────
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/bpmn-type") as BPMNNodeType;
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [reactFlowInstance, addNode],
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return {
    // ReactFlow-compatible data
    nodes: rfNodes,
    edges: rfEdges,

    // Event handlers for ReactFlow
    onNodesChange,
    onEdgesChange,
    onConnect,
    onPaneClick,
    onDrop,
    onDragOver,

    // Node/edge operations
    addNode,
    removeNode,
    addEdge,
    removeEdge,

    // Viewport controls
    fitView,
    zoomIn,
    zoomOut,
    zoomTo,
    focusNode,
    screenToFlowPosition,

    // Selection state
    selectedNodeId: state.selectedNodeId,
    selectedEdgeId: state.selectedEdgeId,
  };
}
