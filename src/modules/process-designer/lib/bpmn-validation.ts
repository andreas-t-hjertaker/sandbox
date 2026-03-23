import type {
  ProcessDefinition,
  ValidationResult,
  ValidationIssue,
} from "../types";

export function validateProcess(process: ProcessDefinition): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const { nodes, edges } = process;

  // ─── Structural validation ──────────────────────────────────────

  // Exactly one startEvent
  const startEvents = nodes.filter((n) => n.type === "startEvent");
  if (startEvents.length === 0) {
    errors.push({
      severity: "error",
      message: "Prosessen mangler en startEvent",
      fix: "Legg til en startEvent-node",
    });
  } else if (startEvents.length > 1) {
    errors.push({
      severity: "error",
      message: `Prosessen har ${startEvents.length} startEvents — det skal være nøyaktig én`,
      nodeId: startEvents[1].id,
      fix: "Fjern overflødige startEvent-noder",
    });
  }

  // At least one endEvent
  const endEvents = nodes.filter((n) => n.type === "endEvent");
  if (endEvents.length === 0) {
    errors.push({
      severity: "error",
      message: "Prosessen mangler en endEvent",
      fix: "Legg til en endEvent-node",
    });
  }

  // All nodes connected (no orphans)
  const connectedNodeIds = new Set<string>();
  for (const edge of edges) {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  }
  for (const node of nodes) {
    if (!connectedNodeIds.has(node.id) && nodes.length > 1) {
      errors.push({
        severity: "error",
        message: `Node "${node.label}" er ikke tilkoblet noen kanter`,
        nodeId: node.id,
        fix: "Koble noden til flyten eller fjern den",
      });
    }
  }

  // StartEvent should have no incoming edges
  for (const start of startEvents) {
    const incoming = edges.filter((e) => e.target === start.id);
    if (incoming.length > 0) {
      errors.push({
        severity: "error",
        message: `StartEvent "${start.label}" har innkommende kanter`,
        nodeId: start.id,
        fix: "Fjern innkommende kanter fra startEvent",
      });
    }
  }

  // EndEvent should have no outgoing edges
  for (const end of endEvents) {
    const outgoing = edges.filter((e) => e.source === end.id);
    if (outgoing.length > 0) {
      errors.push({
        severity: "error",
        message: `EndEvent "${end.label}" har utgående kanter`,
        nodeId: end.id,
        fix: "Fjern utgående kanter fra endEvent",
      });
    }
  }

  // Gateways: correct in/out edges
  const gateways = nodes.filter(
    (n) => n.type === "exclusiveGateway" || n.type === "parallelGateway"
  );
  for (const gw of gateways) {
    const incoming = edges.filter((e) => e.target === gw.id);
    const outgoing = edges.filter((e) => e.source === gw.id);

    if (outgoing.length < 2) {
      errors.push({
        severity: "error",
        message: `Gateway "${gw.label}" trenger minst 2 utgående kanter, har ${outgoing.length}`,
        nodeId: gw.id,
        fix: "Legg til flere utgående kanter",
      });
    }

    if (incoming.length === 0) {
      errors.push({
        severity: "error",
        message: `Gateway "${gw.label}" har ingen innkommende kanter`,
        nodeId: gw.id,
        fix: "Koble en innkommende kant til gatewayen",
      });
    }
  }

  // Parallel gateways should have matching fork/join
  const parallelGateways = nodes.filter((n) => n.type === "parallelGateway");
  if (parallelGateways.length % 2 !== 0) {
    warnings.push({
      severity: "warning",
      message: `Odde antall parallelGateways (${parallelGateways.length}) — bør ha matchende fork/join-par`,
    });
  }

  // ─── Semantic validation ────────────────────────────────────────

  // ServiceTask nodes should have agentConfig
  const serviceTasks = nodes.filter((n) => n.type === "serviceTask");
  for (const task of serviceTasks) {
    if (!task.agentConfig) {
      warnings.push({
        severity: "warning",
        message: `ServiceTask "${task.label}" mangler agent-konfigurasjon`,
        nodeId: task.id,
        fix: "Konfigurer agent for denne noden",
      });
    }
  }

  // MCP nodes should have valid server config
  for (const node of nodes) {
    if (node.mcpConfig) {
      if (!node.mcpConfig.serverId) {
        errors.push({
          severity: "error",
          message: `Node "${node.label}" har MCP-konfig uten serverId`,
          nodeId: node.id,
        });
      }
      if (!node.mcpConfig.toolName) {
        errors.push({
          severity: "error",
          message: `Node "${node.label}" har MCP-konfig uten toolName`,
          nodeId: node.id,
        });
      }
    }
  }

  // Exclusive gateway conditions
  const exclusiveGateways = nodes.filter((n) => n.type === "exclusiveGateway");
  for (const gw of exclusiveGateways) {
    const outgoing = edges.filter((e) => e.source === gw.id);
    const withoutCondition = outgoing.filter((e) => !e.condition);
    if (withoutCondition.length > 1) {
      warnings.push({
        severity: "warning",
        message: `ExclusiveGateway "${gw.label}" har ${withoutCondition.length} utgående kanter uten betingelse`,
        nodeId: gw.id,
        fix: "Definer betingelser på utgående kanter",
      });
    }
  }

  // Agent nodes should have timeout
  for (const node of nodes) {
    if (node.agentConfig && !node.agentConfig.timeout) {
      warnings.push({
        severity: "warning",
        message: `Node "${node.label}" har agent-konfig uten timeout`,
        nodeId: node.id,
        fix: "Sett en timeout for agent-noden",
      });
    }
  }

  // Check for cycles (basic DFS)
  const hasCycle = detectCycle(nodes, edges);
  if (hasCycle) {
    warnings.push({
      severity: "warning",
      message: "Prosessen inneholder en syklus — dette kan føre til uendelig løkke",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function detectCycle(
  nodes: ProcessDefinition["nodes"],
  edges: ProcessDefinition["edges"]
): boolean {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    inStack.add(nodeId);

    for (const neighbor of adjacency.get(nodeId) || []) {
      if (inStack.has(neighbor)) return true;
      if (!visited.has(neighbor) && dfs(neighbor)) return true;
    }

    inStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id) && dfs(node.id)) return true;
  }

  return false;
}
