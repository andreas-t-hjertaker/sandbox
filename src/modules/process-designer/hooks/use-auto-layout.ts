import { useCallback } from "react";
import dagre from "@dagrejs/dagre";
import { useProcessDesignerContext } from "../store";
import { LAYOUT_DEFAULTS } from "../constants";
import type { ProcessNode, ProcessEdge, Position } from "../types";

// ─── Types ───────────────────────────────────────────────────────────

export type LayoutDirection = "LR" | "TB";

export interface LayoutOptions {
  direction?: LayoutDirection;
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

export interface LayoutResult {
  nodes: ProcessNode[];
  width: number;
  height: number;
}

// ─── Core layout function ────────────────────────────────────────────

export function computeLayout(
  nodes: ProcessNode[],
  edges: ProcessEdge[],
  options?: LayoutOptions,
): LayoutResult {
  const direction = options?.direction ?? LAYOUT_DEFAULTS.direction;
  const nodeWidth = options?.nodeWidth ?? LAYOUT_DEFAULTS.nodeWidth;
  const nodeHeight = options?.nodeHeight ?? LAYOUT_DEFAULTS.nodeHeight;
  const rankSep = options?.rankSep ?? LAYOUT_DEFAULTS.rankSep;
  const nodeSep = options?.nodeSep ?? LAYOUT_DEFAULTS.nodeSep;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: rankSep,
    nodesep: nodeSep,
    marginx: 20,
    marginy: 20,
  });

  // Add nodes
  for (const node of nodes) {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  }

  // Add edges
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  // Run layout
  dagre.layout(g);

  // Extract positions, centering nodes on dagre coordinates
  const layoutNodes: ProcessNode[] = nodes.map((node) => {
    const dagreNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - nodeWidth / 2,
        y: dagreNode.y - nodeHeight / 2,
      },
    };
  });

  const graph = g.graph();

  return {
    nodes: layoutNodes,
    width: graph.width ?? 0,
    height: graph.height ?? 0,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useAutoLayout() {
  const { state, dispatch } = useProcessDesignerContext();

  const applyLayout = useCallback(
    (options?: LayoutOptions): LayoutResult | null => {
      if (!state.process || state.process.nodes.length === 0) return null;

      const result = computeLayout(
        state.process.nodes,
        state.process.edges,
        options,
      );

      dispatch({ type: "SET_NODES", payload: result.nodes });

      return result;
    },
    [state.process, dispatch],
  );

  const applyLeftToRight = useCallback(
    () => applyLayout({ direction: "LR" }),
    [applyLayout],
  );

  const applyTopToBottom = useCallback(
    () => applyLayout({ direction: "TB" }),
    [applyLayout],
  );

  return {
    applyLayout,
    applyLeftToRight,
    applyTopToBottom,
  };
}
