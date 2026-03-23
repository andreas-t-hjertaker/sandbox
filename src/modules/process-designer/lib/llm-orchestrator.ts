import type {
  ChatMessage,
  ChatPhase,
  ProcessDefinition,
  ProcessPatch,
  AgentifySuggestion,
} from "../types";

// ─── Phase-specific system prompts ──────────────────────────────────

const PHASE_PROMPTS: Record<ChatPhase, string> = {
  kartlegging: `Du er en prosessdesigner-assistent som kartlegger forretningsprosesser.
Still spørsmål for å forstå prosessen:
- Hva trigger prosessen?
- Hvem er involvert (roller/systemer)?
- Hvilke steg gjennomføres?
- Hvilke beslutninger tas underveis?
- Hva er sluttresultatet?
- Finnes det unntak eller feilsituasjoner?

Svar på norsk. Vær konkret og still oppfølgingsspørsmål.`,

  strukturering: `Du er en BPMN 2.0-ekspert som strukturerer prosesser.
Basert på kartleggingen, returner BPMN-noder og kanter som JSON patches.
Bruk korrekte BPMN-elementer:
- startEvent: Trigger/start
- endEvent: Sluttilstand
- serviceTask: Automatiserte steg
- userTask: Manuelle steg
- exclusiveGateway: Beslutningspunkt (XOR)
- parallelGateway: Parallelle steg (AND)
- timerEvent: Tidsstyrte hendelser
- errorEvent: Feilhåndtering

Returner som JSON patches (RFC 6902) for å oppdatere prosessdefinisjonen.`,

  agentifisering: `Du er en AI-agentifiseringsekspert.
Analyser hvert steg i prosessen og foreslå:
- Autonominivå (1-5)
- Relevante MCP-verktøy/integrasjoner
- Prompt-utkast for AI-agenten
- Risikovurdering (lav/middels/høy)

Fokuser på regnskapskontekst: kontering, faktura, bankavtemming, MVA, lønn.
Vurder compliance og sikkerhet i forslagene.`,

  validering: `Du er en BPMN-valideringsekspert.
Sjekk prosessen for:
- Strukturelle feil (manglende start/slutt, løse noder, gateway-feil)
- Semantiske feil (manglende konfig, betingelser)
- Best practices for agentifisering
- Sikkerhetshensyn

Returner feil og advarsler med forslag til fiks.`,
};

const BASE_SYSTEM_PROMPT = `Du er Process Agent Designer — en AI-assistent som hjelper brukere med å designe,
agentifisere og deploye forretningsprosesser i BPMN 2.0-format.

Kontekst: Norsk regnskapsbransje. Brukerne er regnskapsførere og controllere.

Svar ALLTID på norsk. Vær presis, profesjonell og hjelpsom.

Når du returnerer prosessendringer, bruk JSON Patch format (RFC 6902) i patches-feltet.`;

// ─── Phase detection ────────────────────────────────────────────────

export function detectPhase(
  messages: ChatMessage[],
  currentProcess: ProcessDefinition
): ChatPhase {
  const hasNodes = currentProcess.nodes.length > 0;
  const hasAgentConfig = currentProcess.nodes.some((n) => n.agentConfig);
  const messageCount = messages.filter((m) => m.role === "user").length;

  if (!hasNodes && messageCount < 5) return "kartlegging";
  if (hasNodes && !hasAgentConfig) return "strukturering";
  if (hasAgentConfig) return "agentifisering";
  return "validering";
}

// ─── Build prompt ───────────────────────────────────────────────────

export function buildSystemPrompt(
  phase: ChatPhase,
  process: ProcessDefinition,
  domainRules?: string
): string {
  let prompt = BASE_SYSTEM_PROMPT + "\n\n" + PHASE_PROMPTS[phase];

  if (domainRules) {
    prompt += `\n\n## Domeneregler (må alltid følges)\n${domainRules}`;
  }

  if (process.nodes.length > 0) {
    prompt += `\n\n## Nåværende prosess\nNoder: ${process.nodes.length}, Kanter: ${process.edges.length}\n`;
    prompt += `Noder: ${process.nodes.map((n) => `${n.id}(${n.type}: ${n.label})`).join(", ")}`;
  }

  return prompt;
}

// ─── Suggestion generation ──────────────────────────────────────────

export function generateSuggestions(phase: ChatPhase): string[] {
  const suggestions: Record<ChatPhase, string[]> = {
    kartlegging: [
      "Hva trigger denne prosessen?",
      "Hvem er involvert?",
      "Beskriv hovedstegene",
      "Finnes det unntak?",
    ],
    strukturering: [
      "Legg til en beslutningsport",
      "Parallelliser disse stegene",
      "Legg til feilhåndtering",
      "Vis meg forslaget som BPMN",
    ],
    agentifisering: [
      "Foreslå automatisering for alle steg",
      "Hvilke steg bør ha manuell godkjenning?",
      "Koble til Tripletex for kontering",
      "Sett lavere autonomi på betalingssteg",
    ],
    validering: [
      "Valider hele prosessen",
      "Sjekk gateway-betingelsene",
      "Er alle agenter konfigurert?",
      "Klar for deploy?",
    ],
  };

  return suggestions[phase] || [];
}

// ─── Message format for API ─────────────────────────────────────────

export interface LLMRequest {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  systemPrompt: string;
  phase: ChatPhase;
  processId: string;
}

export interface LLMResponse {
  content: string;
  patches?: ProcessPatch;
  suggestions?: string[];
  phase?: ChatPhase;
  agentifySuggestions?: AgentifySuggestion[];
}

export function buildLLMRequest(
  messages: ChatMessage[],
  process: ProcessDefinition,
  phase: ChatPhase,
  domainRules?: string
): LLMRequest {
  return {
    messages: messages.map((m) => ({
      role: m.role === "system" ? "system" : m.role,
      content: m.content,
    })),
    systemPrompt: buildSystemPrompt(phase, process, domainRules),
    phase,
    processId: process.id,
  };
}
