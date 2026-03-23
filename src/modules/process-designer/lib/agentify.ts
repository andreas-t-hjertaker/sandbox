/**
 * Agentifiserings-fase — LLM foreslår automatisering per steg.
 *
 * Analyserer prosessnoder og genererer agentifiseringsforslag
 * med autonominivå, verktøy og risikovurdering.
 */

import type { ProcessNode, AgentConfig } from "../types";

export type RiskLevel = "low" | "medium" | "high";

export type AgentifySuggestion = {
  nodeId: string;
  nodeLabel: string;
  recommended: boolean;
  autonomyLevel: 1 | 2 | 3 | 4 | 5;
  tools: string[];
  promptDraft: string;
  risk: RiskLevel;
  reasoning: string;
  agentConfig: AgentConfig;
};

/**
 * Generer agentifiseringsforslag for alle task-noder.
 * Brukes som fallback når LLM ikke er tilgjengelig,
 * eller som initial forslag som LLM kan raffinere.
 */
export function generateAgentifySuggestions(
  nodes: ProcessNode[]
): AgentifySuggestion[] {
  return nodes
    .filter((n) => n.type === "serviceTask" || n.type === "userTask")
    .map((node) => {
      const isService = node.type === "serviceTask";
      const hasMCP = !!node.mcpConfig;
      const label = node.label.toLowerCase();

      // Heuristisk risikovurdering
      const risk = assessRisk(label, isService);

      // Anbefalt autonominivå basert på type og risiko
      const autonomyLevel = recommendAutonomy(
        isService,
        risk,
        hasMCP
      );

      // Foreslå verktøy basert på label-heuristikk
      const tools = suggestTools(label);

      // Generer prompt-utkast
      const promptDraft = generatePromptDraft(node.label, tools);

      return {
        nodeId: node.id,
        nodeLabel: node.label,
        recommended: isService,
        autonomyLevel,
        tools,
        promptDraft,
        risk,
        reasoning: generateReasoning(node, autonomyLevel, risk),
        agentConfig: {
          autonomyLevel,
          llmPrompt: promptDraft,
          tools,
          maxIterations: risk === "high" ? 3 : risk === "medium" ? 5 : 10,
          timeout: risk === "high" ? 15000 : 30000,
          humanApprovalRequired: risk === "high" || !isService,
        },
      };
    });
}

function assessRisk(label: string, isService: boolean): RiskLevel {
  const highRiskKeywords = [
    "slett", "fjern", "betal", "overfør", "godkjenn",
    "send", "publiser", "deploy",
  ];
  const mediumRiskKeywords = [
    "opprett", "endre", "oppdater", "kontér", "bokfør",
    "faktur", "registrer",
  ];

  if (highRiskKeywords.some((k) => label.includes(k))) return "high";
  if (mediumRiskKeywords.some((k) => label.includes(k))) return "medium";
  if (!isService) return "medium";
  return "low";
}

function recommendAutonomy(
  isService: boolean,
  risk: RiskLevel,
  hasMCP: boolean
): 1 | 2 | 3 | 4 | 5 {
  if (!isService) return 1;
  if (risk === "high") return 2;
  if (risk === "medium") return hasMCP ? 3 : 2;
  return hasMCP ? 4 : 3;
}

function suggestTools(label: string): string[] {
  const tools: string[] = [];
  const mappings: [string[], string][] = [
    [["faktur", "kontér", "bilag", "bokfør"], "tripletex"],
    [["bank", "avstem", "transaksjon"], "bank-api"],
    [["ocr", "skann", "les"], "ocr"],
    [["mva", "avgift"], "altinn"],
    [["betal", "stripe"], "stripe"],
    [["send", "e-post", "varsl"], "email"],
    [["rapport", "generer"], "reporting"],
  ];

  for (const [keywords, tool] of mappings) {
    if (keywords.some((k) => label.includes(k))) {
      tools.push(tool);
    }
  }

  return tools;
}

function generatePromptDraft(label: string, tools: string[]): string {
  const toolStr = tools.length > 0 ? ` Bruk ${tools.join(", ")} for å utføre oppgaven.` : "";
  return `Utfør "${label}" automatisk.${toolStr} Verifiser resultatet og rapporter status.`;
}

function generateReasoning(
  node: ProcessNode,
  level: 1 | 2 | 3 | 4 | 5,
  risk: RiskLevel
): string {
  const riskLabels = { low: "lav", medium: "middels", high: "høy" };
  const levelLabels = [
    "kun forslag",
    "utfør med logging",
    "utfør med varsling",
    "full autonom med budsjett",
    "full autonom",
  ];
  return `Risiko: ${riskLabels[risk]}. Anbefaler nivå ${level} (${levelLabels[level - 1]}) for "${node.label}" fordi ${
    risk === "high"
      ? "handlingen kan ha store konsekvenser og bør godkjennes manuelt"
      : risk === "medium"
        ? "handlingen endrer data og bør logges grundig"
        : "handlingen er lavrisiko og kan automatiseres trygt"
  }.`;
}

/**
 * Appliser godkjente forslag på noder.
 */
export function applyAgentifySuggestions(
  nodes: ProcessNode[],
  approved: AgentifySuggestion[]
): ProcessNode[] {
  const approvedMap = new Map(approved.map((s) => [s.nodeId, s]));
  return nodes.map((node) => {
    const suggestion = approvedMap.get(node.id);
    if (suggestion) {
      return { ...node, agentConfig: suggestion.agentConfig };
    }
    return node;
  });
}
