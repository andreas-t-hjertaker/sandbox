/**
 * Prosess-versjonering — sammenligning og rollback (#30).
 */

import type { ProcessNode, ProcessEdge } from "../types";
import { createVersion, listVersions } from "../api/firestore";

export type VersionSnapshot = {
  id: string;
  version: number;
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  comment: string;
  createdAt: Date;
};

export type NodeDiff = {
  nodeId: string;
  label: string;
  status: "added" | "removed" | "modified" | "unchanged";
  changes?: string[];
};

export type VersionDiff = {
  addedNodes: string[];
  removedNodes: string[];
  modifiedNodes: { id: string; changes: string[] }[];
  addedEdges: string[];
  removedEdges: string[];
};

/** Lagre en ny versjon */
export async function saveVersion(
  processId: string,
  nodes: ProcessNode[],
  edges: ProcessEdge[],
  comment?: string
) {
  return createVersion(processId, { nodes, edges }, comment);
}

/** Hent versjonshistorikk */
export async function getVersionHistory(processId: string) {
  return listVersions(processId);
}

/** Beregn diff mellom to versjoner */
export function diffVersions(
  before: { nodes: ProcessNode[]; edges: ProcessEdge[] },
  after: { nodes: ProcessNode[]; edges: ProcessEdge[] }
): VersionDiff {
  const beforeNodeIds = new Set(before.nodes.map((n) => n.id));
  const afterNodeIds = new Set(after.nodes.map((n) => n.id));
  const beforeEdgeIds = new Set(before.edges.map((e) => e.id));
  const afterEdgeIds = new Set(after.edges.map((e) => e.id));

  const addedNodes = after.nodes
    .filter((n) => !beforeNodeIds.has(n.id))
    .map((n) => n.id);

  const removedNodes = before.nodes
    .filter((n) => !afterNodeIds.has(n.id))
    .map((n) => n.id);

  const modifiedNodes: { id: string; changes: string[] }[] = [];
  const beforeNodeMap = new Map(before.nodes.map((n) => [n.id, n]));

  after.nodes.forEach((afterNode) => {
    const beforeNode = beforeNodeMap.get(afterNode.id);
    if (!beforeNode) return;

    const changes: string[] = [];
    if (beforeNode.label !== afterNode.label) {
      changes.push(`label: "${beforeNode.label}" → "${afterNode.label}"`);
    }
    if (beforeNode.type !== afterNode.type) {
      changes.push(`type: ${beforeNode.type} → ${afterNode.type}`);
    }
    if (JSON.stringify(beforeNode.agentConfig) !== JSON.stringify(afterNode.agentConfig)) {
      changes.push("agentConfig endret");
    }
    if (JSON.stringify(beforeNode.mcpConfig) !== JSON.stringify(afterNode.mcpConfig)) {
      changes.push("mcpConfig endret");
    }
    if (
      beforeNode.position.x !== afterNode.position.x ||
      beforeNode.position.y !== afterNode.position.y
    ) {
      changes.push("posisjon endret");
    }

    if (changes.length > 0) {
      modifiedNodes.push({ id: afterNode.id, changes });
    }
  });

  return {
    addedNodes,
    removedNodes,
    modifiedNodes,
    addedEdges: after.edges.filter((e) => !beforeEdgeIds.has(e.id)).map((e) => e.id),
    removedEdges: before.edges.filter((e) => !afterEdgeIds.has(e.id)).map((e) => e.id),
  };
}

/** Sjekk om en endring er "stor nok" for automatisk versjonering */
export function isSignificantChange(diff: VersionDiff): boolean {
  return (
    diff.addedNodes.length > 0 ||
    diff.removedNodes.length > 0 ||
    diff.modifiedNodes.some((m) =>
      m.changes.some((c) => !c.includes("posisjon"))
    )
  );
}
