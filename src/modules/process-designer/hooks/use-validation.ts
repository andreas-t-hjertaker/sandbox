import { useCallback, useMemo } from "react";
import { useProcessDesignerContext } from "../store";
import type {
  ProcessDefinition,
  ProcessNode,
  ProcessEdge,
  ValidationResult,
  ValidationIssue,
} from "../types";

// ─── Validation rules ────────────────────────────────────────────────

function validateStartEvents(nodes: ProcessNode[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const startEvents = nodes.filter((n) => n.type === "startEvent");

  if (startEvents.length === 0) {
    issues.push({
      severity: "error",
      message: "Prosessen mangler en startnoder (startEvent).",
      fix: "Legg til en startEvent-node.",
    });
  } else if (startEvents.length > 1) {
    for (const node of startEvents.slice(1)) {
      issues.push({
        severity: "error",
        message: `Fant flere startEvent-noder. Kun én er tillatt.`,
        nodeId: node.id,
        fix: "Fjern overflødige startEvent-noder slik at det kun er én.",
      });
    }
  }

  return issues;
}

function validateEndEvents(nodes: ProcessNode[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const endEvents = nodes.filter((n) => n.type === "endEvent");

  if (endEvents.length === 0) {
    issues.push({
      severity: "error",
      message: "Prosessen mangler minst én sluttnode (endEvent).",
      fix: "Legg til en endEvent-node.",
    });
  }

  return issues;
}

function validateConnectedness(
  nodes: ProcessNode[],
  edges: ProcessEdge[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (nodes.length === 0) return issues;

  // Build adjacency set (undirected) for reachability
  const adjacency = new Map<string, Set<string>>();
  for (const node of nodes) {
    adjacency.set(node.id, new Set());
  }
  for (const edge of edges) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  // BFS from first node
  const visited = new Set<string>();
  const queue: string[] = [nodes[0].id];
  visited.add(nodes[0].id);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adjacency.get(current);
    if (!neighbors) continue;
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  // Find orphan nodes
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      issues.push({
        severity: "error",
        message: `Noden "${node.label}" (${node.id}) er ikke tilkoblet resten av prosessen.`,
        nodeId: node.id,
        fix: "Koble noden til resten av prosessen med en kant.",
      });
    }
  }

  return issues;
}

function validateGateways(
  nodes: ProcessNode[],
  edges: ProcessEdge[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const gateways = nodes.filter(
    (n) => n.type === "exclusiveGateway" || n.type === "parallelGateway",
  );

  for (const gateway of gateways) {
    const incomingEdges = edges.filter((e) => e.target === gateway.id);
    const outgoingEdges = edges.filter((e) => e.source === gateway.id);

    // Gateways should have at least 1 incoming edge
    if (incomingEdges.length === 0) {
      issues.push({
        severity: "error",
        message: `Gateway "${gateway.label}" (${gateway.id}) har ingen innkommende kanter.`,
        nodeId: gateway.id,
        fix: "Koble en innkommende kant til denne gatewayen.",
      });
    }

    // Gateways should have at least 2 outgoing edges
    if (outgoingEdges.length < 2) {
      issues.push({
        severity: "warning",
        message: `Gateway "${gateway.label}" (${gateway.id}) har færre enn 2 utgående kanter (fant ${outgoingEdges.length}).`,
        nodeId: gateway.id,
        fix: "En gateway bør ha minst 2 utgående kanter.",
      });
    }

    // Exclusive gateways need conditions on outgoing edges
    if (gateway.type === "exclusiveGateway") {
      for (const edge of outgoingEdges) {
        if (!edge.condition) {
          issues.push({
            severity: "error",
            message: `Utgående kant "${edge.id}" fra exclusiveGateway "${gateway.label}" mangler condition.`,
            nodeId: gateway.id,
            edgeId: edge.id,
            fix: "Legg til en condition på kanten fra denne exclusive gateway.",
          });
        }
      }
    }
  }

  return issues;
}

function validateServiceTasks(nodes: ProcessNode[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const serviceTasks = nodes.filter((n) => n.type === "serviceTask");

  for (const task of serviceTasks) {
    if (!task.agentConfig) {
      issues.push({
        severity: "error",
        message: `ServiceTask "${task.label}" (${task.id}) mangler agentConfig.`,
        nodeId: task.id,
        fix: "Konfigurer agentConfig med autonomynivå, prompt og verktøy.",
      });
    }
  }

  return issues;
}

function validateNodeEdges(
  nodes: ProcessNode[],
  edges: ProcessEdge[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const node of nodes) {
    const incoming = edges.filter((e) => e.target === node.id);
    const outgoing = edges.filter((e) => e.source === node.id);

    // Start events should have no incoming edges
    if (node.type === "startEvent" && incoming.length > 0) {
      issues.push({
        severity: "warning",
        message: `StartEvent "${node.label}" (${node.id}) har innkommende kanter.`,
        nodeId: node.id,
        fix: "Fjern innkommende kanter fra startEvent.",
      });
    }

    // Start events should have at least one outgoing edge
    if (node.type === "startEvent" && outgoing.length === 0) {
      issues.push({
        severity: "error",
        message: `StartEvent "${node.label}" (${node.id}) har ingen utgående kanter.`,
        nodeId: node.id,
        fix: "Koble startEvent til neste node.",
      });
    }

    // End events should have no outgoing edges
    if (node.type === "endEvent" && outgoing.length > 0) {
      issues.push({
        severity: "warning",
        message: `EndEvent "${node.label}" (${node.id}) har utgående kanter.`,
        nodeId: node.id,
        fix: "Fjern utgående kanter fra endEvent.",
      });
    }

    // End events should have at least one incoming edge
    if (node.type === "endEvent" && incoming.length === 0) {
      issues.push({
        severity: "error",
        message: `EndEvent "${node.label}" (${node.id}) har ingen innkommende kanter.`,
        nodeId: node.id,
        fix: "Koble en kant til endEvent.",
      });
    }
  }

  return issues;
}

function validateEdgeReferences(
  nodes: ProcessNode[],
  edges: ProcessEdge[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      issues.push({
        severity: "error",
        message: `Kant "${edge.id}" refererer til ukjent kilde-node "${edge.source}".`,
        edgeId: edge.id,
        fix: "Fjern kanten eller rett opp referansen.",
      });
    }
    if (!nodeIds.has(edge.target)) {
      issues.push({
        severity: "error",
        message: `Kant "${edge.id}" refererer til ukjent mål-node "${edge.target}".`,
        edgeId: edge.id,
        fix: "Fjern kanten eller rett opp referansen.",
      });
    }
  }

  return issues;
}

// ─── Main validation function ────────────────────────────────────────

export function validateProcess(process: ProcessDefinition): ValidationResult {
  const { nodes, edges } = process;

  const allIssues: ValidationIssue[] = [
    ...validateStartEvents(nodes),
    ...validateEndEvents(nodes),
    ...validateEdgeReferences(nodes, edges),
    ...validateConnectedness(nodes, edges),
    ...validateGateways(nodes, edges),
    ...validateServiceTasks(nodes),
    ...validateNodeEdges(nodes, edges),
  ];

  const errors = allIssues.filter((i) => i.severity === "error");
  const warnings = allIssues.filter(
    (i) => i.severity === "warning" || i.severity === "info",
  );

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useValidation() {
  const { state, dispatch } = useProcessDesignerContext();

  const validate = useCallback((): ValidationResult | null => {
    if (!state.process) return null;

    const result = validateProcess(state.process);
    dispatch({ type: "SET_VALIDATION_RESULT", payload: result });
    return result;
  }, [state.process, dispatch]);

  const clearValidation = useCallback(() => {
    dispatch({ type: "SET_VALIDATION_RESULT", payload: null });
  }, [dispatch]);

  const issuesForNode = useMemo(() => {
    if (!state.validationResult) return () => [];

    const issueMap = new Map<string, ValidationIssue[]>();
    const allIssues = [
      ...state.validationResult.errors,
      ...state.validationResult.warnings,
    ];

    for (const issue of allIssues) {
      if (issue.nodeId) {
        const existing = issueMap.get(issue.nodeId) ?? [];
        existing.push(issue);
        issueMap.set(issue.nodeId, existing);
      }
    }

    return (nodeId: string): ValidationIssue[] => issueMap.get(nodeId) ?? [];
  }, [state.validationResult]);

  const issuesForEdge = useMemo(() => {
    if (!state.validationResult) return () => [];

    const issueMap = new Map<string, ValidationIssue[]>();
    const allIssues = [
      ...state.validationResult.errors,
      ...state.validationResult.warnings,
    ];

    for (const issue of allIssues) {
      if (issue.edgeId) {
        const existing = issueMap.get(issue.edgeId) ?? [];
        existing.push(issue);
        issueMap.set(issue.edgeId, existing);
      }
    }

    return (edgeId: string): ValidationIssue[] => issueMap.get(edgeId) ?? [];
  }, [state.validationResult]);

  const errorCount = state.validationResult?.errors.length ?? 0;
  const warningCount = state.validationResult?.warnings.length ?? 0;
  const isValid = state.validationResult?.valid ?? false;

  return {
    validationResult: state.validationResult,
    isValid,
    errorCount,
    warningCount,
    validate,
    clearValidation,
    issuesForNode,
    issuesForEdge,
  };
}
