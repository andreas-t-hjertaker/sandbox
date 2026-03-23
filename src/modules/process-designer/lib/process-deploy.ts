/**
 * Prosess-deploy — generer event-drevne agenter fra prosessdefinisjonen.
 *
 * Konverterer en validert prosessdefinisjon til en kjørbar agent-pipeline
 * representert som JSON-konfigurasjon.
 */

import type { ProcessNode, ProcessEdge } from "../types";
import { validateProcess } from "./bpmn-validator";

export type DeployTarget = "staging" | "production";

export type ExecutableStep = {
  nodeId: string;
  type: "agent" | "approval" | "condition" | "parallel-fork" | "parallel-join" | "trigger" | "end";
  label: string;
  config: Record<string, unknown>;
  next: string[];
};

export type ExecutableProcess = {
  id: string;
  name: string;
  version: number;
  target: DeployTarget;
  trigger: {
    type: "firestore" | "schedule" | "http" | "manual";
    config: Record<string, unknown>;
  };
  steps: ExecutableStep[];
  deployedAt: Date;
  deployedBy: string;
};

export type DeployResult = {
  success: boolean;
  process?: ExecutableProcess;
  errors?: string[];
  warnings?: string[];
};

/**
 * Generer en kjørbar prosess fra BPMN-noder og kanter.
 */
export function generateExecutableProcess(
  processId: string,
  processName: string,
  version: number,
  nodes: ProcessNode[],
  edges: ProcessEdge[],
  target: DeployTarget,
  deployedBy: string
): DeployResult {
  // Valider først
  const validation = validateProcess(nodes, edges);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.issues
        .filter((i) => i.severity === "error")
        .map((i) => i.message),
      warnings: validation.issues
        .filter((i) => i.severity === "warning")
        .map((i) => i.message),
    };
  }

  // Bygg adjacency
  const successors = new Map<string, string[]>();
  nodes.forEach((n) => successors.set(n.id, []));
  edges.forEach((e) => {
    successors.get(e.source)?.push(e.target);
  });

  // Konverter noder til executable steps
  const steps: ExecutableStep[] = nodes.map((node) => {
    const next = successors.get(node.id) || [];

    switch (node.type) {
      case "startEvent":
        return {
          nodeId: node.id,
          type: "trigger" as const,
          label: node.label,
          config: { triggerType: "manual" },
          next,
        };

      case "endEvent":
        return {
          nodeId: node.id,
          type: "end" as const,
          label: node.label,
          config: {},
          next: [],
        };

      case "serviceTask":
        return {
          nodeId: node.id,
          type: "agent" as const,
          label: node.label,
          config: {
            agentConfig: node.agentConfig || null,
            mcpConfig: node.mcpConfig || null,
          },
          next,
        };

      case "userTask":
        return {
          nodeId: node.id,
          type: "approval" as const,
          label: node.label,
          config: {
            approvalType: "manual",
            agentConfig: node.agentConfig || null,
          },
          next,
        };

      case "exclusiveGateway": {
        const conditionEdges = edges
          .filter((e) => e.source === node.id)
          .map((e) => ({ target: e.target, condition: e.condition || "default" }));
        return {
          nodeId: node.id,
          type: "condition" as const,
          label: node.label,
          config: { conditions: conditionEdges },
          next,
        };
      }

      case "parallelGateway": {
        const incoming = edges.filter((e) => e.target === node.id).length;
        const outgoing = next.length;
        const isFork = outgoing >= 2;
        return {
          nodeId: node.id,
          type: isFork ? "parallel-fork" as const : "parallel-join" as const,
          label: node.label,
          config: { branchCount: isFork ? outgoing : incoming },
          next,
        };
      }

      default:
        return {
          nodeId: node.id,
          type: "agent" as const,
          label: node.label,
          config: {},
          next,
        };
    }
  });

  const process: ExecutableProcess = {
    id: processId,
    name: processName,
    version,
    target,
    trigger: {
      type: "manual",
      config: {},
    },
    steps,
    deployedAt: new Date(),
    deployedBy,
  };

  return {
    success: true,
    process,
    warnings: validation.issues
      .filter((i) => i.severity === "warning")
      .map((i) => i.message),
  };
}
