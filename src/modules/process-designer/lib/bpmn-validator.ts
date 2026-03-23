/**
 * BPMN-validering — strukturell og semantisk validering av prosessen.
 */

import type { ProcessNode, ProcessEdge } from "../types";

export type ValidationSeverity = "error" | "warning" | "info";

export type ValidationIssue = {
  severity: ValidationSeverity;
  nodeId?: string;
  edgeId?: string;
  message: string;
  fixSuggestion?: string;
};

export type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
  summary: { errors: number; warnings: number; info: number };
};

/**
 * Valider en prosessdefinisjon.
 * Utfører både strukturell og semantisk validering.
 */
export function validateProcess(
  nodes: ProcessNode[],
  edges: ProcessEdge[]
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // ── Strukturell validering ──────────────────────────────

  // 1. Nøyaktig én startEvent
  const startEvents = nodes.filter((n) => n.type === "startEvent");
  if (startEvents.length === 0) {
    issues.push({
      severity: "error",
      message: "Prosessen mangler en startEvent",
      fixSuggestion: "Legg til en startEvent-node",
    });
  } else if (startEvents.length > 1) {
    startEvents.slice(1).forEach((n) =>
      issues.push({
        severity: "error",
        nodeId: n.id,
        message: `Flere startEvents funnet — kun én er tillatt`,
        fixSuggestion: "Fjern ekstra startEvent-noder",
      })
    );
  }

  // 2. Minst én endEvent
  const endEvents = nodes.filter((n) => n.type === "endEvent");
  if (endEvents.length === 0) {
    issues.push({
      severity: "error",
      message: "Prosessen mangler en endEvent",
      fixSuggestion: "Legg til en endEvent-node",
    });
  }

  // 3. Alle noder er tilkoblet
  const connectedNodeIds = new Set<string>();
  edges.forEach((e) => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });

  nodes.forEach((n) => {
    if (!connectedNodeIds.has(n.id)) {
      issues.push({
        severity: "error",
        nodeId: n.id,
        message: `Node "${n.label}" (${n.id}) er ikke tilkoblet noen kanter`,
        fixSuggestion: "Koble noden til resten av prosessen",
      });
    }
  });

  // 4. Ingen kanter refererer til ikke-eksisterende noder
  const nodeIds = new Set(nodes.map((n) => n.id));
  edges.forEach((e) => {
    if (!nodeIds.has(e.source)) {
      issues.push({
        severity: "error",
        edgeId: e.id,
        message: `Kant "${e.id}" refererer til ukjent source "${e.source}"`,
      });
    }
    if (!nodeIds.has(e.target)) {
      issues.push({
        severity: "error",
        edgeId: e.id,
        message: `Kant "${e.id}" refererer til ukjent target "${e.target}"`,
      });
    }
  });

  // 5. Gateways — korrekt antall inn/ut
  const incomingCount = new Map<string, number>();
  const outgoingCount = new Map<string, number>();
  edges.forEach((e) => {
    outgoingCount.set(e.source, (outgoingCount.get(e.source) || 0) + 1);
    incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1);
  });

  nodes.forEach((n) => {
    const outgoing = outgoingCount.get(n.id) || 0;
    const incoming = incomingCount.get(n.id) || 0;

    if (n.type === "exclusiveGateway") {
      if (outgoing < 2) {
        issues.push({
          severity: "warning",
          nodeId: n.id,
          message: `Exclusive gateway "${n.label}" har ${outgoing} utgående kanter — bør ha minst 2`,
          fixSuggestion: "Legg til alternative veier fra gatewayen",
        });
      }
    }

    if (n.type === "parallelGateway") {
      if (outgoing < 2 && incoming < 2) {
        issues.push({
          severity: "warning",
          nodeId: n.id,
          message: `Parallel gateway "${n.label}" bør ha enten flere utgående (fork) eller flere inngående (join)`,
        });
      }
    }

    if (n.type === "startEvent" && incoming > 0) {
      issues.push({
        severity: "error",
        nodeId: n.id,
        message: "startEvent skal ikke ha inngående kanter",
      });
    }

    if (n.type === "endEvent" && outgoing > 0) {
      issues.push({
        severity: "error",
        nodeId: n.id,
        message: "endEvent skal ikke ha utgående kanter",
      });
    }
  });

  // 6. Parallelle gateways — matchende fork/join
  const parallelGateways = nodes.filter((n) => n.type === "parallelGateway");
  const forks = parallelGateways.filter(
    (n) => (outgoingCount.get(n.id) || 0) >= 2
  );
  const joins = parallelGateways.filter(
    (n) => (incomingCount.get(n.id) || 0) >= 2
  );
  if (forks.length !== joins.length) {
    issues.push({
      severity: "warning",
      message: `${forks.length} parallell fork(s) og ${joins.length} join(s) — bør matche`,
      fixSuggestion: "Legg til matchende fork/join parallel gateways",
    });
  }

  // ── Semantisk validering ────────────────────────────────

  // 7. ServiceTask-noder bør ha agentConfig
  nodes
    .filter((n) => n.type === "serviceTask")
    .forEach((n) => {
      if (!n.agentConfig) {
        issues.push({
          severity: "info",
          nodeId: n.id,
          message: `ServiceTask "${n.label}" mangler agentConfig — bør konfigureres for agentifisering`,
          fixSuggestion: "Legg til agentConfig med prompt og verktøy",
        });
      }
    });

  // 8. Betingelser på exclusive gateways
  nodes
    .filter((n) => n.type === "exclusiveGateway")
    .forEach((n) => {
      const outEdges = edges.filter((e) => e.source === n.id);
      const missingConditions = outEdges.filter((e) => !e.condition);
      if (missingConditions.length > 0 && outEdges.length >= 2) {
        issues.push({
          severity: "warning",
          nodeId: n.id,
          message: `Exclusive gateway "${n.label}" har ${missingConditions.length} kanter uten betingelse`,
          fixSuggestion: "Definer betingelser for alle utgående kanter",
        });
      }
    });

  // ── Oppsummering ────────────────────────────────────────

  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const info = issues.filter((i) => i.severity === "info").length;

  return {
    valid: errors === 0,
    issues,
    summary: { errors, warnings, info },
  };
}
