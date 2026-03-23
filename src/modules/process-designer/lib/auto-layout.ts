import dagre from "@dagrejs/dagre";
import type { ProcessNode, ProcessEdge } from "../types";
import { LAYOUT_DEFAULTS } from "../constants";

export type LayoutDirection = "LR" | "TB";

interface LayoutOptions {
  direction?: LayoutDirection;
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

export interface LayoutResult {
  nodes: ProcessNode[];
  edges: ProcessEdge[];
}

export function autoLayout(
  nodes: ProcessNode[],
  edges: ProcessEdge[],
  options: LayoutOptions = {}
): LayoutResult {
  const {
    direction = LAYOUT_DEFAULTS.direction,
    nodeWidth = LAYOUT_DEFAULTS.nodeWidth,
    nodeHeight = LAYOUT_DEFAULTS.nodeHeight,
    rankSep = LAYOUT_DEFAULTS.rankSep,
    nodeSep = LAYOUT_DEFAULTS.nodeSep,
  } = options;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: rankSep,
    nodesep: nodeSep,
    marginx: 50,
    marginy: 50,
  });

  // Add nodes with appropriate sizes
  for (const node of nodes) {
    const isEvent =
      node.type === "startEvent" ||
      node.type === "endEvent" ||
      node.type === "timerEvent" ||
      node.type === "errorEvent";
    const isGateway =
      node.type === "exclusiveGateway" || node.type === "parallelGateway";

    const w = isEvent ? 56 : isGateway ? 56 : nodeWidth;
    const h = isEvent ? 56 : isGateway ? 56 : nodeHeight;

    g.setNode(node.id, { width: w, height: h });
  }

  // Add edges
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  // Apply positions
  const layoutedNodes = nodes.map((node) => {
    const gNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: gNode.x - gNode.width / 2,
        y: gNode.y - gNode.height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Incremental layout: only positions new nodes without moving existing ones.
 */
export function incrementalLayout(
  existingNodes: ProcessNode[],
  newNodes: ProcessNode[],
  edges: ProcessEdge[],
  options: LayoutOptions = {}
): LayoutResult {
  // Full layout
  const allNodes = [...existingNodes, ...newNodes];
  const result = autoLayout(allNodes, edges, options);

  // Keep existing positions, only update new ones
  const existingIds = new Set(existingNodes.map((n) => n.id));
  const mergedNodes = result.nodes.map((node) => {
    if (existingIds.has(node.id)) {
      const original = existingNodes.find((n) => n.id === node.id)!;
      return { ...node, position: original.position };
    }
    return node;
  });

  return { nodes: mergedNodes, edges };
}
