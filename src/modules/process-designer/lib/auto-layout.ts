/**
 * Auto-layout algoritme for BPMN-prosesser.
 *
 * Enkel hierarkisk layout-algoritme (Sugiyama-stil) uten eksterne
 * avhengigheter. Kan erstattes med dagre/elkjs for mer avansert layout.
 */

import type { ProcessNode, ProcessEdge } from "../types";

type LayoutDirection = "LR" | "TB";

type LayoutOptions = {
  direction?: LayoutDirection;
  nodeWidth?: number;
  nodeHeight?: number;
  horizontalSpacing?: number;
  verticalSpacing?: number;
};

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  direction: "LR",
  nodeWidth: 160,
  nodeHeight: 60,
  horizontalSpacing: 80,
  verticalSpacing: 60,
};

/**
 * Beregn automatisk layout for noder basert på kantforbindelser.
 *
 * Algoritme:
 * 1. Topologisk sortering for å bestemme rekkefølge
 * 2. Lag-tilordning (noder uten inngående → lag 0)
 * 3. Posisjonering basert på lag og rekkefølge innen lag
 */
export function autoLayout(
  nodes: ProcessNode[],
  edges: ProcessEdge[],
  options?: LayoutOptions
): ProcessNode[] {
  if (nodes.length === 0) return [];

  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Bygg adjacency-lister
  const successors = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach((n) => {
    successors.set(n.id, []);
    predecessors.set(n.id, []);
    inDegree.set(n.id, 0);
  });

  edges.forEach((e) => {
    if (successors.has(e.source) && predecessors.has(e.target)) {
      successors.get(e.source)!.push(e.target);
      predecessors.get(e.target)!.push(e.source);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  // Topologisk sortering (Kahn's algorithm)
  const layers: string[][] = [];
  const assigned = new Set<string>();
  let currentLayer = nodes
    .filter((n) => (inDegree.get(n.id) || 0) === 0)
    .map((n) => n.id);

  while (currentLayer.length > 0) {
    layers.push(currentLayer);
    currentLayer.forEach((id) => assigned.add(id));

    const nextLayer: string[] = [];
    for (const id of currentLayer) {
      for (const succ of successors.get(id) || []) {
        if (assigned.has(succ)) continue;
        // Sjekk om alle predecessors er tildelt
        const allPredAssigned = (predecessors.get(succ) || []).every((p) =>
          assigned.has(p)
        );
        if (allPredAssigned && !nextLayer.includes(succ)) {
          nextLayer.push(succ);
        }
      }
    }

    currentLayer = nextLayer;
  }

  // Legg til noder som ikke ble nådd (øyer/sykluser)
  const unassigned = nodes.filter((n) => !assigned.has(n.id));
  if (unassigned.length > 0) {
    layers.push(unassigned.map((n) => n.id));
  }

  // Beregn posisjoner
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const positions = new Map<string, { x: number; y: number }>();

  const isHorizontal = opts.direction === "LR";
  const layerStep = isHorizontal
    ? opts.nodeWidth + opts.horizontalSpacing
    : opts.nodeHeight + opts.verticalSpacing;
  const nodeStep = isHorizontal
    ? opts.nodeHeight + opts.verticalSpacing
    : opts.nodeWidth + opts.horizontalSpacing;

  layers.forEach((layer, layerIndex) => {
    const layerOffset = layerIndex * layerStep;
    const totalHeight = (layer.length - 1) * nodeStep;
    const startOffset = -totalHeight / 2;

    layer.forEach((nodeId, nodeIndex) => {
      const nodeOffset = startOffset + nodeIndex * nodeStep;

      if (isHorizontal) {
        positions.set(nodeId, { x: layerOffset, y: nodeOffset + 200 });
      } else {
        positions.set(nodeId, { x: nodeOffset + 400, y: layerOffset });
      }
    });
  });

  // Returner noder med oppdaterte posisjoner
  return nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) || node.position,
  }));
}

/**
 * Inkrementell layout — plasserer nye noder uten å flytte eksisterende.
 */
export function layoutNewNodes(
  existingNodes: ProcessNode[],
  newNodes: ProcessNode[],
  edges: ProcessEdge[],
  options?: LayoutOptions
): ProcessNode[] {
  if (newNodes.length === 0) return existingNodes;

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const existingIds = new Set(existingNodes.map((n) => n.id));

  // Finn posisjoner for nye noder basert på deres connections
  const positioned = newNodes.map((node) => {
    // Finn predecessors som allerede er plassert
    const incomingEdges = edges.filter(
      (e) => e.target === node.id && existingIds.has(e.source)
    );

    if (incomingEdges.length > 0) {
      const sourcePositions = incomingEdges
        .map((e) => existingNodes.find((n) => n.id === e.source))
        .filter(Boolean)
        .map((n) => n!.position);

      const avgX =
        sourcePositions.reduce((sum, p) => sum + p.x, 0) /
        sourcePositions.length;
      const avgY =
        sourcePositions.reduce((sum, p) => sum + p.y, 0) /
        sourcePositions.length;

      return {
        ...node,
        position: {
          x: avgX + opts.nodeWidth + opts.horizontalSpacing,
          y: avgY,
        },
      };
    }

    // Ingen connections — plasser til høyre for siste node
    const maxX = Math.max(
      0,
      ...existingNodes.map((n) => n.position.x)
    );
    return {
      ...node,
      position: {
        x: maxX + opts.nodeWidth + opts.horizontalSpacing,
        y: 200,
      },
    };
  });

  return [...existingNodes, ...positioned];
}
