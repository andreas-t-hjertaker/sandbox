/**
 * LLM Orchestrator — strukturert output for BPMN-generering.
 *
 * Bygger system-prompt med BPMN 2.0-kunnskap, detekterer samtalefase,
 * og parser strukturert output (ProcessPatch[]) fra LLM.
 *
 * Bruker Firebase AI SDK (client-side) i tråd med prosjektets arkitektur.
 */

import { z } from "zod";
import type { ProcessNode, ProcessEdge, ProcessDefinition } from "../types";

// ─── Samtalefaser ───────────────────────────────────────────

export type ConversationPhase =
  | "mapping"       // Kartlegging: «Hva trigger prosessen?»
  | "structuring"   // Strukturering: Returnerer noder og kanter
  | "agentifying"   // Agentifisering: Foreslår autonominivå per steg
  | "validating";   // Validering: Sjekker komplett prosess

export const PHASE_LABELS: Record<ConversationPhase, string> = {
  mapping: "Kartlegging",
  structuring: "Strukturering",
  agentifying: "Agentifisering",
  validating: "Validering",
};

// ─── Strukturert output fra LLM ────────────────────────────

/** LLM kan returnere en ProcessPatch (inkrementell) eller en full definisjon */
export const LLMResponseSchema = z.object({
  phase: z.enum(["mapping", "structuring", "agentifying", "validating"]),
  message: z.string(),
  patches: z
    .array(
      z.object({
        op: z.enum(["add", "remove", "replace"]),
        path: z.string(),
        value: z.unknown().optional(),
      })
    )
    .optional(),
  nodes: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum([
          "startEvent", "endEvent", "serviceTask", "userTask",
          "exclusiveGateway", "parallelGateway", "timerEvent", "errorEvent",
        ]),
        label: z.string(),
        position: z.object({ x: z.number(), y: z.number() }),
        agentConfig: z.object({
          autonomyLevel: z.number().min(1).max(5),
          llmPrompt: z.string(),
          tools: z.array(z.string()),
          maxIterations: z.number().default(10),
          timeout: z.number().default(30000),
          humanApprovalRequired: z.boolean().default(false),
        }).optional(),
        metadata: z.record(z.string(), z.unknown()).default({}),
      })
    )
    .optional(),
  edges: z
    .array(
      z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
        condition: z.string().optional(),
        label: z.string().optional(),
      })
    )
    .optional(),
  suggestions: z.array(z.string()).optional(),
});

export type LLMResponse = z.infer<typeof LLMResponseSchema>;

// ─── Fasedeteksjon ──────────────────────────────────────────

/**
 * Detekterer hvilken fase samtalen er i basert på prosessens tilstand
 * og antall meldinger.
 */
export function detectPhase(
  process: { nodes: ProcessNode[]; edges: ProcessEdge[] },
  messageCount: number
): ConversationPhase {
  if (process.nodes.length === 0 && messageCount < 4) return "mapping";
  if (process.nodes.length > 0 && !process.nodes.some((n) => n.agentConfig)) return "structuring";
  if (process.nodes.some((n) => n.agentConfig)) return "agentifying";
  return "validating";
}

// ─── System-prompt ──────────────────────────────────────────

const BPMN_KNOWLEDGE = `
Du er en BPMN 2.0-ekspert og prosessdesigner for regnskaps- og forretningsprosesser.
Du hjelper brukeren med å designe prosesser steg for steg gjennom fire faser:

FASE 1 — KARTLEGGING:
- Still spørsmål for å forstå prosessen: Hva trigger den? Hvem er involvert? Hva er sluttmålet?
- Identifiser nøkkelbeslutninger og parallelle oppgaver.
- Svar med kun tekst i denne fasen.

FASE 2 — STRUKTURERING:
- Konverter kartlagt prosess til BPMN-elementer (noder og kanter).
- Returner strukturert JSON med nodes[] og edges[].
- Bruk korrekte BPMN-typer: startEvent, endEvent, serviceTask, userTask, exclusiveGateway, parallelGateway.

FASE 3 — AGENTIFISERING:
- Foreslå autonominivå (1-5) for hvert serviceTask/userTask-steg.
- Anbefal MCP-verktøy og prompt-utkast per node.
- Gi risikovurdering.

FASE 4 — VALIDERING:
- Verifiser at prosessen er komplett og gyldig.
- Sjekk at alle noder er tilkoblet, start/slutt finnes, gateways har korrekte forbindelser.

VIKTIGE REGLER:
- Svar alltid på norsk med mindre brukeren skriver på et annet språk.
- Når du returnerer BPMN-data, inkluder det i en \`\`\`process-data kodeblokk med gyldig JSON.
- Regnskapskontekst: Norske regnskapsregler, NS 4102 kontoplan, MVA, SAF-T.
`.trim();

/**
 * Bygger system-prompt for prosessdesigner-chatten.
 */
export function buildDesignerSystemPrompt(
  phase: ConversationPhase,
  currentProcess?: { nodes: ProcessNode[]; edges: ProcessEdge[] }
): string {
  const parts: string[] = [BPMN_KNOWLEDGE];

  parts.push(`\nNåværende fase: ${PHASE_LABELS[phase]}`);

  if (currentProcess && currentProcess.nodes.length > 0) {
    parts.push(
      "\nNåværende prosessdefinisjon:",
      "```json",
      JSON.stringify(
        { nodes: currentProcess.nodes, edges: currentProcess.edges },
        null,
        2
      ),
      "```"
    );
  }

  // Fasespesifikke instruksjoner
  switch (phase) {
    case "mapping":
      parts.push(
        "\nInstruksjoner for kartlegging:",
        "- Still åpne spørsmål for å forstå prosessen",
        "- Etter 2-3 meldinger, oppsummer og bekreft forståelse",
        "- Foreslå oppfølgingsspørsmål som suggestion chips"
      );
      break;
    case "structuring":
      parts.push(
        "\nInstruksjoner for strukturering:",
        "- Konverter til BPMN-noder og kanter",
        "- Returner data i ```process-data kodeblokk",
        "- Plasser noder med 200px mellomrom horisontalt"
      );
      break;
    case "agentifying":
      parts.push(
        "\nInstruksjoner for agentifisering:",
        "- Analyser hvert steg og foreslå autonominivå",
        "- Returner oppdaterte noder med agentConfig i ```process-data",
        "- Gi risikovurdering: lav/middels/høy"
      );
      break;
    case "validating":
      parts.push(
        "\nInstruksjoner for validering:",
        "- Verifiser komplett prosess",
        "- Sjekk: start/slutt, alle noder tilkoblet, gateway-balanse",
        "- List eventuelle feil og foreslå fikser"
      );
      break;
  }

  return parts.join("\n");
}

// ─── Parser ─────────────────────────────────────────────────

/**
 * Parser strukturert output fra LLM-respons.
 * Henter ut `process-data` kodeblokker og validerer mot skjemaet.
 */
export function parseLLMResponse(response: string): {
  text: string;
  data: LLMResponse | null;
} {
  const codeBlockRegex = /```process-data\s*\n([\s\S]*?)\n```/g;
  let data: LLMResponse | null = null;

  const match = codeBlockRegex.exec(response);
  if (match) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const result = LLMResponseSchema.safeParse(parsed);
      if (result.success) {
        data = result.data;
      }
    } catch {
      // Ignorerer ugyldig JSON
    }
  }

  // Fjern kodeblokker fra teksten
  const text = response.replace(/```process-data\s*\n[\s\S]*?\n```/g, "").trim();

  return { text, data };
}

/**
 * Appliser patches fra LLM-respons på en prosessdefinisjon.
 * Returnerer oppdatert prosess med nye noder/kanter.
 */
export function applyLLMResponse(
  current: { nodes: ProcessNode[]; edges: ProcessEdge[] },
  data: LLMResponse
): { nodes: ProcessNode[]; edges: ProcessEdge[] } {
  let nodes = [...current.nodes];
  let edges = [...current.edges];

  // Hvis LLM returnerer hele noder/kanter, erstatt
  if (data.nodes) {
    nodes = data.nodes.map((n) => ({
      ...n,
      agentConfig: n.agentConfig
        ? {
            ...n.agentConfig,
            autonomyLevel: n.agentConfig.autonomyLevel as 1 | 2 | 3 | 4 | 5,
          }
        : undefined,
    }));
  }

  if (data.edges) {
    edges = data.edges;
  }

  return { nodes, edges };
}
